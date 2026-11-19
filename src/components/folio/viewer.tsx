import { useMemo, useState } from "react";
import { MarkdownView } from "@/components/folio/markdown-view";
import { displayTime } from "@/components/folio/format";
import { cn } from "@/lib/utils";
import type { FolioDoc, Message, TableData, TreeNode } from "@/lib/folio/types";

export function DocumentView({
  doc,
  mode,
  query,
  showService,
}: {
  doc: FolioDoc;
  mode: "doc" | "table" | "map";
  query: string;
  showService: boolean;
}) {
  if (mode === "table") return <TableMode doc={doc} query={query} showService={showService} />;
  if (mode === "map") return <MapMode doc={doc} />;
  return <DocMode doc={doc} query={query} showService={showService} />;
}

function visibleMessages(doc: FolioDoc, query: string, showService: boolean): Message[] {
  const needle = query.trim().toLowerCase();
  return doc.messages.filter((message) => {
    if (!showService && (message.roleKey === "tool" || message.roleKey === "system")) return false;
    if (!needle) return true;
    return `${message.role} ${message.text}`.toLowerCase().includes(needle);
  });
}

function DocMode({ doc, query, showService }: { doc: FolioDoc; query: string; showService: boolean }) {
  const messages = visibleMessages(doc, query, showService);
  const [limit, setLimit] = useState(36);
  const shown = query.trim() ? messages.slice(0, 200) : messages.slice(0, limit);
  return (
    <article id="folio-sheet" className="mx-auto w-full max-w-3xl rounded-3xl bg-surface px-5 py-8 shadow-lg ring-1 ring-line sm:px-12 sm:py-12">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{doc.kindLabel}</p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{doc.title}</h1>
      <p className="mt-3 text-sm text-muted">{doc.sourceName}</p>
      {doc.prose ? (
        <div className="mt-8">
          <MarkdownView source={doc.prose} />
        </div>
      ) : null}
      {shown.length ? (
        <div className="mt-8">
          {shown.map((message, index) => (
            <section key={`${message.time ?? "t"}-${index}`} className="msg border-t border-line py-7">
              <header className="mb-3 flex items-baseline justify-between gap-4">
                <h2 className={cn("text-sm font-semibold", message.roleKey === "assistant" ? "text-accent" : "text-ink")}>
                  {message.role}
                </h2>
                {message.time ? <time className="shrink-0 text-xs tabular-nums text-muted">{displayTime(message.time)}</time> : null}
              </header>
              <MarkdownView source={message.text} />
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">{query.trim() ? "В этом документе нет таких строк." : "В документе нет сообщений."}</p>
      )}
      {!query.trim() && shown.length < messages.length ? (
        <button type="button" className="mt-2 h-11 rounded-full bg-soft px-5 text-sm font-medium text-ink" onClick={() => setLimit((value) => value + 40)}>
          Показать ещё {Math.min(40, messages.length - shown.length)}
        </button>
      ) : null}
    </article>
  );
}

function TableMode({ doc, query, showService }: { doc: FolioDoc; query: string; showService: boolean }) {
  const messages = visibleMessages(doc, query, showService);
  const tables = doc.tables.length ? doc.tables : [];
  const [sheet, setSheet] = useState(messages.length ? "messages" : "0");
  const needle = query.trim().toLowerCase();
  return (
    <div id="folio-sheet" className="overflow-hidden rounded-3xl bg-surface shadow-lg ring-1 ring-line">
      <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3">
        {messages.length ? (
          <SheetButton active={sheet === "messages"} onClick={() => setSheet("messages")}>Сообщения</SheetButton>
        ) : null}
        {tables.map((table, index) => (
          <SheetButton key={table.name + index} active={sheet === String(index)} onClick={() => setSheet(String(index))}>
            {table.name}
          </SheetButton>
        ))}
      </div>
      <div className="overflow-x-auto">
        {sheet === "messages" ? (
          <MessageTable messages={messages} />
        ) : (
          <DataTable table={tables[Number(sheet)] ?? tables[0]} needle={needle} />
        )}
      </div>
    </div>
  );
}

function SheetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("h-10 shrink-0 rounded-full px-4 text-sm font-medium", active ? "bg-ink text-bg" : "text-muted")}>
      {children}
    </button>
  );
}

