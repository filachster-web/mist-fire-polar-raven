import type { Tokens } from "marked";
import { marked, renderMarkdown } from "./markdown";
import type { Bundle, FolioDoc, Message, TableData, TreeNode } from "./types";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "\u0026amp;";
    if (char === "<") return "\u0026lt;";
    if (char === ">") return "\u0026gt;";
    if (char === '"') return "\u0026quot;";
    return "\u0026#39;";
  });
}

export function safeFileName(value: string): string {
  const cleaned = value.replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^_+|_+$/g, "");
  return (cleaned || "folio").slice(0, 80);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function excelSafe(value: string): string {
  const clipped = value.length > 32_000 ? `${value.slice(0, 32_000)}…` : value;
  return /^[=+\-@]/.test(clipped) ? `'${clipped}` : clipped;
}

export function toMarkdown(doc: FolioDoc): string {
  const parts = [`# ${doc.title}`, ""];
  if (doc.prose) parts.push(doc.prose, "");
  for (const message of doc.messages) {
    parts.push(`## ${message.role}${message.time ? ` · ${message.time}` : ""}`, "", message.text, "");
  }
  if (!doc.prose) {
    for (const table of doc.tables) parts.push(tableMarkdown(table), "");
  }
  return parts.join("\n");
}

function tableMarkdown(table: TableData): string {
  const headers = table.headers.length ? table.headers : ["Значение"];
  const lines = [
    `## ${table.name}`,
    "",
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
  ];
  for (const row of table.rows) {
    lines.push(`| ${headers.map((_, index) => (row[index] ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`);
  }
  return lines.join("\n");
}

