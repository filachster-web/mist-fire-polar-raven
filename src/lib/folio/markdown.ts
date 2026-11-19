import { marked, type Tokens } from "marked";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "\u0026amp;";
    if (char === "<") return "\u0026lt;";
    if (char === ">") return "\u0026gt;";
    if (char === '"') return "\u0026quot;";
    return "\u0026#39;";
  });
}

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const safe = /^(https?:|mailto:)/i.test(href) ? href : "#";
      const inner = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(safe)}"${titleAttr} target="_blank" rel="noopener noreferrer">${inner}</a>`;
    },
    image({ href, text }) {
      if (!/^https:\/\//i.test(href)) return escapeHtml(text || "");
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text || "")}" />`;
    },
  },
});

export function renderMarkdown(source: string): string {
  const parsed = marked.parse(source || "", { async: false });
  return typeof parsed === "string" ? parsed : "";
}

export function tablesInMarkdown(source: string): { headers: string[]; rows: string[][] }[] {
  const tokens = marked.lexer(source || "");
  const tables: { headers: string[]; rows: string[][] }[] = [];
  for (const token of tokens) {
    if (token.type !== "table") continue;
    const table = token as Tokens.Table;
    tables.push({
      headers: table.header.map((cell) => cell.text),
      rows: table.rows.map((row) => row.map((cell) => cell.text)),
    });
  }
  return tables;
}

export { marked };
