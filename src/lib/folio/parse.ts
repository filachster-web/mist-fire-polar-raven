import JSZip from "jszip";
import { tablesInMarkdown } from "./markdown";
import type { Bundle, FolioDoc, Issue, Message, RoleKey, SourceInput, TableData, TreeNode } from "./types";

const MAX_FILE = 8_000_000;
const MAX_ENTRIES = 400;

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function fileBase(name: string): string {
  return name.split(/[/\\]/).pop() || name;
}

function fileTitle(name: string): string {
  const base = fileBase(name).replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/^\d+[\s._-]*/, "").replace(/[_]+/g, " ").trim();
  return cleaned || base || "Без названия";
}

function decodeEntities(input: string): string {
  let value = input;
  const named: Array<[string, string]> = [
    ["nbsp", " "],
    ["quot", '"'],
    ["#39", "'"],
    ["apos", "'"],
    ["lt", "<"],
    ["gt", ">"],
    ["amp", "&"],
  ];
  for (let pass = 0; pass < 2; pass += 1) {
    for (const [name, ch] of named) value = value.replaceAll("&" + name + ";", ch);
    value = value.replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)));
    value = value.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
  }
  return value;
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function summarize(messages: Message[], prose: string | null): string {
  const source = messages.find((message) => message.roleKey === "user")?.text || messages[0]?.text || prose || "";
  const flat = source.replace(/\s+/g, " ").trim();
  return flat.slice(0, 180) || "Пустой документ";
}

function collectTables(messages: Message[], prose: string | null): TableData[] {
  const chunks = [prose ?? "", ...messages.map((message) => message.text)].filter(Boolean);
  const tables: TableData[] = [];
  for (const chunk of chunks) {
    for (const table of tablesInMarkdown(chunk)) {
      if (!table.headers.length) continue;
      tables.push({ name: `Таблица ${tables.length + 1}`, headers: table.headers, rows: table.rows });
    }
  }
  return tables.slice(0, 12);
}

function makeDoc(partial: {
  title: string;
  sourceName: string;
  kind: string;
  kindLabel: string;
  messages?: Message[];
  tables?: TableData[];
  tree?: TreeNode | null;
  prose?: string | null;
}): FolioDoc {
  const messages = partial.messages ?? [];
  const prose = partial.prose ?? null;
  return {
    id: nextId("doc"),
    title: partial.title.trim() || fileTitle(partial.sourceName),
    sourceName: partial.sourceName,
    kind: partial.kind,
    kindLabel: partial.kindLabel,
    summary: summarize(messages, prose),
    messages,
    tables: partial.tables ?? collectTables(messages, prose),
    tree: partial.tree ?? null,
    prose,
  };
}

function normalizeSpeaker(raw: string): { role: string; roleKey: RoleKey } {
  const value = raw.trim();
  const key = value.toLowerCase();
  if (/^(user|human|пользователь|вы|you)$/.test(key)) return { role: "Пользователь", roleKey: "user" };
  if (/claude/.test(key)) return { role: "Claude", roleKey: "assistant" };
  if (/chatgpt|\bgpt\b|openai/.test(key)) return { role: "ChatGPT", roleKey: "assistant" };
  if (/gemini/.test(key)) return { role: "Gemini", roleKey: "assistant" };
  if (/grok/.test(key)) return { role: "Grok", roleKey: "assistant" };
  if (/^(assistant|model|bot|ассистент|ai)$/.test(key)) return { role: "Ассистент", roleKey: "assistant" };
  if (/system|система/.test(key)) return { role: "Система", roleKey: "system" };
  if (/tool|function|инструмент/.test(key)) return { role: value || "Инструмент", roleKey: "tool" };
  return { role: value || "Сообщение", roleKey: "other" };
}

function timeOf(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function cellString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (!isRecord(part)) return "";
        if (typeof part.text === "string") return part.text;
        if (typeof part.content === "string") return part.content;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (isRecord(content) && typeof content.text === "string") return content.text;
  return "";
}

function partText(part: unknown): string {
  if (typeof part === "string") return part;
  if (!isRecord(part)) return "";
  if (typeof part.text === "string") return part.text;
  if (typeof part.asset_pointer === "string" || part.content_type === "image_asset_pointer") return "[изображение]";
  return "";
}

