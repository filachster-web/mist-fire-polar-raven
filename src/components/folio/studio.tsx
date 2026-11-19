import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileUp, FolderOpen, Search } from "lucide-react";
import { DocumentView } from "@/components/folio/viewer";
import { downloadDiagram, downloadDocx, downloadHtml, downloadMarkdown, downloadPdf, downloadXlsx } from "@/lib/folio/export";
import { base64ToBytes, ingestSources } from "@/lib/folio/parse";
import { fetchRemoteFile, normalizeRemoteUrl } from "@/lib/folio/remote";
import { samples } from "@/lib/folio/samples";
import { deleteBundle, getBundle, listBundles, saveBundle, type BundleMeta } from "@/lib/folio/store";
import type { Bundle, SourceInput } from "@/lib/folio/types";
import { cn } from "@/lib/utils";

type Mode = "doc" | "table" | "map";

async function filesFromList(fileList: File[]): Promise<File[]> {
  return fileList.filter((file) => file.size <= 8_000_000 || file.name.toLowerCase().endsWith(".zip")).slice(0, 400);
}

async function readEntry(entry: FileSystemEntry, bag: File[], budget: { left: number }): Promise<void> {
  if (budget.left <= 0) return;
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
    bag.push(file);
    budget.left -= 1;
    return;
  }
  if (!entry.isDirectory) return;
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const entries: FileSystemEntry[] = [];
  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (!batch.length) break;
    entries.push(...batch);
  }
  for (const child of entries) await readEntry(child, bag, budget);
}

