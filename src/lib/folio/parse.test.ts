import assert from "node:assert/strict";
import JSZip from "jszip";
import { ingestSources } from "./parse";
import { archiveHtml, samples } from "./samples";

export async function runFolioChecks() {
  const gpt = await ingestSources([samples[0].input]);
  assert.equal(gpt.docs.length, 1);
  assert.equal(gpt.docs[0]?.kind, "chatgpt");
  assert.equal(gpt.docs[0]?.messages.some((message) => message.text.includes("Черновик")), false);
  assert.ok(gpt.docs[0]?.messages.some((message) => message.text.includes("Честного ЗНАКа")));
  assert.ok(gpt.docs[0]?.tables.length);
  assert.ok(gpt.docs[0]?.tree);

  const claude = await ingestSources([samples[1].input]);
  assert.equal(claude.docs[0]?.kindLabel, "Claude");
  assert.equal(claude.docs[0]?.messages.length, 2);
  assert.equal(claude.docs[0]?.messages.some((message) => message.text.includes("внутренний черновик")), false);

  const md = await ingestSources([samples[2].input]);
  assert.equal(md.docs[0]?.title, "Методика смены");
  assert.equal(md.docs[0]?.messages.length, 2);
  assert.match(md.docs[0]?.prose ?? "", /предисловие/);

  const html = await ingestSources([samples[3].input]);
  assert.equal(html.docs[0]?.messages[0]?.role, "Пользователь");
  assert.match(html.docs[0]?.messages[1]?.text ?? "", /отметка/);

  const csv = await ingestSources([samples[4].input]);
  assert.deepEqual(csv.docs[0]?.tables[0]?.headers, ["Этап", "Срок", "Кто"]);
  assert.equal(csv.docs[0]?.tables[0]?.rows.length, 3);
  assert.match(csv.docs[0]?.tables[0]?.rows[2]?.[0] ?? "", /ЗНАК/);

  const empty = await ingestSources([{ name: "001.html", text: archiveHtml }]);
  assert.equal(empty.docs[0]?.title, "Create effective flashcards");
  assert.match(empty.docs[0]?.prose ?? "", /нет сообщений/);

  const duplicate = await ingestSources([
    samples[2].input,
    { name: "смена.html", text: `<h1>Методика смены</h1><article><h3>Пользователь</h3><pre>короче</pre></article>` },
  ]);
  assert.equal(duplicate.docs.length, 1);
  assert.equal(duplicate.docs[0]?.kind, "markdown");

  const zip = new JSZip();
  zip.file("note.md", "# Заметка\n\nОбычный текст без ролей, со списком.\n\n- один\n- два");
  zip.file("text-index.js", "window.archiveTexts=[]");
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const archived = await ingestSources([{ name: "export.zip", bytes }]);
  assert.equal(archived.docs.length, 1);
  assert.equal(archived.docs[0]?.title, "Заметка");

  const dialogue = await ingestSources([{
    name: "grok.json",
    text: JSON.stringify({ messages: [{ role: "user", content: "Привет" }, { role: "assistant", content: [{ type: "text", text: "Здравствуйте" }] }] }),
  }]);
  assert.equal(dialogue.docs[0]?.messages.length, 2);
  assert.equal(dialogue.docs[0]?.kindLabel, "Grok");
}