function chatGptMessageText(message: Record<string, unknown>): string {
  const meta = isRecord(message.metadata) ? message.metadata : {};
  if (meta.is_visually_hidden_from_conversation === true) return "";
  const content = isRecord(message.content) ? message.content : {};
  if (Array.isArray(content.parts)) return content.parts.map(partText).filter(Boolean).join("\n").trim();
  if (typeof content.text === "string") return content.text.trim();
  return "";
}

function isChatGptConversation(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && isRecord(value.mapping) && (typeof value.title === "string" || typeof value.current_node === "string");
}

function isClaudeConversation(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Array.isArray(value.chat_messages);
}

function messageFromRoleRecord(record: Record<string, unknown>): Message | null {
  const rawRole = record.role ?? record.sender ?? record.author ?? record.from;
  if (typeof rawRole !== "string") return null;
  const body = contentToText(record.content ?? record.text ?? record.message ?? record.body);
  if (!body.trim()) return null;
  const speaker = normalizeSpeaker(rawRole);
  return {
    role: speaker.role,
    roleKey: speaker.roleKey,
    time: timeOf(record.create_time ?? record.created_at ?? record.timestamp ?? record.time),
    text: body.trim(),
  };
}

function chatGptDoc(conversation: Record<string, unknown>, sourceName: string): FolioDoc {
  const mapping = conversation.mapping as Record<string, unknown>;
  let leaf = typeof conversation.current_node === "string" ? conversation.current_node : "";
  if (!leaf || !isRecord(mapping[leaf])) {
    leaf = Object.keys(mapping).find((id) => {
      const node = mapping[id];
      return isRecord(node) && (!Array.isArray(node.children) || node.children.length === 0);
    }) ?? "";
  }
  const path: string[] = [];
  const seen = new Set<string>();
  let cursor = leaf;
  while (cursor && !seen.has(cursor)) {
    const node = mapping[cursor];
    if (!isRecord(node)) break;
    seen.add(cursor);
    path.unshift(cursor);
    const parent = node.parent;
    cursor = typeof parent === "string" ? parent : "";
  }
  const active = new Set(path);
  const messages: Message[] = [];
  for (const id of path) {
    const node = mapping[id];
    if (!isRecord(node) || !isRecord(node.message)) continue;
    const message = node.message;
    const text = chatGptMessageText(message);
    if (!text) continue;
    const author = isRecord(message.author) ? message.author : {};
    const rawRole = typeof author.role === "string" ? author.role : "other";
    const recipient = typeof message.recipient === "string" ? message.recipient : "all";
    let speaker = normalizeSpeaker(rawRole === "assistant" ? "ChatGPT" : rawRole);
    if (rawRole === "tool" || (recipient !== "all" && rawRole !== "user" && rawRole !== "assistant")) {
      const name = typeof author.name === "string" && author.name ? author.name : "Инструмент";
      speaker = { role: name, roleKey: "tool" };
    }
    if (rawRole === "assistant") {
      const slug = isRecord(message.metadata) && typeof message.metadata.model_slug === "string" ? message.metadata.model_slug : "";
      speaker = { role: slug ? `ChatGPT · ${slug}` : "ChatGPT", roleKey: "assistant" };
    }
    messages.push({
      role: speaker.role,
      roleKey: speaker.roleKey,
      time: timeOf(message.create_time),
      text,
    });
  }
  return makeDoc({
    title: typeof conversation.title === "string" && conversation.title.trim() ? conversation.title : fileTitle(sourceName),
    sourceName,
    kind: "chatgpt",
    kindLabel: "ChatGPT",
    messages,
    tree: chatGptTree(mapping, active),
  });
}

function chatGptTree(mapping: Record<string, unknown>, active: Set<string>): TreeNode | null {
  const ids = Object.keys(mapping);
  if (!ids.length) return null;
  const roots = ids.filter((id) => {
    const node = mapping[id];
    if (!isRecord(node)) return false;
    const parent = node.parent;
    return parent == null || parent === "" || !isRecord(mapping[String(parent)]);
  });
  const budget = { count: 0 };
  const walk = (id: string, seen: Set<string>): TreeNode | null => {
    if (seen.has(id) || budget.count > 80) return null;
    seen.add(id);
    const node = mapping[id];
    if (!isRecord(node)) return null;
    const message = isRecord(node.message) ? node.message : null;
    const text = message ? chatGptMessageText(message) : "";
    const children = (Array.isArray(node.children) ? node.children : [])
      .map((child) => walk(String(child), seen))
      .filter((child): child is TreeNode => !!child);
    if (!text && children.length === 0) return null;
    budget.count += 1;
    const author = message && isRecord(message.author) && typeof message.author.role === "string" ? message.author.role : "Узел";
    return {
      id,
      label: normalizeSpeaker(author === "assistant" ? "ChatGPT" : author).role,
      detail: text ? text.replace(/\s+/g, " ").slice(0, 180) : undefined,
      active: active.has(id),
      children,
    };
  };
  const children = roots.map((id) => walk(id, new Set<string>())).filter((node): node is TreeNode => !!node);
  if (!children.length) return null;
  if (children.length === 1) return children[0];
  return { id: nextId("tree"), label: "Ветви", children };
}