function sheetHtml(doc: FolioDoc): string {
  const prose = doc.prose ? `<div class="prose">${renderMarkdown(doc.prose)}</div>` : "";
  const messages = doc.messages
    .map((message) => {
      return `<article><header><strong>${escapeHtml(message.role)}</strong>${message.time ? `<time>${escapeHtml(message.time)}</time>` : ""}</header><div class="prose">${renderMarkdown(message.text)}</div></article>`;
    })
    .join("");
  const tables = doc.prose
    ? ""
    : doc.tables
        .map((table) => {
          const head = table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
          const body = table.rows
            .map((row) => `<tr>${table.headers.map((_, index) => `<td>${escapeHtml(row[index] ?? "")}</td>`).join("")}</tr>`)
            .join("");
          return `<h2>${escapeHtml(table.name)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
        })
        .join("");
  return `${prose}${messages}${tables}`;
}

const PAGE_CSS = `
  body { margin: 0; background: #f5f5f7; color: #1d1d1f; font: 17px/1.6 Manrope, "Segoe UI", sans-serif; }
  main { max-width: 820px; margin: 32px auto; background: #fff; padding: 48px 40px 64px; border-radius: 18px; }
  h1 { font-size: 34px; line-height: 1.15; letter-spacing: -0.03em; margin: 0 0 8px; }
  .meta { color: #6e6e73; font-size: 13px; margin-bottom: 28px; }
  article { padding: 22px 0; border-top: 1px solid #d2d2d7; }
  article header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
  time { color: #6e6e73; font-size: 12px; }
  a { color: #0071e3; }
  pre { background: #1d1d1f; color: #f5f5f7; padding: 14px 16px; border-radius: 12px; overflow: auto; }
  code { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 0.86em; }
  p code { background: #e8e8ed; padding: 0.1em 0.35em; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { border-bottom: 1px solid #d2d2d7; text-align: left; padding: 8px 10px; vertical-align: top; }
  blockquote { margin: 1em 0; padding-left: 14px; border-left: 2px solid #0071e3; color: #6e6e73; }
  img { max-width: 100%; }
`;

export function documentHtml(doc: FolioDoc): string {
  return pageShell(doc.title, docBody(doc));
}

function docBody(doc: FolioDoc): string {
  return `<h1>${escapeHtml(doc.title)}</h1><p class="meta">${escapeHtml(doc.kindLabel)} · ${escapeHtml(doc.sourceName)}</p>${sheetHtml(doc)}`;
}

function pageShell(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>${PAGE_CSS}</style></head><body><main>${body}</main></body></html>`;
}

export function downloadHtml(bundle: Bundle, doc: FolioDoc, scope: "one" | "all" = "one") {
  const docs = docsOf(bundle, doc, scope);
  const title = scope === "all" ? bundle.title : doc.title;
  const body = docs
    .map((item, index) => {
      const gap = index ? ` style="margin-top:48px;padding-top:32px;border-top:1px solid #d2d2d7"` : "";
      return `<section${gap}>${docBody(item)}</section>`;
    })
    .join("");
  downloadBlob(`${safeFileName(title)}.html`, new Blob([pageShell(title, body)], { type: "text/html;charset=utf-8" }));
}

export function downloadMarkdown(doc: FolioDoc) {
  downloadBlob(`${safeFileName(doc.title)}.md`, new Blob([toMarkdown(doc)], { type: "text/markdown;charset=utf-8" }));
}

function docsOf(bundle: Bundle, doc: FolioDoc, scope: "one" | "all"): FolioDoc[] {
  return scope === "all" ? bundle.docs : [doc];
}

type PdfContent = string | PdfContent[] | { [key: string]: unknown };

type PdfMakeApi = {
  addVirtualFileSystem: (vfs: Record<string, string>) => void;
  createPdf: (definition: object) => { getBlob: () => Promise<Blob> };
};

let pdfReady: Promise<PdfMakeApi> | null = null;

function loadPdfMake(): Promise<PdfMakeApi> {
  pdfReady ??= import("pdfmake/build/pdfmake")
    .then(async (pdfModule) => {
      const fontModule = await import("pdfmake/build/vfs_fonts");
      const pdfMake = pdfModule.default;
      pdfMake.addVirtualFileSystem(fontModule.default);
      return pdfMake;
    })
    .catch((error: unknown) => {
      pdfReady = null;
      throw error;
    });
  return pdfReady;
}

function clipText(value: string, max = 8000): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function safeHref(href: string): string | null {
  return /^(https?:|mailto:)/i.test(href) ? href : null;
}

function inlineRuns(paragraph: Tokens.Paragraph): PdfContent[] {
  const tokens = paragraph.tokens ?? [];
  if (!tokens.length) return [clipText(paragraph.text) || " "];
  return tokens.map((inline) => {
    if (inline.type === "strong") return { text: inline.text, bold: true };
    if (inline.type === "em") return { text: inline.text, italics: true };
    if (inline.type === "codespan") return { text: inline.text, background: "#e8e8ed", fontSize: 10 };
    if (inline.type === "link") {
      const href = safeHref(inline.href);
      return href ? { text: inline.text || href, color: "#0071e3", link: href } : (inline.text || href || "");
    }
    if (inline.type === "br") return "\n";
    if ("text" in inline && typeof inline.text === "string") return inline.text;
    return "";
  });
}

function columnGroups(count: number): number[][] {
  if (count <= 0) return [];
  const limit = 10;
  if (count <= limit) return [Array.from({ length: count }, (_, index) => index)];
  const keys = count > 1 ? [0, 1] : [0];
  const rest = Array.from({ length: count }, (_, index) => index).filter((index) => !keys.includes(index));
  const room = limit - keys.length;
  const groups: number[][] = [];
  for (let start = 0; start < rest.length; start += room) groups.push([...keys, ...rest.slice(start, start + room)]);
  return groups;
}

function projectColumns(headers: string[], rows: string[][], indexes: number[]) {
  return {
    headers: indexes.map((index) => headers[index] ?? ""),
    rows: rows.map((row) => indexes.map((index) => row[index] ?? "")),
  };
}

function pdfTable(headers: string[], rows: string[][], caption?: string): PdfContent {
  const wide = headers.length >= 7;
  const size = wide ? 8 : 9;
  const head = headers.map((header) => ({ text: header || " ", bold: true, fontSize: size, color: "#6e6e73" }));
  const body = rows.map((row) => headers.map((_, index) => ({ text: row[index] || " ", fontSize: size })));
  const table: PdfContent = {
    table: { headerRows: 1, widths: headers.map(() => "*"), body: body.length ? [head, ...body] : [head], dontBreakRows: false },
    layout: "lightHorizontalLines",
    margin: [0, 4, 0, 10],
  };
  return caption ? { stack: [{ text: caption, style: "h3" }, table] } : table;
}

function pdfTables(headers: string[], rows: string[][], caption?: string): PdfContent[] {
  const groups = columnGroups(headers.length);
  return groups.map((indexes, group) => {
    const projected = projectColumns(headers, rows, indexes);
    const note = group === 0
      ? caption
      : `${caption ? `${caption} · ` : ""}продолжение · ${indexes.map((index) => headers[index] || String(index + 1)).join(" · ")}`;
    return pdfTable(projected.headers, projected.rows, note);
  });
}

function markdownToPdf(source: string): PdfContent[] {
  const blocks: PdfContent[] = [];
  for (const token of marked.lexer(source || "")) {
    if (token.type === "heading") {
      const heading = token as Tokens.Heading;
      blocks.push({ text: heading.text || " ", style: heading.depth <= 2 ? "h2" : "h3" });
    } else if (token.type === "paragraph") {
      blocks.push({ text: inlineRuns(token as Tokens.Paragraph), margin: [0, 1, 0, 6] });
    } else if (token.type === "code") {
      blocks.push({ text: clipText((token as Tokens.Code).text, 6000) || " ", style: "code" });
    } else if (token.type === "list") {
      const list = token as Tokens.List;
      const items = list.items.map((item) => clipText(item.text.replace(/\s+/g, " ").trim(), 2000) || " ");
      blocks.push({ [list.ordered ? "ol" : "ul"]: items.length ? items : [" "], margin: [0, 2, 0, 8] });
    } else if (token.type === "blockquote") {
      blocks.push({ text: clipText((token as Tokens.Blockquote).text, 4000) || " ", style: "quote" });
    } else if (token.type === "table") {
      const table = token as Tokens.Table;
      const headers = table.header.map((cell) => cell.text);
      if (!headers.length) continue;
      const rows = table.rows.map((row) => headers.map((_, index) => row[index]?.text ?? ""));
      blocks.push(...pdfTables(headers, rows));
    } else if (token.type === "image") {
      const image = token as Tokens.Image;
      const label = image.text || "Изображение";
      const href = /^https?:\/\//i.test(image.href) ? image.href : "";
      blocks.push({ text: href ? `${label} — ${href}` : label, color: "#0071e3", margin: [0, 2, 0, 6] });
    } else if (token.type === "html") {
      const text = (token as Tokens.HTML).text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) blocks.push({ text: clipText(text), margin: [0, 1, 0, 6] });
    }
  }
  if (!blocks.length && source.trim()) blocks.push({ text: clipText(source), margin: [0, 0, 0, 6] });
  return blocks;
}

function docPdf(doc: FolioDoc, breakBefore: boolean): PdfContent[] {
  const blocks: PdfContent[] = [
    { text: doc.title || "Документ", style: "title", pageBreak: breakBefore ? "before" : undefined },
    { text: `${doc.kindLabel} · ${doc.sourceName}`, style: "meta" },
  ];
  if (doc.prose) blocks.push(...markdownToPdf(doc.prose));
  for (const message of doc.messages) {
    const role: PdfContent = { text: message.role || "Сообщение", style: message.roleKey === "assistant" ? "roleAccent" : "role" };
    blocks.push(
      message.time
        ? { columns: [role, { text: message.time, style: "time", width: "auto" }], columnGap: 12, margin: [0, 12, 0, 4] }
        : { ...role, margin: [0, 12, 0, 4] },
    );
    blocks.push(...markdownToPdf(message.text || " "));
  }
  if (!doc.prose && doc.messages.length === 0) {
    for (const table of doc.tables) {
      const headers = table.headers.length ? table.headers : ["Значение"];
      blocks.push(...pdfTables(headers, table.rows, table.name));
    }
  }
  return blocks;
}

export async function downloadPdf(bundle: Bundle, doc: FolioDoc, scope: "one" | "all") {
  const docs = docsOf(bundle, doc, scope);
  const title = scope === "all" ? bundle.title : doc.title;
  const pdfMake = await loadPdfMake();
  const file = pdfMake.createPdf({
    info: { title },
    pageSize: "A4",
    pageMargins: [48, 56, 48, 56],
    defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.28, color: "#1d1d1f" },
    styles: {
      title: { fontSize: 22, bold: true, margin: [0, 0, 0, 4] },
      meta: { fontSize: 10, color: "#6e6e73", margin: [0, 0, 0, 8] },
      h2: { fontSize: 15, bold: true, margin: [0, 12, 0, 4] },
      h3: { fontSize: 13, bold: true, margin: [0, 10, 0, 3] },
      role: { fontSize: 12, bold: true, color: "#1d1d1f" },
      roleAccent: { fontSize: 12, bold: true, color: "#0071e3" },
      time: { fontSize: 9, color: "#6e6e73", alignment: "right" },
      code: { fontSize: 9, background: "#f5f5f7", margin: [0, 4, 0, 8] },
      quote: { italics: true, color: "#6e6e73", margin: [10, 4, 0, 8] },
    },
    footer: (current: number, count: number) => ({
      text: `${current} / ${count}`,
      alignment: "right",
      margin: [0, 16, 48, 0],
      fontSize: 9,
      color: "#6e6e73",
    }),
    content: docs.flatMap((item, index) => docPdf(item, index > 0)),
  });
  downloadBlob(`${safeFileName(title)}.pdf`, await file.getBlob());
}

export async function downloadDocx(bundle: Bundle, doc: FolioDoc, scope: "one" | "all") {
  const docs = docsOf(bundle, doc, scope);
  const name = `${safeFileName(scope === "all" ? bundle.title : doc.title)}.docx`;
  try {
    const { Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } = await import("docx");
    const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [];
    const pushMarkdown = (source: string) => {
      for (const token of marked.lexer(source)) appendToken(token);
    };
    const appendToken = (token: Tokens.Generic) => {
      if (token.type === "heading") {
        const heading = token as Tokens.Heading;
        const depth = Math.min(Math.max(heading.depth, 1), 4) as 1 | 2 | 3 | 4;
        const level = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][depth - 1];
        children.push(new Paragraph({ text: heading.text, heading: level }));
      } else if (token.type === "paragraph") {
        children.push(new Paragraph({ children: runsFrom(token as Tokens.Paragraph) }));
      } else if (token.type === "code") {
        const code = token as Tokens.Code;
        children.push(new Paragraph({
          children: [new TextRun({ text: code.text, font: "Consolas", size: 18 })],
          shading: { type: ShadingType.CLEAR, fill: "F5F5F7" },
        }));
      } else if (token.type === "list") {
        const list = token as Tokens.List;
        list.items.forEach((item, index) => {
          children.push(new Paragraph({ text: `${list.ordered ? `${index + 1}.` : "•"} ${item.text}` }));
        });
      } else if (token.type === "blockquote") {
        children.push(new Paragraph({ children: [new TextRun({ text: (token as Tokens.Blockquote).text, italics: true, color: "6E6E73" })] }));
      } else if (token.type === "table") {
        children.push(...markdownTable(token as Tokens.Table));
      } else if (token.type === "image") {
        const image = token as Tokens.Image;
        const label = image.text || "Изображение";
        const href = /^https?:\/\//i.test(image.href) ? image.href : "";
        children.push(new Paragraph({ children: [new TextRun({ text: href ? `${label} — ${href}` : label, color: "0071E3" })] }));
      } else if (token.type === "space" || token.type === "hr") {
        children.push(new Paragraph({ text: "" }));
      }
    };
    const runsFrom = (paragraph: Tokens.Paragraph) => {
      const tokens = paragraph.tokens ?? [];
      if (!tokens.length) return [new TextRun(paragraph.text)];
      return tokens.map((inline) => {
        if (inline.type === "strong") return new TextRun({ text: inline.text, bold: true });
        if (inline.type === "em") return new TextRun({ text: inline.text, italics: true });
        if (inline.type === "codespan") return new TextRun({ text: inline.text, font: "Consolas" });
        if (inline.type === "link") return new TextRun({ text: inline.text, color: "0071E3" });
        if (inline.type === "text" || inline.type === "escape") return new TextRun(inline.text);
        return new TextRun("text" in inline ? String(inline.text ?? "") : "");
      });
    };
    const markdownTable = (table: Tokens.Table) => {
      const headers = table.header.map((cell) => cell.text);
      const rows = table.rows.map((row) => row.map((cell) => cell.text));
      return groupedTables(headers, rows);
    };
    const groupedTables = (headers: string[], rows: string[][], caption?: string) => {
      const nodes: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [];
      if (caption) nodes.push(new Paragraph({ text: caption, heading: HeadingLevel.HEADING_2 }));
      columnGroups(headers.length).forEach((indexes, group) => {
        const projected = projectColumns(headers, rows, indexes);
        if (group > 0) {
          nodes.push(new Paragraph({
            children: [new TextRun({ text: `Продолжение · ${indexes.map((index) => headers[index] || String(index + 1)).join(" · ")}`, italics: true, color: "6E6E73", size: 18 })],
          }));
        }
        nodes.push(gridTable(projected.headers, projected.rows));
      });
      return nodes;
    };
    const gridTable = (headers: string[], rows: string[][]) => {
      const pageWidth = 10466;
      const share = Math.floor(pageWidth / headers.length);
      const widths = headers.map((_, index) => index === headers.length - 1 ? pageWidth - share * (headers.length - 1) : share);
      const fontSize = headers.length >= 7 ? 16 : 20;
      return new Table({
        width: { size: pageWidth, type: WidthType.DXA },
        columnWidths: widths,
        rows: [
          new TableRow({
            tableHeader: true,
            children: headers.map((header, index) => new TableCell({
              width: { size: widths[index], type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: header || " ", bold: true, size: fontSize })] })],
            })),
          }),
          ...rows.map((row) => new TableRow({
            children: headers.map((_, index) => new TableCell({
              width: { size: widths[index], type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: row[index] || " ", size: fontSize })] })],
            })),
          })),
        ],
      });
    };
    for (const item of docs) {
      children.push(new Paragraph({ text: item.title, heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${item.kindLabel} · ${item.sourceName}`, color: "6E6E73", size: 18 })] }));
      if (item.prose) pushMarkdown(item.prose);
      for (const message of item.messages) {
        children.push(new Paragraph({ text: message.role, heading: HeadingLevel.HEADING_2 }));
        if (message.time) children.push(new Paragraph({ children: [new TextRun({ text: message.time, color: "6E6E73", size: 18 })] }));
        pushMarkdown(message.text);
      }
      if (!item.prose && item.messages.length === 0) {
        for (const table of item.tables) {
          const headers = table.headers.length ? table.headers : ["Значение"];
          children.push(...groupedTables(headers, table.rows, table.name));
        }
      }
    }
    const document = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      }],
    });
    const blob = await Packer.toBlob(document);
    downloadBlob(name, blob);
    return;
  } catch {
    const html = docs.map((item) => `<h1>${escapeHtml(item.title)}</h1>${sheetHtml(item)}`).join("<hr>");
    const word = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    downloadBlob(name.replace(/\.docx$/, ".doc"), new Blob([word], { type: "application/msword" }));
  }
}

export async function downloadXlsx(bundle: Bundle, doc: FolioDoc, scope: "one" | "all") {
  const docs = docsOf(bundle, doc, scope);
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  const messageRows = [["Документ", "Роль", "Время", "Текст"]];
  for (const item of docs) {
    const source = item.messages.length ? item.messages : proseRows(item);
    for (const message of source) {
      messageRows.push([item.title, message.role, message.time ?? "", excelSafe(message.text)]);
    }
  }
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(messageRows), "Документ");
  docs.forEach((item, docIndex) => {
    item.tables.forEach((table, tableIndex) => {
      const rows = [table.headers.map(excelSafe), ...table.rows.map((row) => table.headers.map((_, index) => excelSafe(row[index] ?? "")))];
      const sheetName = `${docIndex + 1}-${tableIndex + 1} ${table.name}`.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), sheetName);
    });
  });
  const output = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  downloadBlob(
    `${safeFileName(scope === "all" ? bundle.title : doc.title)}.xlsx`,
    new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
}

function proseRows(doc: FolioDoc): Message[] {
  if (!doc.prose) return [];
  return [{ role: "Текст", roleKey: "other", text: doc.prose }];
}

export function downloadDiagram(doc: FolioDoc) {
  const tree = doc.tree ?? flowTree(doc);
  const width = 760;
  const layout = place(tree, 32, 32);
  const height = Math.max(layout.bottom + 32, 120);
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f5f5f7"/>${layout.markup}</svg>`;
  downloadBlob(`${safeFileName(doc.title)}.svg`, new Blob([svg], { type: "image/svg+xml" }));
}

function flowTree(doc: FolioDoc): TreeNode {
  const visible = doc.messages.filter((message) => message.roleKey === "user" || message.roleKey === "assistant");
  return {
    id: doc.id,
    label: doc.title,
    children: (visible.length ? visible : doc.messages).slice(0, 60).map((message, index) => ({
      id: `${doc.id}-${index}`,
      label: message.role,
      detail: message.text.replace(/\s+/g, " ").slice(0, 180),
      active: true,
      children: [],
    })),
  };
}

function place(node: TreeNode, x: number, y: number): { markup: string; bottom: number } {
  const boxWidth = 560;
  const detail = node.detail ? escapeHtml(node.detail) : "";
  const height = detail ? 78 : 46;
  const stroke = node.active ? "#0071e3" : "#d2d2d7";
  const label = escapeHtml(node.label);
  let markup = `<rect x="${x}" y="${y}" width="${boxWidth}" height="${height}" rx="14" fill="#ffffff" stroke="${stroke}"/><text x="${x + 16}" y="${y + 26}" fill="#1d1d1f" font-family="Manrope, Segoe UI, sans-serif" font-size="14" font-weight="600">${label}</text>`;
  if (detail) {
    markup += `<text x="${x + 16}" y="${y + 50}" fill="#6e6e73" font-family="Manrope, Segoe UI, sans-serif" font-size="12">${clipSvg(detail, 78)}</text>`;
  }
  let cursor = y + height + 18;
  for (const child of node.children) {
    markup += `<path d="M${x + 28} ${y + height} V${cursor + 8}" fill="none" stroke="#d2d2d7"/>`;
    const next = place(child, x + 28, cursor);
    markup += next.markup;
    cursor = next.bottom + 14;
  }
  return { markup, bottom: Math.max(y + height, cursor - 14) };
}

function clipSvg(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