function MessageTable({ messages }: { messages: Message[] }) {
  const [sort, setSort] = useState<"role" | "time" | "text">("time");
  const [dir, setDir] = useState<1 | -1>(1);
  const rows = useMemo(() => {
    const copy = [...messages];
    copy.sort((a, b) => {
      const left = sort === "role" ? a.role : sort === "time" ? a.time ?? "" : a.text;
      const right = sort === "role" ? b.role : sort === "time" ? b.time ?? "" : b.text;
      return left.localeCompare(right, "ru") * dir;
    });
    return copy;
  }, [messages, sort, dir]);
  const toggle = (key: "role" | "time" | "text") => {
    if (sort === key) setDir((value) => (value === 1 ? -1 : 1));
    else {
      setSort(key);
      setDir(1);
    }
  };
  return (
    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
      <thead className="sticky top-0 bg-surface">
        <tr className="text-xs uppercase tracking-wide text-muted">
          <Th onClick={() => toggle("role")}>Роль</Th>
          <Th onClick={() => toggle("time")}>Время</Th>
          <Th onClick={() => toggle("text")}>Текст</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((message, index) => (
          <tr key={`${message.time ?? "m"}-${index}`} className="border-t border-line align-top">
            <td className="w-36 px-4 py-3 font-medium text-ink">{message.role}</td>
            <td className="w-44 px-4 py-3 tabular-nums text-muted">{message.time ? displayTime(message.time) : ""}</td>
            <td className="px-4 py-3 text-ink"><p className="whitespace-pre-wrap text-pretty">{message.text}</p></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <th className="px-4 py-3 font-medium">
      <button type="button" className="h-11" onClick={onClick}>{children}</button>
    </th>
  );
}

function DataTable({ table, needle }: { table: TableData | undefined; needle: string }) {
  const [sort, setSort] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  if (!table) return <p className="p-8 text-sm text-muted">В этом документе нет таблицы.</p>;
  const rows = table.rows.filter((row) => !needle || row.join(" ").toLowerCase().includes(needle));
  const sorted = [...rows].sort((a, b) => (a[sort] ?? "").localeCompare(b[sort] ?? "", "ru", { numeric: true }) * dir);
  return (
    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-muted">
          {table.headers.map((header, index) => (
            <th key={header + index} className="px-4 py-3 font-medium">
              <button
                type="button"
                className="h-11"
                onClick={() => {
                  if (sort === index) setDir((value) => (value === 1 ? -1 : 1));
                  else {
                    setSort(index);
                    setDir(1);
                  }
                }}
              >
                {header || "—"}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, index) => (
          <tr key={index} className="border-t border-line align-top">
            {table.headers.map((_, cell) => (
              <td key={cell} className="px-4 py-3 text-ink"><p className="whitespace-pre-wrap">{row[cell] ?? ""}</p></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MapMode({ doc }: { doc: FolioDoc }) {
  const tree = doc.tree ?? messageFlow(doc);
  return (
    <div id="folio-sheet" className="rounded-3xl bg-surface p-5 shadow-lg ring-1 ring-line sm:p-8">
      <h2 className="mb-6 text-lg font-semibold tracking-tight text-ink">Схема</h2>
      <Tree node={tree} />
    </div>
  );
}

function messageFlow(doc: FolioDoc): TreeNode {
  const messages = doc.messages.filter((message) => message.roleKey === "user" || message.roleKey === "assistant");
  const source = messages.length ? messages : doc.messages;
  return {
    id: doc.id,
    label: doc.title,
    active: true,
    children: source.slice(0, 60).map((message, index) => ({
      id: `${doc.id}-${index}`,
      label: message.role,
      detail: message.text.replace(/\s+/g, " ").slice(0, 180),
      active: true,
      children: [],
    })),
  };
}

function Tree({ node }: { node: TreeNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className={cn("rounded-2xl bg-bg px-4 py-3 ring-1", node.active ? "ring-accent" : "ring-line")}>
        <p className="text-sm font-semibold text-ink">{node.label}</p>
        {node.detail ? <p className="mt-1 text-sm text-pretty text-muted">{node.detail}</p> : null}
      </div>
      {node.children.length ? (
        <div className="ml-4 flex flex-col gap-3 border-l border-line pl-4 sm:ml-8">
          {node.children.map((child) => (
            <Tree key={child.id} node={child} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