function claudeText(message: Record<string, unknown>): string {
  const chunks: string[] = [];
  if (typeof message.text === "string" && message.text.trim()) chunks.push(message.text.trim());
  if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (!isRecord(block)) continue;
      const type = typeof block.type === "string" ? block.type : "";
      if ((type === "text" || type === "") && typeof block.text === "string") chunks.push(block.text.trim());
      else if (type === "tool_result") {
        const nested = contentToText(block.content);
        if (nested.trim()) chunks.push(nested.trim().slice(0, 4000));
      }
    }
  }
  const unique: string[] = [];
  for (const chunk of chunks.map((item) => item.trim()).filter(Boolean)) {
    if (unique.some((item) => item === chunk || item.includes(chunk))) continue;
    const shorter = unique.findIndex((item) => chunk.includes(item));
    if (shorter >= 0) unique[shorter] = chunk;
    else unique.push(chunk);
  }
  return unique.join("\n\n").trim();
}

function claudeDoc(conversation: Record<string, unknown>, sourceName: string): FolioDoc {
  const messages: Message[] = [];
  for (const item of Array.isArray(conversation.chat_messages) ? conversation.chat_messages : []) {
    if (!isRecord(item)) continue;
    const text = claudeText(item);
    if (!text) continue;
    const sender = typeof item.sender === "string" ? item.sender : "assistant";
    const speaker = normalizeSpeaker(sender);
    messages.push({
      role: speaker.role,
      roleKey: speaker.roleKey,
      time: timeOf(item.created_at ?? item.create_time),
      text,
    });
  }
  const title = typeof conversation.name === "string" && conversation.name.trim()
    ? conversation.name
    : typeof conversation.title === "string" && conversation.title.trim()
      ? conversation.title
      : fileTitle(sourceName);
  return makeDoc({ title, sourceName, kind: "claude", kindLabel: "Claude", messages });
}

function objectsToTable(rows: Record<string, unknown>[], name: string): TableData {
  const headers: string[] = [];
  for (const row of rows.slice(0, 500)) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key) && headers.length < 16) headers.push(key);
    }
  }
  return {
    name,
    headers,
    rows: rows.slice(0, 2000).map((row) => headers.map((header) => cellString(row[header]))),
  };
}

function jsonTree(value: unknown, label: string, depth: number, budget: { count: number }): TreeNode {
  if (budget.count > 160 || depth > 5) {
    return { id: nextId("node"), label, detail: "…", children: [] };
  }
  budget.count += 1;
  if (Array.isArray(value)) {
    return {
      id: nextId("node"),
      label: `${label} · ${value.length}`,
      children: value.slice(0, 24).map((item, index) => jsonTree(item, String(index + 1), depth + 1, budget)),
    };
  }
  if (isRecord(value)) {
    const keys = Object.keys(value).slice(0, 24);
    return {
      id: nextId("node"),
      label,
      children: keys.map((key) => jsonTree(value[key], key, depth + 1, budget)),
    };
  }
  const detail = cellString(value).replace(/\s+/g, " ").slice(0, 160);
  return { id: nextId("node"), label, detail, children: [] };
}

function roleMessages(records: Record<string, unknown>[]): Message[] {
  return records.map(messageFromRoleRecord).filter((message): message is Message => !!message);
}