export function Studio({ initial = null, home = false }: { initial?: Bundle | null; home?: boolean }) {
  const router = useRouter();
  const fetchRemote = useServerFn(fetchRemoteFile);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const [bundle, setBundle] = useState<Bundle | null>(initial);
  const [activeId, setActiveId] = useState<string | null>(initial?.docs[0]?.id ?? null);
  const [mode, setMode] = useState<Mode>("doc");
  const [query, setQuery] = useState("");
  const [showService, setShowService] = useState(false);
  const [scope, setScope] = useState<"one" | "all">("one");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drag, setDrag] = useState(false);
  const [library, setLibrary] = useState<BundleMeta[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    listBundles().then(setLibrary).catch(() => setLibrary([]));
  }, []);

  useEffect(() => {
    dirRef.current?.setAttribute("webkitdirectory", "");
    dirRef.current?.setAttribute("directory", "");
  }, [bundle]);

  const active = bundle?.docs.find((doc) => doc.id === activeId) ?? bundle?.docs[0] ?? null;
  const serviceCount = active?.messages.filter((message) => message.roleKey === "tool" || message.roleKey === "system").length ?? 0;

  async function run(inputs: SourceInput[]) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await ingestSources(inputs);
      setBundle(next);
      setActiveId(next.docs[0]?.id ?? null);
      setMode("doc");
      setQuery("");
      try {
        await saveBundle(next);
        setLibrary(await listBundles());
      } catch {
        setNotice("Набор открыт, но в библиотеку браузера не поместился.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не получилось обработать");
    } finally {
      setBusy(false);
    }
  }

  async function process() {
    const inputs: SourceInput[] = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      inputs.push({ name: file.webkitRelativePath || file.name, bytes });
    }
    const raw = url.trim();
    if (raw) {
      if (/^[a-zA-Z]:\\/.test(raw) || /^(\/Users\/|\/home\/|\\\\|~\/)/.test(raw)) {
        setError("Браузер не открывает путь на диске. Нажмите «Папка на компьютере» и укажите этот каталог — чтение останется у вас.");
        return;
      }
      if (/^https?:\/\//i.test(raw)) {
        try {
          const normalized = normalizeRemoteUrl(raw);
          const remote = await fetchRemote({ data: { url: normalized } });
          inputs.push({ name: remote.filename || "remote", bytes: base64ToBytes(remote.base64) });
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Ссылка не открылась");
          return;
        }
      } else {
        inputs.push({ name: guessName(raw), text: raw });
      }
    }
    if (!inputs.length) {
      setError("Добавьте файл, папку или ссылку.");
      return;
    }
    await run(inputs);
  }

  async function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDrag(false);
    const items = [...event.dataTransfer.items];
    const entries = items.map((item) => item.webkitGetAsEntry?.()).filter((entry): entry is FileSystemEntry => !!entry);
    if (entries.length) {
      const bag: File[] = [];
      const budget = { left: 400 };
      for (const entry of entries) await readEntry(entry, bag, budget);
      if (bag.length) {
        setFiles(await filesFromList(bag));
        setNotice(`В очереди ${bag.length} файл.`);
        return;
      }
    }
    setFiles(await filesFromList([...event.dataTransfer.files]));
  }

  async function share() {
    if (!bundle) return;
    try {
      await saveBundle(bundle);
      const href = router.buildLocation({ to: "/view/$id", params: { id: bundle.id } }).href;
      await navigator.clipboard.writeText(new URL(href, window.location.origin).toString());
      setNotice("Ссылка скопирована. Она открывается в этом браузере. Чтобы отправить документ, скачайте HTML и выложите файл — это и есть прямая страница просмотра.");
    } catch {
      setNotice("Не удалось скопировать ссылку.");
    }
  }

  async function openSaved(id: string) {
    const saved = await getBundle(id);
    if (!saved) return;
    setBundle(saved);
    setActiveId(saved.docs[0]?.id ?? null);
    setError("");
  }

  const shownDocs = (bundle?.docs ?? []).filter((doc) => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return true;
    return `${doc.title} ${doc.summary} ${doc.kindLabel}`.toLowerCase().includes(needle);
  });

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-semibold text-bg">F</span>
            <span className="text-base font-semibold tracking-tight">Folio</span>
          </Link>
          <p className="hidden text-sm text-muted sm:block">Документы из архивов ИИ</p>
          <div className="ml-auto flex items-center gap-2">
            {!home ? (
              <Link to="/" className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-muted">Новый разбор</Link>
            ) : bundle ? (
              <button type="button" className="h-11 rounded-full px-3 text-sm font-medium text-muted" onClick={() => { setBundle(null); setFiles([]); setUrl(""); setError(""); setNotice(""); }}>Новый разбор</button>
            ) : null}
            {library.length && !bundle ? (
              <span className="text-sm tabular-nums text-muted">{library.length} в библиотеке</span>
            ) : null}
          </div>
        </div>
      </header>

      {!bundle ? (
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          <p className="text-sm font-medium text-accent">Локальная обработка</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Архив чата становится документом.</h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-muted">
            Claude, ChatGPT, Gemini, Grok, Markdown, JSON, HTML, CSV и ZIP. Формат определяется сам. Файлы читаются в браузере и не уходят на сервер — кроме случая, когда вы сами вставляете ссылку.
          </p>
          <Intake
            url={url}
            setUrl={setUrl}
            files={files}
            drag={drag}
            busy={busy}
            error={error}
            notice={notice}
            fileRef={fileRef}
            dirRef={dirRef}
            onDrop={onDrop}
            setDrag={setDrag}
            onFiles={(list) => {
              setFiles(list);
              setNotice(list.length ? `В очереди ${list.length}.` : "");
            }}
            onProcess={() => void process()}
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {samples.map((sample) => (
              <button key={sample.id} type="button" className="h-11 rounded-full bg-surface px-4 text-sm font-medium text-ink ring-1 ring-line" onClick={() => void run([sample.input])}>
                {sample.label}
              </button>
            ))}
          </div>
          {library.length ? (
            <section className="mt-12">
              <h2 className="text-sm font-semibold text-ink">Недавние</h2>
              <ul className="mt-3 divide-y divide-line rounded-3xl bg-surface ring-1 ring-line">
                {library.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4">
                    <button type="button" className="h-14 min-w-0 flex-1 text-left" onClick={() => void openSaved(item.id)}>
                      <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                      <span className="text-xs text-muted">{item.detected} · {item.count}</span>
                    </button>
                    <button type="button" className="h-11 px-2 text-sm text-muted" onClick={() => void deleteBundle(item.id).then(() => setLibrary((rows) => rows.filter((row) => row.id !== item.id)))}>
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>
      ) : (
        <div className="mx-auto grid max-w-6xl lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="no-print border-line lg:min-h-[calc(100vh-4rem)] lg:border-r">
            <div className="px-4 py-4">
              <label className="flex h-11 items-center gap-2 rounded-full bg-surface px-3 ring-1 ring-line">
                <Search className="h-4 w-4 text-muted" />
                <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Найти беседу" className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
              </label>
            </div>
            <ul className="max-h-72 overflow-auto px-2 pb-4 lg:max-h-[calc(100vh-8rem)]">
              {shownDocs.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(doc.id);
                      setQuery("");
                    }}
                    className={cn("w-full rounded-2xl px-3 py-3 text-left", doc.id === active?.id ? "bg-soft" : "")}
                  >
                    <span className="block truncate text-sm font-medium text-ink">{doc.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted">{doc.kindLabel} · {doc.messages.length || doc.tables.length || 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <section className="min-w-0 px-4 py-4 sm:px-6">
            <div className="no-print mb-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Segment value={mode} onChange={setMode} />
                <div className="ml-auto flex rounded-full bg-soft p-1">
                  <button type="button" className={cn("h-9 rounded-full px-3 text-sm", scope === "one" ? "bg-surface text-ink" : "text-muted")} onClick={() => setScope("one")}>Этот</button>
                  <button type="button" className={cn("h-9 rounded-full px-3 text-sm", scope === "all" ? "bg-surface text-ink" : "text-muted")} onClick={() => setScope("all")}>Все</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!active}
                  onClick={() => {
                    if (!active) return;
                    downloadHtml(bundle, active, scope);
                    setNotice(
                      scope === "all"
                        ? "Скачан один HTML со всеми документами. Файл открывается в любом браузере."
                        : "HTML скачан. Откройте файл или отправьте его — страница смотрится без Folio.",
                    );
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-bg disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Скачать HTML
                </button>
                <Tool onClick={() => active && void downloadDocx(bundle, active, scope)}>Word</Tool>
                <Tool onClick={() => active && void downloadXlsx(bundle, active, scope)}>Excel</Tool>
                <Tool onClick={() => {
                  if (!active) return;
                  setNotice("Собираю PDF…");
                  void downloadPdf(bundle, active, scope)
                    .then(() => setNotice("PDF скачан. Откройте файл в любой программе для чтения."))
                    .catch(() => setNotice("Не удалось собрать PDF."));
                }}>PDF</Tool>
                <Tool onClick={() => active && void downloadDocx(bundle, active, scope).then(() => setNotice("Файл .docx открывается в Google Документах: Файл → Открыть."))}>Google Документы</Tool>
                <Tool onClick={() => active && downloadMarkdown(active)}>Markdown</Tool>
                <Tool onClick={() => active && downloadDiagram(active)}>Схема SVG</Tool>
                <Tool onClick={() => void share()}>Ссылка</Tool>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-11 min-w-64 flex-1 items-center gap-2 rounded-full bg-surface px-3 ring-1 ring-line">
                  <Search className="h-4 w-4 text-muted" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по открытому документу" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
                </label>
                {serviceCount ? (
                  <button type="button" className={cn("h-11 rounded-full px-4 text-sm font-medium ring-1 ring-line", showService ? "bg-ink text-bg" : "bg-surface text-ink")} onClick={() => setShowService((value) => !value)}>
                    Служебные · {serviceCount}
                  </button>
                ) : null}
              </div>
              {notice ? <p className="text-sm text-muted">{notice}</p> : null}
              {bundle.issues.length ? <p className="text-sm text-muted">Пропущено: {bundle.issues.slice(0, 3).map((issue) => `${issue.file} — ${issue.message}`).join("; ")}</p> : null}
            </div>
            {active ? <DocumentView key={active.id + mode} doc={active} mode={mode} query={query} showService={showService} /> : null}
          </section>
        </div>
      )}
    </div>
  );
}

function guessName(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "вставка.json";
  if (/^<!doctype html|<html[\s>]/i.test(trimmed)) return "вставка.html";
  return "вставка.md";
}

function Segment({ value, onChange }: { value: Mode; onChange: (mode: Mode) => void }) {
  const items: { id: Mode; label: string }[] = [
    { id: "doc", label: "Документ" },
    { id: "table", label: "Таблица" },
    { id: "map", label: "Схема" },
  ];
  return (
    <div className="flex rounded-full bg-soft p-1">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onChange(item.id)} className={cn("h-9 rounded-full px-4 text-sm font-medium", value === item.id ? "bg-ink text-bg" : "text-muted")}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Tool({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-11 rounded-full bg-surface px-4 text-sm font-medium text-ink ring-1 ring-line">
      {children}
    </button>
  );
}

function Intake({
  url, setUrl, files, drag, busy, error, notice, fileRef, dirRef, onDrop, setDrag, onFiles, onProcess,
}: {
  url: string;
  setUrl: (value: string) => void;
  files: File[];
  drag: boolean;
  busy: boolean;
  error: string;
  notice: string;
  fileRef: React.RefObject<HTMLInputElement | null>;
  dirRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (event: React.DragEvent) => void;
  setDrag: (value: boolean) => void;
  onFiles: (files: File[]) => void;
  onProcess: () => void;
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={cn("mt-8 rounded-3xl bg-surface p-4 ring-1 sm:p-6", drag ? "ring-accent" : "ring-line")}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onProcess();
          }}
          placeholder="Ссылка, путь к папке или вставленный текст"
          className="h-12 w-full rounded-full bg-bg px-4 text-sm text-ink outline-none ring-1 ring-line placeholder:text-muted"
        />
        <button type="button" disabled={busy} onClick={onProcess} className="h-12 shrink-0 rounded-full bg-ink px-6 text-sm font-semibold text-bg disabled:opacity-50">
          {busy ? "Читаю…" : "Обработать"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line">
          <FileUp className="h-4 w-4" /> Файлы
        </button>
        <button type="button" onClick={() => dirRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line">
          <FolderOpen className="h-4 w-4" /> Папка на компьютере
        </button>
        {files.length ? <span className="self-center text-sm text-muted">{files.length} выбрано</span> : null}
      </div>
      <input ref={fileRef} type="file" multiple accept=".md,.markdown,.txt,.json,.jsonl,.csv,.tsv,.html,.htm,.zip,text/*,application/json,application/zip" className="hidden" onChange={(event) => onFiles([...(event.target.files ?? [])])} />
      <input ref={dirRef} type="file" multiple className="hidden" onChange={(event) => onFiles([...(event.target.files ?? [])])} />
      {error ? <p className="mt-4 text-sm text-ink">{error}</p> : null}
      {notice ? <p className="mt-3 text-sm text-muted">{notice}</p> : null}
    </div>
  );
}