function docsFromJson(data: unknown, sourceName: string): FolioDoc[] {
  const root = unwrapContainer(data);
  if (Array.isArray(root) && root.length && root.every(isChatGptConversation)) {
    return root.map((item) => chatGptDoc(item, sourceName));
  }
  if (isChatGptConversation(root)) return [chatGptDoc(root, sourceName)];
  if (Array.isArray(root) && root.length && root.every(isClaudeConversation)) {
    return root.map((item) => claudeDoc(item, sourceName));
  }
  if (isClaudeConversation(root)) return [claudeDoc(root, sourceName)];
  if (Array.isArray(root) && root.length && root.every((item) => isRecord(item) && messageFromRoleRecord(item))) {
    const records = root.filter(isRecord);
    return [makeDoc({
      title: fileTitle(sourceName),
      sourceName,
      kind: "dialogue",
      kindLabel: "Диалог",
      messages: roleMessages(records),
    })];
  }
  if (isRecord(root) && Array.isArray(root.messages)) {
    const records = root.messages.filter(isRecord);
    const messages = roleMessages(records);
    if (messages.length) {
      const label = /gemini/i.test(sourceName) ? "Gemini" : /grok/i.test(sourceName) ? "Grok" : "Диалог";
      return [makeDoc({
        title: typeof root.title === "string" ? root.title : fileTitle(sourceName),
        sourceName,
        kind: "dialogue",
        kindLabel: label,
        messages,
      })];
    }
  }
  if (isRecord(root) && Array.isArray(root.choices)) {
    const messages = root.choices.filter(isRecord).map((choice) => {
      const message = isRecord(choice.message) ? choice.message : choice;
      return messageFromRoleRecord(message);
    }).filter((message): message is Message => !!message);
    if (messages.length) {
      return [makeDoc({ title: fileTitle(sourceName), sourceName, kind: "dialogue", kindLabel: "Диалог", messages })];
    }
  }
  if (Array.isArray(root) && root.length && root.every((item) => isRecord(item) && (item.header === "Gemini Apps" || (typeof item.title === "string" && /^prompted\s/i.test(item.title))))) {
    const messages: Message[] = root.filter(isRecord).map((item) => {
      const title = typeof item.title === "string" ? item.title.replace(/^prompted\s+/i, "") : "";
      return {
        role: "Пользователь",
        roleKey: "user" as const,
        time: timeOf(item.time),
        text: title,
      };
    }).filter((message) => message.text);
    return [makeDoc({ title: "Gemini", sourceName, kind: "gemini", kindLabel: "Gemini", messages })];
  }
  if (Array.isArray(root) && root.length && root.every(isRecord)) {
    const rows = root.filter(isRecord);
    return [makeDoc({
      title: fileTitle(sourceName),
      sourceName,
      kind: "json-table",
      kindLabel: "JSON",
      tables: [objectsToTable(rows, "Записи")],
      tree: jsonTree(data, "JSON", 0, { count: 0 }),
      prose: null,
    })];
  }
  return [makeDoc({
    title: fileTitle(sourceName),
    sourceName,
    kind: "json",
    kindLabel: "JSON",
    tree: jsonTree(data, fileTitle(sourceName), 0, { count: 0 }),
    prose: "```json\n" + safePretty(data) + "\n```",
  })];
}

function unwrapContainer(data: unknown): unknown {
  if (!isRecord(data)) return data;
  if (Array.isArray(data.conversations)) return data.conversations;
  if (Array.isArray(data.chats)) return data.chats;
  return data;
}

function safePretty(data: unknown): string {
  try {
    const text = JSON.stringify(data, null, 2) ?? "";
    return text.length > 80_000 ? `${text.slice(0, 80_000)}\n…` : text;
  } catch {
    return "";
  }
}

function looksLikeRole(heading: string): boolean {
  const head = heading.split("·")[0]?.trim() ?? heading;
  return /^(пользователь|ассистент|assistant|chatgpt|claude|gemini|grok|система|system|инструмент|human|user|model|tool|bot|gpt|вы|you)(?![\p{L}\p{N}])/iu.test(head);
}

function splitRoleTime(heading: string): { role: string; time?: string } {
  const [role, time] = heading.split("·").map((part) => part.trim());
  return { role: role || heading, time: time || undefined };
}

function docsFromMarkdown(text: string, sourceName: string, kindLabel = "Markdown"): FolioDoc[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let title = fileTitle(sourceName);
  let start = 0;
  if (lines[0]?.startsWith("# ")) {
    title = lines[0].slice(2).trim() || title;
    start = 1;
  }
  const messages: Message[] = [];
  const preface: string[] = [];
  let current: Message | null = null;
  for (const line of lines.slice(start)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading && looksLikeRole(heading[1])) {
      const parts = splitRoleTime(heading[1]);
      const speaker = normalizeSpeaker(parts.role);
      current = { role: speaker.role, roleKey: speaker.roleKey, time: parts.time, text: "" };
      messages.push(current);
      continue;
    }
    if (current) current.text += `${line}\n`;
    else preface.push(line);
  }
  if (!messages.length) {
    return [makeDoc({
      title,
      sourceName,
      kind: "markdown",
      kindLabel,
      prose: text.trim(),
    })];
  }
  for (const message of messages) message.text = message.text.trim();
  const prefaceText = preface.join("\n").trim();
  return [makeDoc({
    title,
    sourceName,
    kind: "markdown",
    kindLabel,
    messages: messages.filter((message) => message.text),
    prose: prefaceText || null,
  })];
}

function docsFromHtml(html: string, sourceName: string): FolioDoc[] {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
  const title = stripTags(titleMatch || h1Match || "") || fileTitle(sourceName);
  const articles = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)];
  if (articles.length) {
    const messages: Message[] = [];
    for (const article of articles) {
      const body = article[1] ?? "";
      const roleRaw = stripTags(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i.exec(body)?.[1] || "Сообщение");
      const time = stripTags(/<small[^>]*>([\s\S]*?)<\/small>/i.exec(body)?.[1] || "") || undefined;
      const pre = /<pre[^>]*>([\s\S]*?)<\/pre>/i.exec(body)?.[1];
      const text = (pre != null ? decodeEntities(pre) : stripTags(body)).trim();
      const speaker = normalizeSpeaker(roleRaw);
      if (!text) continue;
      messages.push({
        role: speaker.roleKey === "other" ? roleRaw : speaker.role,
        roleKey: speaker.roleKey,
        time,
        text,
      });
    }
    return [makeDoc({ title, sourceName, kind: "html", kindLabel: "HTML", messages })];
  }
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: decodeEntities(match[1] ?? ""), text: stripTags(match[2] ?? "") }))
    .filter((link) => link.text && !link.href.startsWith("#") && !/^javascript:/i.test(link.href));
  if (links.length >= 6) {
    return [makeDoc({
      title,
      sourceName,
      kind: "catalog",
      kindLabel: "Каталог",
      tables: [{ name: "Файлы", headers: ["Название", "Ссылка"], rows: links.slice(0, 2000).map((link) => [link.text, link.href]) }],
      prose: "Это каталог архива. Загрузите папку целиком или отдельные беседы — каждая откроется документом.",
    })];
  }
  const withoutNoise = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = decodeEntities(withoutNoise.replace(/<[^>]+>/g, "\n")).replace(/\n{3,}/g, "\n\n").trim();
  if (/accounts\.google\.com|ServiceLogin/i.test(html)) {
    throw new Error("Ссылка ведёт на страницу входа Google. Скачайте файл и загрузите его сюда.");
  }
  return [makeDoc({ title, sourceName, kind: "html", kindLabel: "HTML", prose: text })];
}

function detectDelimiter(header: string): string {
  const counts = [
    { mark: "\t", count: header.split("\t").length },
    { mark: ";", count: header.split(";").length },
    { mark: ",", count: header.split(",").length },
  ];
  counts.sort((a, b) => b.count - a.count);
  return counts[0] && counts[0].count > 1 ? counts[0].mark : ",";
}

export function parseDelimited(text: string): TableData {
  const source = text.replace(/^\uFEFF/, "");
  const headerLine = source.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const delimiter = detectDelimiter(headerLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const filtered = rows.filter((line) => line.some((item) => item.trim()));
  const headers = (filtered.shift() ?? []).map((item) => item.trim());
  return { name: "Таблица", headers, rows: filtered };
}

function docsFromTable(text: string, sourceName: string): FolioDoc[] {
  const table = parseDelimited(text);
  return [makeDoc({
    title: fileTitle(sourceName),
    sourceName,
    kind: "csv",
    kindLabel: "Таблица",
    tables: [table],
    prose: null,
  })];
}

function skipEntry(name: string): boolean {
  const base = fileBase(name).toLowerCase();
  if (!base || base.startsWith(".") || base.startsWith("._")) return true;
  if (base === "text-index.js" || base === "catalog.js" || base === "style.css") return true;
  if (name.split(/[/\\]/).includes("__MACOSX")) return true;
  return false;
}

function extensionOf(name: string): string {
  const base = fileBase(name).toLowerCase();
  const index = base.lastIndexOf(".");
  return index >= 0 ? base.slice(index) : "";
}

function looksBinary(bytes: Uint8Array): boolean {
  const length = Math.min(bytes.length, 800);
  let zeros = 0;
  for (let index = 0; index < length; index += 1) if (bytes[index] === 0) zeros += 1;
  return zeros > 0;
}

function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function isZip(name: string, bytes: Uint8Array): boolean {
  if (extensionOf(name) === ".zip") return true;
  return bytes.length > 3 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

async function docsFromText(name: string, text: string): Promise<FolioDoc[]> {
  const ext = extensionOf(name);
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (ext === ".csv" || ext === ".tsv") return docsFromTable(text, name);
  if (ext === ".jsonl") {
    const rows = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
    return docsFromJson(rows, name);
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[") || ext === ".json") {
    try {
      return docsFromJson(JSON.parse(trimmed) as unknown, name);
    } catch (error) {
      if (ext === ".json") {
        throw new Error(error instanceof Error ? `JSON не разобран: ${error.message}` : "JSON не разобран");
      }
    }
  }
  if (ext === ".html" || ext === ".htm" || /^<!doctype html/i.test(trimmed) || /<article\b/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    return docsFromHtml(text, name);
  }
  return docsFromMarkdown(text, name, ext === ".txt" ? "Текст" : "Markdown");
}

async function expandInput(input: SourceInput, depth: number, issues: Issue[]): Promise<FolioDoc[]> {
  const name = input.name || "без-имени";
  if (skipEntry(name)) return [];
  const bytes = input.bytes ?? (input.text != null ? new TextEncoder().encode(input.text) : new Uint8Array());
  if (bytes.byteLength > MAX_FILE) throw new Error("Файл больше 8 МБ");
  if (/\.pdf$/i.test(name)) throw new Error("PDF как исходник не читается. Сначала разберите текст, PDF будет на выходе.");
  if (isZip(name, bytes)) {
    if (depth > 1) throw new Error("Слишком глубокая вложенность архива");
    const zip = await JSZip.loadAsync(bytes);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir).slice(0, MAX_ENTRIES);
    const docs: FolioDoc[] = [];
    for (const entry of entries) {
      if (skipEntry(entry.name)) continue;
      try {
        const content = await entry.async("uint8array");
        docs.push(...await expandInput({ name: entry.name, bytes: content }, depth + 1, issues));
      } catch (error) {
        issues.push({ file: entry.name, message: error instanceof Error ? error.message : "Не прочитан" });
      }
    }
    return docs;
  }
  if (looksBinary(bytes)) throw new Error("Это не текстовый файл");
  return docsFromText(name, input.text ?? decodeText(bytes));
}

function richness(doc: FolioDoc): number {
  return doc.messages.length * 10 + (doc.prose?.length ?? 0) + doc.tables.reduce((sum, table) => sum + table.rows.length, 0);
}

function dedupeDocs(docs: FolioDoc[]): FolioDoc[] {
  const kept: FolioDoc[] = [];
  const indexByTitle = new Map<string, number>();
  for (const doc of docs) {
    const key = doc.title.trim().toLowerCase();
    const generic = key.length < 2 || /^(без названия|untitled|index|каталог)$/i.test(key);
    if (generic) {
      kept.push(doc);
      continue;
    }
    const existing = indexByTitle.get(key);
    if (existing == null) {
      indexByTitle.set(key, kept.length);
      kept.push(doc);
      continue;
    }
    const previous = kept[existing];
    if (!previous) continue;
    const better = richness(doc) > richness(previous) || (richness(doc) === richness(previous) && doc.kind === "markdown");
    if (better) kept[existing] = doc;
  }
  return kept;
}

export async function ingestSources(inputs: SourceInput[]): Promise<Bundle> {
  const issues: Issue[] = [];
  const docs: FolioDoc[] = [];
  for (const input of inputs) {
    try {
      docs.push(...await expandInput(input, 0, issues));
    } catch (error) {
      issues.push({ file: fileBase(input.name || "файл"), message: error instanceof Error ? error.message : "Не прочитан" });
    }
  }
  const unique = dedupeDocs(docs).filter((doc) => doc.messages.length || doc.prose || doc.tables.length || doc.tree);
  if (!unique.length) {
    throw new Error(issues[0]?.message || "Не нашёл читаемых документов. Подойдут JSON, Markdown, TXT, HTML, CSV и ZIP.");
  }
  const labels = [...new Set(unique.map((doc) => doc.kindLabel))];
  const title = unique.length === 1 ? unique[0].title : `Набор · ${unique.length}`;
  return {
    id: nextId("bundle"),
    title,
    createdAt: new Date().toISOString(),
    detected: labels.join(", "),
    docs: unique,
    issues,
  };
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
