import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, W as isRedirect, b as useRouter, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Download, i as FileUp, n as Search, r as FolderOpen } from "../_libs/lucide-react.mjs";
import { t as x } from "../_libs/marked.mjs";
import { i as isValid, n as parseISO, r as format, t as ru } from "../_libs/date-fns.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as require_lib } from "../_libs/jszip+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio-B5aUiz5c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_lib = /* @__PURE__ */ __toESM(require_lib());
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
function escapeHtml$1(value) {
	return value.replace(/[&<>"']/g, (char) => {
		if (char === "&") return "&amp;";
		if (char === "<") return "&lt;";
		if (char === ">") return "&gt;";
		if (char === "\"") return "&quot;";
		return "&#39;";
	});
}
x.use({
	gfm: true,
	breaks: true,
	renderer: {
		html({ text }) {
			return escapeHtml$1(text);
		},
		link({ href, title, tokens }) {
			const safe = /^(https?:|mailto:)/i.test(href) ? href : "#";
			const inner = this.parser.parseInline(tokens);
			const titleAttr = title ? ` title="${escapeHtml$1(title)}"` : "";
			return `<a href="${escapeHtml$1(safe)}"${titleAttr} target="_blank" rel="noopener noreferrer">${inner}</a>`;
		},
		image({ href, text }) {
			if (!/^https:\/\//i.test(href)) return escapeHtml$1(text || "");
			return `<img src="${escapeHtml$1(href)}" alt="${escapeHtml$1(text || "")}" />`;
		}
	}
});
function renderMarkdown(source) {
	const parsed = x.parse(source || "", { async: false });
	return typeof parsed === "string" ? parsed : "";
}
function tablesInMarkdown(source) {
	const tokens = x.lexer(source || "");
	const tables = [];
	for (const token of tokens) {
		if (token.type !== "table") continue;
		const table = token;
		tables.push({
			headers: table.header.map((cell) => cell.text),
			rows: table.rows.map((row) => row.map((cell) => cell.text))
		});
	}
	return tables;
}
function MarkdownView({ source }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "folio-md",
		dangerouslySetInnerHTML: { __html: renderMarkdown(source) }
	});
}
function displayTime(value) {
	if (!value) return "";
	const parsed = parseISO(value);
	const date = isValid(parsed) ? parsed : new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return format(date, "d MMMM yyyy, HH:mm", { locale: ru });
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function DocumentView({ doc, mode, query, showService }) {
	if (mode === "table") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableMode, {
		doc,
		query,
		showService
	});
	if (mode === "map") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapMode, { doc });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocMode, {
		doc,
		query,
		showService
	});
}
function visibleMessages(doc, query, showService) {
	const needle = query.trim().toLowerCase();
	return doc.messages.filter((message) => {
		if (!showService && (message.roleKey === "tool" || message.roleKey === "system")) return false;
		if (!needle) return true;
		return `${message.role} ${message.text}`.toLowerCase().includes(needle);
	});
}
function DocMode({ doc, query, showService }) {
	const messages = visibleMessages(doc, query, showService);
	const [limit, setLimit] = (0, import_react.useState)(36);
	const shown = query.trim() ? messages.slice(0, 200) : messages.slice(0, limit);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		id: "folio-sheet",
		className: "mx-auto w-full max-w-3xl rounded-3xl bg-surface px-5 py-8 shadow-lg ring-1 ring-line sm:px-12 sm:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-wide text-muted",
				children: doc.kindLabel
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl",
				children: doc.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: doc.sourceName
			}),
			doc.prose ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkdownView, { source: doc.prose })
			}) : null,
			shown.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: shown.map((message, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "msg border-t border-line py-7",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "mb-3 flex items-baseline justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: cn("text-sm font-semibold", message.roleKey === "assistant" ? "text-accent" : "text-ink"),
							children: message.role
						}), message.time ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
							className: "shrink-0 text-xs tabular-nums text-muted",
							children: displayTime(message.time)
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkdownView, { source: message.text })]
				}, `${message.time ?? "t"}-${index}`))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-sm text-muted",
				children: query.trim() ? "В этом документе нет таких строк." : "В документе нет сообщений."
			}),
			!query.trim() && shown.length < messages.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "mt-2 h-11 rounded-full bg-soft px-5 text-sm font-medium text-ink",
				onClick: () => setLimit((value) => value + 40),
				children: ["Показать ещё ", Math.min(40, messages.length - shown.length)]
			}) : null
		]
	});
}
function TableMode({ doc, query, showService }) {
	const messages = visibleMessages(doc, query, showService);
	const tables = doc.tables.length ? doc.tables : [];
	const [sheet, setSheet] = (0, import_react.useState)(messages.length ? "messages" : "0");
	const needle = query.trim().toLowerCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "folio-sheet",
		className: "overflow-hidden rounded-3xl bg-surface shadow-lg ring-1 ring-line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2 overflow-x-auto border-b border-line px-4 py-3",
			children: [messages.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetButton, {
				active: sheet === "messages",
				onClick: () => setSheet("messages"),
				children: "Сообщения"
			}) : null, tables.map((table, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetButton, {
				active: sheet === String(index),
				onClick: () => setSheet(String(index)),
				children: table.name
			}, table.name + index))]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: sheet === "messages" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageTable, { messages }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
				table: tables[Number(sheet)] ?? tables[0],
				needle
			})
		})]
	});
}
function SheetButton({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-10 shrink-0 rounded-full px-4 text-sm font-medium", active ? "bg-ink text-bg" : "text-muted"),
		children
	});
}
function MessageTable({ messages }) {
	const [sort, setSort] = (0, import_react.useState)("time");
	const [dir, setDir] = (0, import_react.useState)(1);
	const rows = (0, import_react.useMemo)(() => {
		const copy = [...messages];
		copy.sort((a, b) => {
			const left = sort === "role" ? a.role : sort === "time" ? a.time ?? "" : a.text;
			const right = sort === "role" ? b.role : sort === "time" ? b.time ?? "" : b.text;
			return left.localeCompare(right, "ru") * dir;
		});
		return copy;
	}, [
		messages,
		sort,
		dir
	]);
	const toggle = (key) => {
		if (sort === key) setDir((value) => value === 1 ? -1 : 1);
		else {
			setSort(key);
			setDir(1);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "w-full min-w-[640px] border-collapse text-left text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
			className: "sticky top-0 bg-surface",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "text-xs uppercase tracking-wide text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
						onClick: () => toggle("role"),
						children: "Роль"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
						onClick: () => toggle("time"),
						children: "Время"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
						onClick: () => toggle("text"),
						children: "Текст"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((message, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
			className: "border-t border-line align-top",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "w-36 px-4 py-3 font-medium text-ink",
					children: message.role
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "w-44 px-4 py-3 tabular-nums text-muted",
					children: message.time ? displayTime(message.time) : ""
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "px-4 py-3 text-ink",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "whitespace-pre-wrap text-pretty",
						children: message.text
					})
				})
			]
		}, `${message.time ?? "m"}-${index}`)) })]
	});
}
function Th({ children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: "px-4 py-3 font-medium",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "h-11",
			onClick,
			children
		})
	});
}
function DataTable({ table, needle }) {
	const [sort, setSort] = (0, import_react.useState)(0);
	const [dir, setDir] = (0, import_react.useState)(1);
	if (!table) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-sm text-muted",
		children: "В этом документе нет таблицы."
	});
	const sorted = [...table.rows.filter((row) => !needle || row.join(" ").toLowerCase().includes(needle))].sort((a, b) => (a[sort] ?? "").localeCompare(b[sort] ?? "", "ru", { numeric: true }) * dir);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "w-full min-w-[640px] border-collapse text-left text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
			className: "text-xs uppercase tracking-wide text-muted",
			children: table.headers.map((header, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
				className: "px-4 py-3 font-medium",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11",
					onClick: () => {
						if (sort === index) setDir((value) => value === 1 ? -1 : 1);
						else {
							setSort(index);
							setDir(1);
						}
					},
					children: header || "—"
				})
			}, header + index))
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sorted.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
			className: "border-t border-line align-top",
			children: table.headers.map((_, cell) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3 text-ink",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "whitespace-pre-wrap",
					children: row[cell] ?? ""
				})
			}, cell))
		}, index)) })]
	});
}
function MapMode({ doc }) {
	const tree = doc.tree ?? messageFlow(doc);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "folio-sheet",
		className: "rounded-3xl bg-surface p-5 shadow-lg ring-1 ring-line sm:p-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-6 text-lg font-semibold tracking-tight text-ink",
			children: "Схема"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tree, { node: tree })]
	});
}
function messageFlow(doc) {
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
			children: []
		}))
	};
}
function Tree({ node }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("rounded-2xl bg-bg px-4 py-3 ring-1", node.active ? "ring-accent" : "ring-line"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold text-ink",
				children: node.label
			}), node.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-pretty text-muted",
				children: node.detail
			}) : null]
		}), node.children.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "ml-4 flex flex-col gap-3 border-l border-line pl-4 sm:ml-8",
			children: node.children.map((child) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tree, { node: child }, child.id))
		}) : null]
	});
}
function escapeHtml(value) {
	return value.replace(/[&<>"']/g, (char) => {
		if (char === "&") return "&amp;";
		if (char === "<") return "&lt;";
		if (char === ">") return "&gt;";
		if (char === "\"") return "&quot;";
		return "&#39;";
	});
}
function safeFileName(value) {
	return (value.replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^_+|_+$/g, "") || "folio").slice(0, 80);
}
function downloadBlob(filename, blob) {
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
function excelSafe(value) {
	const clipped = value.length > 32e3 ? `${value.slice(0, 32e3)}…` : value;
	return /^[=+\-@]/.test(clipped) ? `'${clipped}` : clipped;
}
function toMarkdown(doc) {
	const parts = [`# ${doc.title}`, ""];
	if (doc.prose) parts.push(doc.prose, "");
	for (const message of doc.messages) parts.push(`## ${message.role}${message.time ? ` · ${message.time}` : ""}`, "", message.text, "");
	if (!doc.prose) for (const table of doc.tables) parts.push(tableMarkdown(table), "");
	return parts.join("\n");
}
function tableMarkdown(table) {
	const headers = table.headers.length ? table.headers : ["Значение"];
	const lines = [
		`## ${table.name}`,
		"",
		`| ${headers.join(" | ")} |`,
		`| ${headers.map(() => "---").join(" | ")} |`
	];
	for (const row of table.rows) lines.push(`| ${headers.map((_, index) => (row[index] ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`);
	return lines.join("\n");
}
function sheetHtml(doc) {
	return `${doc.prose ? `<div class="prose">${renderMarkdown(doc.prose)}</div>` : ""}${doc.messages.map((message) => {
		return `<article><header><strong>${escapeHtml(message.role)}</strong>${message.time ? `<time>${escapeHtml(message.time)}</time>` : ""}</header><div class="prose">${renderMarkdown(message.text)}</div></article>`;
	}).join("")}${doc.prose ? "" : doc.tables.map((table) => {
		const head = table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
		const body = table.rows.map((row) => `<tr>${table.headers.map((_, index) => `<td>${escapeHtml(row[index] ?? "")}</td>`).join("")}</tr>`).join("");
		return `<h2>${escapeHtml(table.name)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
	}).join("")}`;
}
var PAGE_CSS = `
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
function docBody(doc) {
	return `<h1>${escapeHtml(doc.title)}</h1><p class="meta">${escapeHtml(doc.kindLabel)} · ${escapeHtml(doc.sourceName)}</p>${sheetHtml(doc)}`;
}
function pageShell(title, body) {
	return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>${PAGE_CSS}</style></head><body><main>${body}</main></body></html>`;
}
function downloadHtml(bundle, doc, scope = "one") {
	const docs = docsOf(bundle, doc, scope);
	const title = scope === "all" ? bundle.title : doc.title;
	const body = docs.map((item, index) => {
		return `<section${index ? ` style="margin-top:48px;padding-top:32px;border-top:1px solid #d2d2d7"` : ""}>${docBody(item)}</section>`;
	}).join("");
	downloadBlob(`${safeFileName(title)}.html`, new Blob([pageShell(title, body)], { type: "text/html;charset=utf-8" }));
}
function downloadMarkdown(doc) {
	downloadBlob(`${safeFileName(doc.title)}.md`, new Blob([toMarkdown(doc)], { type: "text/markdown;charset=utf-8" }));
}
function docsOf(bundle, doc, scope) {
	return scope === "all" ? bundle.docs : [doc];
}
var pdfReady = null;
function loadPdfMake() {
	pdfReady ??= import("../_libs/pdfmake.mjs").then((n) => /* @__PURE__ */ __toESM(n.n())).then(async (pdfModule) => {
		const fontModule = await import("../_libs/pdfmake.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
		const pdfMake = pdfModule.default;
		pdfMake.addVirtualFileSystem(fontModule.default);
		return pdfMake;
	}).catch((error) => {
		pdfReady = null;
		throw error;
	});
	return pdfReady;
}
function clipText(value, max = 8e3) {
	return value.length > max ? `${value.slice(0, max)}…` : value;
}
function safeHref(href) {
	return /^(https?:|mailto:)/i.test(href) ? href : null;
}
function inlineRuns(paragraph) {
	const tokens = paragraph.tokens ?? [];
	if (!tokens.length) return [clipText(paragraph.text) || " "];
	return tokens.map((inline) => {
		if (inline.type === "strong") return {
			text: inline.text,
			bold: true
		};
		if (inline.type === "em") return {
			text: inline.text,
			italics: true
		};
		if (inline.type === "codespan") return {
			text: inline.text,
			background: "#e8e8ed",
			fontSize: 10
		};
		if (inline.type === "link") {
			const href = safeHref(inline.href);
			return href ? {
				text: inline.text || href,
				color: "#0071e3",
				link: href
			} : inline.text || href || "";
		}
		if (inline.type === "br") return "\n";
		if ("text" in inline && typeof inline.text === "string") return inline.text;
		return "";
	});
}
function columnGroups(count) {
	if (count <= 0) return [];
	const limit = 10;
	if (count <= limit) return [Array.from({ length: count }, (_, index) => index)];
	const keys = count > 1 ? [0, 1] : [0];
	const rest = Array.from({ length: count }, (_, index) => index).filter((index) => !keys.includes(index));
	const room = limit - keys.length;
	const groups = [];
	for (let start = 0; start < rest.length; start += room) groups.push([...keys, ...rest.slice(start, start + room)]);
	return groups;
}
function projectColumns(headers, rows, indexes) {
	return {
		headers: indexes.map((index) => headers[index] ?? ""),
		rows: rows.map((row) => indexes.map((index) => row[index] ?? ""))
	};
}
function pdfTable(headers, rows, caption) {
	const size = headers.length >= 7 ? 8 : 9;
	const head = headers.map((header) => ({
		text: header || " ",
		bold: true,
		fontSize: size,
		color: "#6e6e73"
	}));
	const body = rows.map((row) => headers.map((_, index) => ({
		text: row[index] || " ",
		fontSize: size
	})));
	const table = {
		table: {
			headerRows: 1,
			widths: headers.map(() => "*"),
			body: body.length ? [head, ...body] : [head],
			dontBreakRows: false
		},
		layout: "lightHorizontalLines",
		margin: [
			0,
			4,
			0,
			10
		]
	};
	return caption ? { stack: [{
		text: caption,
		style: "h3"
	}, table] } : table;
}
function pdfTables(headers, rows, caption) {
	return columnGroups(headers.length).map((indexes, group) => {
		const projected = projectColumns(headers, rows, indexes);
		const note = group === 0 ? caption : `${caption ? `${caption} · ` : ""}продолжение · ${indexes.map((index) => headers[index] || String(index + 1)).join(" · ")}`;
		return pdfTable(projected.headers, projected.rows, note);
	});
}
function markdownToPdf(source) {
	const blocks = [];
	for (const token of x.lexer(source || "")) if (token.type === "heading") {
		const heading = token;
		blocks.push({
			text: heading.text || " ",
			style: heading.depth <= 2 ? "h2" : "h3"
		});
	} else if (token.type === "paragraph") blocks.push({
		text: inlineRuns(token),
		margin: [
			0,
			1,
			0,
			6
		]
	});
	else if (token.type === "code") blocks.push({
		text: clipText(token.text, 6e3) || " ",
		style: "code"
	});
	else if (token.type === "list") {
		const list = token;
		const items = list.items.map((item) => clipText(item.text.replace(/\s+/g, " ").trim(), 2e3) || " ");
		blocks.push({
			[list.ordered ? "ol" : "ul"]: items.length ? items : [" "],
			margin: [
				0,
				2,
				0,
				8
			]
		});
	} else if (token.type === "blockquote") blocks.push({
		text: clipText(token.text, 4e3) || " ",
		style: "quote"
	});
	else if (token.type === "table") {
		const table = token;
		const headers = table.header.map((cell) => cell.text);
		if (!headers.length) continue;
		const rows = table.rows.map((row) => headers.map((_, index) => row[index]?.text ?? ""));
		blocks.push(...pdfTables(headers, rows));
	} else if (token.type === "image") {
		const image = token;
		const label = image.text || "Изображение";
		const href = /^https?:\/\//i.test(image.href) ? image.href : "";
		blocks.push({
			text: href ? `${label} — ${href}` : label,
			color: "#0071e3",
			margin: [
				0,
				2,
				0,
				6
			]
		});
	} else if (token.type === "html") {
		const text = token.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
		if (text) blocks.push({
			text: clipText(text),
			margin: [
				0,
				1,
				0,
				6
			]
		});
	}
	if (!blocks.length && source.trim()) blocks.push({
		text: clipText(source),
		margin: [
			0,
			0,
			0,
			6
		]
	});
	return blocks;
}
function docPdf(doc, breakBefore) {
	const blocks = [{
		text: doc.title || "Документ",
		style: "title",
		pageBreak: breakBefore ? "before" : void 0
	}, {
		text: `${doc.kindLabel} · ${doc.sourceName}`,
		style: "meta"
	}];
	if (doc.prose) blocks.push(...markdownToPdf(doc.prose));
	for (const message of doc.messages) {
		const role = {
			text: message.role || "Сообщение",
			style: message.roleKey === "assistant" ? "roleAccent" : "role"
		};
		blocks.push(message.time ? {
			columns: [role, {
				text: message.time,
				style: "time",
				width: "auto"
			}],
			columnGap: 12,
			margin: [
				0,
				12,
				0,
				4
			]
		} : {
			...role,
			margin: [
				0,
				12,
				0,
				4
			]
		});
		blocks.push(...markdownToPdf(message.text || " "));
	}
	if (!doc.prose && doc.messages.length === 0) for (const table of doc.tables) {
		const headers = table.headers.length ? table.headers : ["Значение"];
		blocks.push(...pdfTables(headers, table.rows, table.name));
	}
	return blocks;
}
async function downloadPdf(bundle, doc, scope) {
	const docs = docsOf(bundle, doc, scope);
	const title = scope === "all" ? bundle.title : doc.title;
	const file = (await loadPdfMake()).createPdf({
		info: { title },
		pageSize: "A4",
		pageMargins: [
			48,
			56,
			48,
			56
		],
		defaultStyle: {
			font: "Roboto",
			fontSize: 11,
			lineHeight: 1.28,
			color: "#1d1d1f"
		},
		styles: {
			title: {
				fontSize: 22,
				bold: true,
				margin: [
					0,
					0,
					0,
					4
				]
			},
			meta: {
				fontSize: 10,
				color: "#6e6e73",
				margin: [
					0,
					0,
					0,
					8
				]
			},
			h2: {
				fontSize: 15,
				bold: true,
				margin: [
					0,
					12,
					0,
					4
				]
			},
			h3: {
				fontSize: 13,
				bold: true,
				margin: [
					0,
					10,
					0,
					3
				]
			},
			role: {
				fontSize: 12,
				bold: true,
				color: "#1d1d1f"
			},
			roleAccent: {
				fontSize: 12,
				bold: true,
				color: "#0071e3"
			},
			time: {
				fontSize: 9,
				color: "#6e6e73",
				alignment: "right"
			},
			code: {
				fontSize: 9,
				background: "#f5f5f7",
				margin: [
					0,
					4,
					0,
					8
				]
			},
			quote: {
				italics: true,
				color: "#6e6e73",
				margin: [
					10,
					4,
					0,
					8
				]
			}
		},
		footer: (current, count) => ({
			text: `${current} / ${count}`,
			alignment: "right",
			margin: [
				0,
				16,
				48,
				0
			],
			fontSize: 9,
			color: "#6e6e73"
		}),
		content: docs.flatMap((item, index) => docPdf(item, index > 0))
	});
	downloadBlob(`${safeFileName(title)}.pdf`, await file.getBlob());
}
async function downloadDocx(bundle, doc, scope) {
	const docs = docsOf(bundle, doc, scope);
	const name = `${safeFileName(scope === "all" ? bundle.title : doc.title)}.docx`;
	try {
		const { Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } = await import("../_libs/docx.mjs").then((n) => n.t);
		const children = [];
		const pushMarkdown = (source) => {
			for (const token of x.lexer(source)) appendToken(token);
		};
		const appendToken = (token) => {
			if (token.type === "heading") {
				const heading = token;
				const depth = Math.min(Math.max(heading.depth, 1), 4);
				const level = [
					HeadingLevel.HEADING_1,
					HeadingLevel.HEADING_2,
					HeadingLevel.HEADING_3,
					HeadingLevel.HEADING_4
				][depth - 1];
				children.push(new Paragraph({
					text: heading.text,
					heading: level
				}));
			} else if (token.type === "paragraph") children.push(new Paragraph({ children: runsFrom(token) }));
			else if (token.type === "code") {
				const code = token;
				children.push(new Paragraph({
					children: [new TextRun({
						text: code.text,
						font: "Consolas",
						size: 18
					})],
					shading: {
						type: ShadingType.CLEAR,
						fill: "F5F5F7"
					}
				}));
			} else if (token.type === "list") {
				const list = token;
				list.items.forEach((item, index) => {
					children.push(new Paragraph({ text: `${list.ordered ? `${index + 1}.` : "•"} ${item.text}` }));
				});
			} else if (token.type === "blockquote") children.push(new Paragraph({ children: [new TextRun({
				text: token.text,
				italics: true,
				color: "6E6E73"
			})] }));
			else if (token.type === "table") children.push(...markdownTable(token));
			else if (token.type === "image") {
				const image = token;
				const label = image.text || "Изображение";
				const href = /^https?:\/\//i.test(image.href) ? image.href : "";
				children.push(new Paragraph({ children: [new TextRun({
					text: href ? `${label} — ${href}` : label,
					color: "0071E3"
				})] }));
			} else if (token.type === "space" || token.type === "hr") children.push(new Paragraph({ text: "" }));
		};
		const runsFrom = (paragraph) => {
			const tokens = paragraph.tokens ?? [];
			if (!tokens.length) return [new TextRun(paragraph.text)];
			return tokens.map((inline) => {
				if (inline.type === "strong") return new TextRun({
					text: inline.text,
					bold: true
				});
				if (inline.type === "em") return new TextRun({
					text: inline.text,
					italics: true
				});
				if (inline.type === "codespan") return new TextRun({
					text: inline.text,
					font: "Consolas"
				});
				if (inline.type === "link") return new TextRun({
					text: inline.text,
					color: "0071E3"
				});
				if (inline.type === "text" || inline.type === "escape") return new TextRun(inline.text);
				return new TextRun("text" in inline ? String(inline.text ?? "") : "");
			});
		};
		const markdownTable = (table) => {
			const headers = table.header.map((cell) => cell.text);
			const rows = table.rows.map((row) => row.map((cell) => cell.text));
			return groupedTables(headers, rows);
		};
		const groupedTables = (headers, rows, caption) => {
			const nodes = [];
			if (caption) nodes.push(new Paragraph({
				text: caption,
				heading: HeadingLevel.HEADING_2
			}));
			columnGroups(headers.length).forEach((indexes, group) => {
				const projected = projectColumns(headers, rows, indexes);
				if (group > 0) nodes.push(new Paragraph({ children: [new TextRun({
					text: `Продолжение · ${indexes.map((index) => headers[index] || String(index + 1)).join(" · ")}`,
					italics: true,
					color: "6E6E73",
					size: 18
				})] }));
				nodes.push(gridTable(projected.headers, projected.rows));
			});
			return nodes;
		};
		const gridTable = (headers, rows) => {
			const pageWidth = 10466;
			const share = Math.floor(pageWidth / headers.length);
			const widths = headers.map((_, index) => index === headers.length - 1 ? pageWidth - share * (headers.length - 1) : share);
			const fontSize = headers.length >= 7 ? 16 : 20;
			return new Table({
				width: {
					size: pageWidth,
					type: WidthType.DXA
				},
				columnWidths: widths,
				rows: [new TableRow({
					tableHeader: true,
					children: headers.map((header, index) => new TableCell({
						width: {
							size: widths[index],
							type: WidthType.DXA
						},
						children: [new Paragraph({ children: [new TextRun({
							text: header || " ",
							bold: true,
							size: fontSize
						})] })]
					}))
				}), ...rows.map((row) => new TableRow({ children: headers.map((_, index) => new TableCell({
					width: {
						size: widths[index],
						type: WidthType.DXA
					},
					children: [new Paragraph({ children: [new TextRun({
						text: row[index] || " ",
						size: fontSize
					})] })]
				})) }))]
			});
		};
		for (const item of docs) {
			children.push(new Paragraph({
				text: item.title,
				heading: HeadingLevel.HEADING_1
			}));
			children.push(new Paragraph({ children: [new TextRun({
				text: `${item.kindLabel} · ${item.sourceName}`,
				color: "6E6E73",
				size: 18
			})] }));
			if (item.prose) pushMarkdown(item.prose);
			for (const message of item.messages) {
				children.push(new Paragraph({
					text: message.role,
					heading: HeadingLevel.HEADING_2
				}));
				if (message.time) children.push(new Paragraph({ children: [new TextRun({
					text: message.time,
					color: "6E6E73",
					size: 18
				})] }));
				pushMarkdown(message.text);
			}
			if (!item.prose && item.messages.length === 0) for (const table of item.tables) {
				const headers = table.headers.length ? table.headers : ["Значение"];
				children.push(...groupedTables(headers, table.rows, table.name));
			}
		}
		const document = new Document({ sections: [{
			properties: { page: {
				size: {
					width: 11906,
					height: 16838
				},
				margin: {
					top: 720,
					right: 720,
					bottom: 720,
					left: 720
				}
			} },
			children
		}] });
		downloadBlob(name, await Packer.toBlob(document));
		return;
	} catch {
		const word = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${docs.map((item) => `<h1>${escapeHtml(item.title)}</h1>${sheetHtml(item)}`).join("<hr>")}</body></html>`;
		downloadBlob(name.replace(/\.docx$/, ".doc"), new Blob([word], { type: "application/msword" }));
	}
}
async function downloadXlsx(bundle, doc, scope) {
	const docs = docsOf(bundle, doc, scope);
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const book = XLSX.utils.book_new();
	const messageRows = [[
		"Документ",
		"Роль",
		"Время",
		"Текст"
	]];
	for (const item of docs) {
		const source = item.messages.length ? item.messages : proseRows(item);
		for (const message of source) messageRows.push([
			item.title,
			message.role,
			message.time ?? "",
			excelSafe(message.text)
		]);
	}
	XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(messageRows), "Документ");
	docs.forEach((item, docIndex) => {
		item.tables.forEach((table, tableIndex) => {
			const rows = [table.headers.map(excelSafe), ...table.rows.map((row) => table.headers.map((_, index) => excelSafe(row[index] ?? "")))];
			const sheetName = `${docIndex + 1}-${tableIndex + 1} ${table.name}`.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
			XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), sheetName);
		});
	});
	const output = XLSX.write(book, {
		bookType: "xlsx",
		type: "array"
	});
	downloadBlob(`${safeFileName(scope === "all" ? bundle.title : doc.title)}.xlsx`, new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}
function proseRows(doc) {
	if (!doc.prose) return [];
	return [{
		role: "Текст",
		roleKey: "other",
		text: doc.prose
	}];
}
function downloadDiagram(doc) {
	const tree = doc.tree ?? flowTree(doc);
	const width = 760;
	const layout = place(tree, 32, 32);
	const height = Math.max(layout.bottom + 32, 120);
	const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f5f5f7"/>${layout.markup}</svg>`;
	downloadBlob(`${safeFileName(doc.title)}.svg`, new Blob([svg], { type: "image/svg+xml" }));
}
function flowTree(doc) {
	const visible = doc.messages.filter((message) => message.roleKey === "user" || message.roleKey === "assistant");
	return {
		id: doc.id,
		label: doc.title,
		children: (visible.length ? visible : doc.messages).slice(0, 60).map((message, index) => ({
			id: `${doc.id}-${index}`,
			label: message.role,
			detail: message.text.replace(/\s+/g, " ").slice(0, 180),
			active: true,
			children: []
		}))
	};
}
function place(node, x, y) {
	const boxWidth = 560;
	const detail = node.detail ? escapeHtml(node.detail) : "";
	const height = detail ? 78 : 46;
	const stroke = node.active ? "#0071e3" : "#d2d2d7";
	const label = escapeHtml(node.label);
	let markup = `<rect x="${x}" y="${y}" width="${boxWidth}" height="${height}" rx="14" fill="#ffffff" stroke="${stroke}"/><text x="${x + 16}" y="${y + 26}" fill="#1d1d1f" font-family="Manrope, Segoe UI, sans-serif" font-size="14" font-weight="600">${label}</text>`;
	if (detail) markup += `<text x="${x + 16}" y="${y + 50}" fill="#6e6e73" font-family="Manrope, Segoe UI, sans-serif" font-size="12">${clipSvg(detail, 78)}</text>`;
	let cursor = y + height + 18;
	for (const child of node.children) {
		markup += `<path d="M${x + 28} ${y + height} V${cursor + 8}" fill="none" stroke="#d2d2d7"/>`;
		const next = place(child, x + 28, cursor);
		markup += next.markup;
		cursor = next.bottom + 14;
	}
	return {
		markup,
		bottom: Math.max(y + height, cursor - 14)
	};
}
function clipSvg(value, max) {
	return value.length > max ? `${value.slice(0, max)}…` : value;
}
var MAX_FILE = 8e6;
var MAX_ENTRIES = 400;
var idCounter = 0;
function nextId(prefix) {
	idCounter += 1;
	return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}
function isRecord(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
function fileBase(name) {
	return name.split(/[/\\]/).pop() || name;
}
function fileTitle(name) {
	const base = fileBase(name).replace(/\.[^.]+$/, "");
	return base.replace(/^\d+[\s._-]*/, "").replace(/[_]+/g, " ").trim() || base || "Без названия";
}
function decodeEntities(input) {
	let value = input;
	const named = [
		["nbsp", " "],
		["quot", "\""],
		["#39", "'"],
		["apos", "'"],
		["lt", "<"],
		["gt", ">"],
		["amp", "&"]
	];
	for (let pass = 0; pass < 2; pass += 1) {
		for (const [name, ch] of named) value = value.replaceAll("&" + name + ";", ch);
		value = value.replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)));
		value = value.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
	}
	return value;
}
function stripTags(value) {
	return decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function summarize(messages, prose) {
	return (messages.find((message) => message.roleKey === "user")?.text || messages[0]?.text || prose || "").replace(/\s+/g, " ").trim().slice(0, 180) || "Пустой документ";
}
function collectTables(messages, prose) {
	const chunks = [prose ?? "", ...messages.map((message) => message.text)].filter(Boolean);
	const tables = [];
	for (const chunk of chunks) for (const table of tablesInMarkdown(chunk)) {
		if (!table.headers.length) continue;
		tables.push({
			name: `Таблица ${tables.length + 1}`,
			headers: table.headers,
			rows: table.rows
		});
	}
	return tables.slice(0, 12);
}
function makeDoc(partial) {
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
		prose
	};
}
function normalizeSpeaker(raw) {
	const value = raw.trim();
	const key = value.toLowerCase();
	if (/^(user|human|пользователь|вы|you)$/.test(key)) return {
		role: "Пользователь",
		roleKey: "user"
	};
	if (/claude/.test(key)) return {
		role: "Claude",
		roleKey: "assistant"
	};
	if (/chatgpt|\bgpt\b|openai/.test(key)) return {
		role: "ChatGPT",
		roleKey: "assistant"
	};
	if (/gemini/.test(key)) return {
		role: "Gemini",
		roleKey: "assistant"
	};
	if (/grok/.test(key)) return {
		role: "Grok",
		roleKey: "assistant"
	};
	if (/^(assistant|model|bot|ассистент|ai)$/.test(key)) return {
		role: "Ассистент",
		roleKey: "assistant"
	};
	if (/system|система/.test(key)) return {
		role: "Система",
		roleKey: "system"
	};
	if (/tool|function|инструмент/.test(key)) return {
		role: value || "Инструмент",
		roleKey: "tool"
	};
	return {
		role: value || "Сообщение",
		roleKey: "other"
	};
}
function timeOf(value) {
	if (typeof value === "number" && Number.isFinite(value)) {
		const ms = value < 0xe8d4a51000 ? value * 1e3 : value;
		const date = new Date(ms);
		if (!Number.isNaN(date.getTime())) return date.toISOString();
	}
	if (typeof value === "string" && value.trim()) return value.trim();
}
function cellString(value) {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	try {
		return JSON.stringify(value);
	} catch {
		return "";
	}
}
function contentToText(content) {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) return content.map((part) => {
		if (typeof part === "string") return part;
		if (!isRecord(part)) return "";
		if (typeof part.text === "string") return part.text;
		if (typeof part.content === "string") return part.content;
		return "";
	}).filter(Boolean).join("\n");
	if (isRecord(content) && typeof content.text === "string") return content.text;
	return "";
}
function partText(part) {
	if (typeof part === "string") return part;
	if (!isRecord(part)) return "";
	if (typeof part.text === "string") return part.text;
	if (typeof part.asset_pointer === "string" || part.content_type === "image_asset_pointer") return "[изображение]";
	return "";
}
function chatGptMessageText(message) {
	if ((isRecord(message.metadata) ? message.metadata : {}).is_visually_hidden_from_conversation === true) return "";
	const content = isRecord(message.content) ? message.content : {};
	if (Array.isArray(content.parts)) return content.parts.map(partText).filter(Boolean).join("\n").trim();
	if (typeof content.text === "string") return content.text.trim();
	return "";
}
function isChatGptConversation(value) {
	return isRecord(value) && isRecord(value.mapping) && (typeof value.title === "string" || typeof value.current_node === "string");
}
function isClaudeConversation(value) {
	return isRecord(value) && Array.isArray(value.chat_messages);
}
function messageFromRoleRecord(record) {
	const rawRole = record.role ?? record.sender ?? record.author ?? record.from;
	if (typeof rawRole !== "string") return null;
	const body = contentToText(record.content ?? record.text ?? record.message ?? record.body);
	if (!body.trim()) return null;
	const speaker = normalizeSpeaker(rawRole);
	return {
		role: speaker.role,
		roleKey: speaker.roleKey,
		time: timeOf(record.create_time ?? record.created_at ?? record.timestamp ?? record.time),
		text: body.trim()
	};
}
function chatGptDoc(conversation, sourceName) {
	const mapping = conversation.mapping;
	let leaf = typeof conversation.current_node === "string" ? conversation.current_node : "";
	if (!leaf || !isRecord(mapping[leaf])) leaf = Object.keys(mapping).find((id) => {
		const node = mapping[id];
		return isRecord(node) && (!Array.isArray(node.children) || node.children.length === 0);
	}) ?? "";
	const path = [];
	const seen = /* @__PURE__ */ new Set();
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
	const messages = [];
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
		if (rawRole === "tool" || recipient !== "all" && rawRole !== "user" && rawRole !== "assistant") speaker = {
			role: typeof author.name === "string" && author.name ? author.name : "Инструмент",
			roleKey: "tool"
		};
		if (rawRole === "assistant") {
			const slug = isRecord(message.metadata) && typeof message.metadata.model_slug === "string" ? message.metadata.model_slug : "";
			speaker = {
				role: slug ? `ChatGPT · ${slug}` : "ChatGPT",
				roleKey: "assistant"
			};
		}
		messages.push({
			role: speaker.role,
			roleKey: speaker.roleKey,
			time: timeOf(message.create_time),
			text
		});
	}
	return makeDoc({
		title: typeof conversation.title === "string" && conversation.title.trim() ? conversation.title : fileTitle(sourceName),
		sourceName,
		kind: "chatgpt",
		kindLabel: "ChatGPT",
		messages,
		tree: chatGptTree(mapping, active)
	});
}
function chatGptTree(mapping, active) {
	const ids = Object.keys(mapping);
	if (!ids.length) return null;
	const roots = ids.filter((id) => {
		const node = mapping[id];
		if (!isRecord(node)) return false;
		const parent = node.parent;
		return parent == null || parent === "" || !isRecord(mapping[String(parent)]);
	});
	const budget = { count: 0 };
	const walk = (id, seen) => {
		if (seen.has(id) || budget.count > 80) return null;
		seen.add(id);
		const node = mapping[id];
		if (!isRecord(node)) return null;
		const message = isRecord(node.message) ? node.message : null;
		const text = message ? chatGptMessageText(message) : "";
		const children = (Array.isArray(node.children) ? node.children : []).map((child) => walk(String(child), seen)).filter((child) => !!child);
		if (!text && children.length === 0) return null;
		budget.count += 1;
		const author = message && isRecord(message.author) && typeof message.author.role === "string" ? message.author.role : "Узел";
		return {
			id,
			label: normalizeSpeaker(author === "assistant" ? "ChatGPT" : author).role,
			detail: text ? text.replace(/\s+/g, " ").slice(0, 180) : void 0,
			active: active.has(id),
			children
		};
	};
	const children = roots.map((id) => walk(id, /* @__PURE__ */ new Set())).filter((node) => !!node);
	if (!children.length) return null;
	if (children.length === 1) return children[0];
	return {
		id: nextId("tree"),
		label: "Ветви",
		children
	};
}
function claudeText(message) {
	const chunks = [];
	if (typeof message.text === "string" && message.text.trim()) chunks.push(message.text.trim());
	if (Array.isArray(message.content)) for (const block of message.content) {
		if (!isRecord(block)) continue;
		const type = typeof block.type === "string" ? block.type : "";
		if ((type === "text" || type === "") && typeof block.text === "string") chunks.push(block.text.trim());
		else if (type === "tool_result") {
			const nested = contentToText(block.content);
			if (nested.trim()) chunks.push(nested.trim().slice(0, 4e3));
		}
	}
	const unique = [];
	for (const chunk of chunks.map((item) => item.trim()).filter(Boolean)) {
		if (unique.some((item) => item === chunk || item.includes(chunk))) continue;
		const shorter = unique.findIndex((item) => chunk.includes(item));
		if (shorter >= 0) unique[shorter] = chunk;
		else unique.push(chunk);
	}
	return unique.join("\n\n").trim();
}
function claudeDoc(conversation, sourceName) {
	const messages = [];
	for (const item of Array.isArray(conversation.chat_messages) ? conversation.chat_messages : []) {
		if (!isRecord(item)) continue;
		const text = claudeText(item);
		if (!text) continue;
		const speaker = normalizeSpeaker(typeof item.sender === "string" ? item.sender : "assistant");
		messages.push({
			role: speaker.role,
			roleKey: speaker.roleKey,
			time: timeOf(item.created_at ?? item.create_time),
			text
		});
	}
	return makeDoc({
		title: typeof conversation.name === "string" && conversation.name.trim() ? conversation.name : typeof conversation.title === "string" && conversation.title.trim() ? conversation.title : fileTitle(sourceName),
		sourceName,
		kind: "claude",
		kindLabel: "Claude",
		messages
	});
}
function objectsToTable(rows, name) {
	const headers = [];
	for (const row of rows.slice(0, 500)) for (const key of Object.keys(row)) if (!headers.includes(key) && headers.length < 16) headers.push(key);
	return {
		name,
		headers,
		rows: rows.slice(0, 2e3).map((row) => headers.map((header) => cellString(row[header])))
	};
}
function jsonTree(value, label, depth, budget) {
	if (budget.count > 160 || depth > 5) return {
		id: nextId("node"),
		label,
		detail: "…",
		children: []
	};
	budget.count += 1;
	if (Array.isArray(value)) return {
		id: nextId("node"),
		label: `${label} · ${value.length}`,
		children: value.slice(0, 24).map((item, index) => jsonTree(item, String(index + 1), depth + 1, budget))
	};
	if (isRecord(value)) {
		const keys = Object.keys(value).slice(0, 24);
		return {
			id: nextId("node"),
			label,
			children: keys.map((key) => jsonTree(value[key], key, depth + 1, budget))
		};
	}
	const detail = cellString(value).replace(/\s+/g, " ").slice(0, 160);
	return {
		id: nextId("node"),
		label,
		detail,
		children: []
	};
}
function roleMessages(records) {
	return records.map(messageFromRoleRecord).filter((message) => !!message);
}
function docsFromJson(data, sourceName) {
	const root = unwrapContainer(data);
	if (Array.isArray(root) && root.length && root.every(isChatGptConversation)) return root.map((item) => chatGptDoc(item, sourceName));
	if (isChatGptConversation(root)) return [chatGptDoc(root, sourceName)];
	if (Array.isArray(root) && root.length && root.every(isClaudeConversation)) return root.map((item) => claudeDoc(item, sourceName));
	if (isClaudeConversation(root)) return [claudeDoc(root, sourceName)];
	if (Array.isArray(root) && root.length && root.every((item) => isRecord(item) && messageFromRoleRecord(item))) {
		const records = root.filter(isRecord);
		return [makeDoc({
			title: fileTitle(sourceName),
			sourceName,
			kind: "dialogue",
			kindLabel: "Диалог",
			messages: roleMessages(records)
		})];
	}
	if (isRecord(root) && Array.isArray(root.messages)) {
		const messages = roleMessages(root.messages.filter(isRecord));
		if (messages.length) {
			const label = /gemini/i.test(sourceName) ? "Gemini" : /grok/i.test(sourceName) ? "Grok" : "Диалог";
			return [makeDoc({
				title: typeof root.title === "string" ? root.title : fileTitle(sourceName),
				sourceName,
				kind: "dialogue",
				kindLabel: label,
				messages
			})];
		}
	}
	if (isRecord(root) && Array.isArray(root.choices)) {
		const messages = root.choices.filter(isRecord).map((choice) => {
			return messageFromRoleRecord(isRecord(choice.message) ? choice.message : choice);
		}).filter((message) => !!message);
		if (messages.length) return [makeDoc({
			title: fileTitle(sourceName),
			sourceName,
			kind: "dialogue",
			kindLabel: "Диалог",
			messages
		})];
	}
	if (Array.isArray(root) && root.length && root.every((item) => isRecord(item) && (item.header === "Gemini Apps" || typeof item.title === "string" && /^prompted\s/i.test(item.title)))) return [makeDoc({
		title: "Gemini",
		sourceName,
		kind: "gemini",
		kindLabel: "Gemini",
		messages: root.filter(isRecord).map((item) => {
			const title = typeof item.title === "string" ? item.title.replace(/^prompted\s+/i, "") : "";
			return {
				role: "Пользователь",
				roleKey: "user",
				time: timeOf(item.time),
				text: title
			};
		}).filter((message) => message.text)
	})];
	if (Array.isArray(root) && root.length && root.every(isRecord)) {
		const rows = root.filter(isRecord);
		return [makeDoc({
			title: fileTitle(sourceName),
			sourceName,
			kind: "json-table",
			kindLabel: "JSON",
			tables: [objectsToTable(rows, "Записи")],
			tree: jsonTree(data, "JSON", 0, { count: 0 }),
			prose: null
		})];
	}
	return [makeDoc({
		title: fileTitle(sourceName),
		sourceName,
		kind: "json",
		kindLabel: "JSON",
		tree: jsonTree(data, fileTitle(sourceName), 0, { count: 0 }),
		prose: "```json\n" + safePretty(data) + "\n```"
	})];
}
function unwrapContainer(data) {
	if (!isRecord(data)) return data;
	if (Array.isArray(data.conversations)) return data.conversations;
	if (Array.isArray(data.chats)) return data.chats;
	return data;
}
function safePretty(data) {
	try {
		const text = JSON.stringify(data, null, 2) ?? "";
		return text.length > 8e4 ? `${text.slice(0, 8e4)}\n…` : text;
	} catch {
		return "";
	}
}
function looksLikeRole(heading) {
	const head = heading.split("·")[0]?.trim() ?? heading;
	return /^(пользователь|ассистент|assistant|chatgpt|claude|gemini|grok|система|system|инструмент|human|user|model|tool|bot|gpt|вы|you)(?![\p{L}\p{N}])/iu.test(head);
}
function splitRoleTime(heading) {
	const [role, time] = heading.split("·").map((part) => part.trim());
	return {
		role: role || heading,
		time: time || void 0
	};
}
function docsFromMarkdown(text, sourceName, kindLabel = "Markdown") {
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	let title = fileTitle(sourceName);
	let start = 0;
	if (lines[0]?.startsWith("# ")) {
		title = lines[0].slice(2).trim() || title;
		start = 1;
	}
	const messages = [];
	const preface = [];
	let current = null;
	for (const line of lines.slice(start)) {
		const heading = /^##\s+(.+?)\s*$/.exec(line);
		if (heading && looksLikeRole(heading[1])) {
			const parts = splitRoleTime(heading[1]);
			const speaker = normalizeSpeaker(parts.role);
			current = {
				role: speaker.role,
				roleKey: speaker.roleKey,
				time: parts.time,
				text: ""
			};
			messages.push(current);
			continue;
		}
		if (current) current.text += `${line}\n`;
		else preface.push(line);
	}
	if (!messages.length) return [makeDoc({
		title,
		sourceName,
		kind: "markdown",
		kindLabel,
		prose: text.trim()
	})];
	for (const message of messages) message.text = message.text.trim();
	const prefaceText = preface.join("\n").trim();
	return [makeDoc({
		title,
		sourceName,
		kind: "markdown",
		kindLabel,
		messages: messages.filter((message) => message.text),
		prose: prefaceText || null
	})];
}
function docsFromHtml(html, sourceName) {
	const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
	const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
	const title = stripTags(titleMatch || h1Match || "") || fileTitle(sourceName);
	const articles = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)];
	if (articles.length) {
		const messages = [];
		for (const article of articles) {
			const body = article[1] ?? "";
			const roleRaw = stripTags(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i.exec(body)?.[1] || "Сообщение");
			const time = stripTags(/<small[^>]*>([\s\S]*?)<\/small>/i.exec(body)?.[1] || "") || void 0;
			const pre = /<pre[^>]*>([\s\S]*?)<\/pre>/i.exec(body)?.[1];
			const text = (pre != null ? decodeEntities(pre) : stripTags(body)).trim();
			const speaker = normalizeSpeaker(roleRaw);
			if (!text) continue;
			messages.push({
				role: speaker.roleKey === "other" ? roleRaw : speaker.role,
				roleKey: speaker.roleKey,
				time,
				text
			});
		}
		return [makeDoc({
			title,
			sourceName,
			kind: "html",
			kindLabel: "HTML",
			messages
		})];
	}
	const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
		href: decodeEntities(match[1] ?? ""),
		text: stripTags(match[2] ?? "")
	})).filter((link) => link.text && !link.href.startsWith("#") && !/^javascript:/i.test(link.href));
	if (links.length >= 6) return [makeDoc({
		title,
		sourceName,
		kind: "catalog",
		kindLabel: "Каталог",
		tables: [{
			name: "Файлы",
			headers: ["Название", "Ссылка"],
			rows: links.slice(0, 2e3).map((link) => [link.text, link.href])
		}],
		prose: "Это каталог архива. Загрузите папку целиком или отдельные беседы — каждая откроется документом."
	})];
	const text = decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, "\n")).replace(/\n{3,}/g, "\n\n").trim();
	if (/accounts\.google\.com|ServiceLogin/i.test(html)) throw new Error("Ссылка ведёт на страницу входа Google. Скачайте файл и загрузите его сюда.");
	return [makeDoc({
		title,
		sourceName,
		kind: "html",
		kindLabel: "HTML",
		prose: text
	})];
}
function detectDelimiter(header) {
	const counts = [
		{
			mark: "	",
			count: header.split("	").length
		},
		{
			mark: ";",
			count: header.split(";").length
		},
		{
			mark: ",",
			count: header.split(",").length
		}
	];
	counts.sort((a, b) => b.count - a.count);
	return counts[0] && counts[0].count > 1 ? counts[0].mark : ",";
}
function parseDelimited(text) {
	const source = text.replace(/^\uFEFF/, "");
	const delimiter = detectDelimiter(source.split(/\r?\n/).find((line) => line.trim()) ?? "");
	const rows = [];
	let row = [];
	let cell = "";
	let quoted = false;
	for (let index = 0; index < source.length; index += 1) {
		const char = source[index];
		if (quoted) {
			if (char === "\"") {
				if (source[index + 1] === "\"") {
					cell += "\"";
					index += 1;
				} else quoted = false;
			} else cell += char;
		} else if (char === "\"") quoted = true;
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
	return {
		name: "Таблица",
		headers: (filtered.shift() ?? []).map((item) => item.trim()),
		rows: filtered
	};
}
function docsFromTable(text, sourceName) {
	const table = parseDelimited(text);
	return [makeDoc({
		title: fileTitle(sourceName),
		sourceName,
		kind: "csv",
		kindLabel: "Таблица",
		tables: [table],
		prose: null
	})];
}
function skipEntry(name) {
	const base = fileBase(name).toLowerCase();
	if (!base || base.startsWith(".") || base.startsWith("._")) return true;
	if (base === "text-index.js" || base === "catalog.js" || base === "style.css") return true;
	if (name.split(/[/\\]/).includes("__MACOSX")) return true;
	return false;
}
function extensionOf(name) {
	const base = fileBase(name).toLowerCase();
	const index = base.lastIndexOf(".");
	return index >= 0 ? base.slice(index) : "";
}
function looksBinary(bytes) {
	const length = Math.min(bytes.length, 800);
	let zeros = 0;
	for (let index = 0; index < length; index += 1) if (bytes[index] === 0) zeros += 1;
	return zeros > 0;
}
function decodeText(bytes) {
	return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}
function isZip(name, bytes) {
	if (extensionOf(name) === ".zip") return true;
	return bytes.length > 3 && bytes[0] === 80 && bytes[1] === 75;
}
async function docsFromText(name, text) {
	const ext = extensionOf(name);
	const trimmed = text.trim();
	if (!trimmed) return [];
	if (ext === ".csv" || ext === ".tsv") return docsFromTable(text, name);
	if (ext === ".jsonl") return docsFromJson(trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => JSON.parse(line)), name);
	if (trimmed.startsWith("{") || trimmed.startsWith("[") || ext === ".json") try {
		return docsFromJson(JSON.parse(trimmed), name);
	} catch (error) {
		if (ext === ".json") throw new Error(error instanceof Error ? `JSON не разобран: ${error.message}` : "JSON не разобран");
	}
	if (ext === ".html" || ext === ".htm" || /^<!doctype html/i.test(trimmed) || /<article\b/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) return docsFromHtml(text, name);
	return docsFromMarkdown(text, name, ext === ".txt" ? "Текст" : "Markdown");
}
async function expandInput(input, depth, issues) {
	const name = input.name || "без-имени";
	if (skipEntry(name)) return [];
	const bytes = input.bytes ?? (input.text != null ? new TextEncoder().encode(input.text) : /* @__PURE__ */ new Uint8Array());
	if (bytes.byteLength > MAX_FILE) throw new Error("Файл больше 8 МБ");
	if (/\.pdf$/i.test(name)) throw new Error("PDF как исходник не читается. Сначала разберите текст, PDF будет на выходе.");
	if (isZip(name, bytes)) {
		if (depth > 1) throw new Error("Слишком глубокая вложенность архива");
		const zip = await import_lib.default.loadAsync(bytes);
		const entries = Object.values(zip.files).filter((entry) => !entry.dir).slice(0, MAX_ENTRIES);
		const docs = [];
		for (const entry of entries) {
			if (skipEntry(entry.name)) continue;
			try {
				const content = await entry.async("uint8array");
				docs.push(...await expandInput({
					name: entry.name,
					bytes: content
				}, depth + 1, issues));
			} catch (error) {
				issues.push({
					file: entry.name,
					message: error instanceof Error ? error.message : "Не прочитан"
				});
			}
		}
		return docs;
	}
	if (looksBinary(bytes)) throw new Error("Это не текстовый файл");
	return docsFromText(name, input.text ?? decodeText(bytes));
}
function richness(doc) {
	return doc.messages.length * 10 + (doc.prose?.length ?? 0) + doc.tables.reduce((sum, table) => sum + table.rows.length, 0);
}
function dedupeDocs(docs) {
	const kept = [];
	const indexByTitle = /* @__PURE__ */ new Map();
	for (const doc of docs) {
		const key = doc.title.trim().toLowerCase();
		if (key.length < 2 || /^(без названия|untitled|index|каталог)$/i.test(key)) {
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
		if (richness(doc) > richness(previous) || richness(doc) === richness(previous) && doc.kind === "markdown") kept[existing] = doc;
	}
	return kept;
}
async function ingestSources(inputs) {
	const issues = [];
	const docs = [];
	for (const input of inputs) try {
		docs.push(...await expandInput(input, 0, issues));
	} catch (error) {
		issues.push({
			file: fileBase(input.name || "файл"),
			message: error instanceof Error ? error.message : "Не прочитан"
		});
	}
	const unique = dedupeDocs(docs).filter((doc) => doc.messages.length || doc.prose || doc.tables.length || doc.tree);
	if (!unique.length) throw new Error(issues[0]?.message || "Не нашёл читаемых документов. Подойдут JSON, Markdown, TXT, HTML, CSV и ZIP.");
	const labels = [...new Set(unique.map((doc) => doc.kindLabel))];
	const title = unique.length === 1 ? unique[0].title : `Набор · ${unique.length}`;
	return {
		id: nextId("bundle"),
		title,
		createdAt: (/* @__PURE__ */ new Date()).toISOString(),
		detected: labels.join(", "),
		docs: unique,
		issues
	};
}
function base64ToBytes(value) {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function isBlockedHost(hostname) {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
	if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host === "0.0.0.0" || host === "::1" || host === "metadata.google.internal") return true;
	const match = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
	if (!match) return false;
	const a = Number(match[1]);
	const b = Number(match[2]);
	if (a === 10 || a === 127 || a === 0) return true;
	if (a === 169 && b === 254) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 168) return true;
	return false;
}
function normalizeRemoteUrl(raw) {
	const url = new URL(raw);
	if (url.hostname.includes("drive.google.com") && /\/drive\/folders\//.test(url.pathname)) throw new Error("Папка Google Диска по ссылке не скачивается. Скачайте архив или выберите папку на компьютере.");
	const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
	if (url.hostname.includes("drive.google.com") && fileId && url.pathname.includes("/file/")) return `https://drive.google.com/uc?export=download&id=${fileId}`;
	return url.toString();
}
var fetchRemoteFile = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input !== "object" || typeof input.url !== "string") throw new Error("Нужна ссылка");
	const url = new URL(input.url);
	if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Только ссылки http и https");
	if (isBlockedHost(url.hostname)) throw new Error("Эта ссылка недоступна");
	return { url: url.toString() };
}).handler(createSsrRpc("187239d053849eee21f42821e4573c4335b6ec4787f09189645576374753bd04"));
var samples = [
	{
		id: "gpt",
		label: "ChatGPT JSON",
		input: {
			name: "conversations.json",
			text: JSON.stringify({
				title: "Приёмка на фулфилменте",
				create_time: 174e7,
				update_time: 1740001200,
				current_node: "a3",
				mapping: {
					root: {
						id: "root",
						message: null,
						parent: null,
						children: ["u1"]
					},
					u1: {
						id: "u1",
						parent: "root",
						children: ["a1", "a2"],
						message: {
							author: { role: "user" },
							create_time: 1740000001,
							recipient: "all",
							content: {
								content_type: "text",
								parts: ["Собери короткую методику приёмки. Нужны таблица этапов и чеклист."]
							}
						}
					},
					a1: {
						id: "a1",
						parent: "u1",
						children: [],
						message: {
							author: { role: "assistant" },
							create_time: 1740000020,
							recipient: "all",
							metadata: { model_slug: "gpt-4o" },
							content: {
								content_type: "text",
								parts: ["Черновик ветки, которую не оставили активной."]
							}
						}
					},
					a2: {
						id: "a2",
						parent: "u1",
						children: ["u2"],
						message: {
							author: { role: "assistant" },
							create_time: 1740000100,
							recipient: "all",
							metadata: { model_slug: "gpt-4o" },
							content: {
								content_type: "text",
								parts: ["## Приёмка\n\n| Этап | Срок | Кто |\n| --- | --- | --- |\n| Разгрузка | 30 мин | Смена А |\n| Сверка | 1 час | Кладовщик |\n\n- Скан штрихкодов\n- Фото повреждений\n\n```text\nGATE-IN → SCAN → QA → PUTAWAY\n```"]
							}
						}
					},
					u2: {
						id: "u2",
						parent: "a2",
						children: ["a3"],
						message: {
							author: { role: "user" },
							create_time: 1740000800,
							recipient: "all",
							content: {
								content_type: "text",
								parts: ["Добавь контроль Честного ЗНАКа отдельной строкой."]
							}
						}
					},
					a3: {
						id: "a3",
						parent: "u2",
						children: [],
						message: {
							author: { role: "assistant" },
							create_time: 1740000900,
							recipient: "all",
							metadata: { model_slug: "gpt-4o" },
							content: {
								content_type: "text",
								parts: ["Добавил этап **Маркировка**: сверка кода Честного ЗНАКа до размещения в ячейке."]
							}
						}
					},
					hidden: {
						id: "hidden",
						parent: "root",
						children: [],
						message: {
							author: { role: "system" },
							recipient: "all",
							metadata: { is_visually_hidden_from_conversation: true },
							content: {
								content_type: "text",
								parts: ["служебная инструкция"]
							}
						}
					}
				}
			})
		}
	},
	{
		id: "claude",
		label: "Claude JSON",
		input: {
			name: "conversations.json",
			text: JSON.stringify([{
				uuid: "c1",
				name: "Склад и маркировка",
				created_at: "2025-09-23T05:52:23.402627Z",
				chat_messages: [{
					sender: "human",
					created_at: "2025-09-23T05:52:23.402627Z",
					text: "Собери три шага запуска фулфилмента.",
					content: [{
						type: "text",
						text: "Собери три шага запуска фулфилмента."
					}]
				}, {
					sender: "assistant",
					created_at: "2025-09-23T05:52:48.661778Z",
					text: "",
					content: [
						{
							type: "thinking",
							thinking: "внутренний черновик"
						},
						{
							type: "text",
							text: "1. Зона приёмки\n2. Сверка маркировки\n3. Размещение\n\n| Шаг | Смысл |\n| --- | --- |\n| 1 | Ворота |\n| 2 | Честный ЗНАК |"
						},
						{
							type: "tool_use",
							name: "search"
						}
					]
				}]
			}])
		}
	},
	{
		id: "md",
		label: "Markdown",
		input: {
			name: "смена.md",
			text: `# Методика смены

Короткое предисловие к смене.

## Пользователь · 2025-09-23T05:52:23.402627Z

Собери регламент открытия смены.

## Claude · 2025-09-23T05:52:48.661778Z

### Открытие

1. Свет и ворота
2. Сверка остатка
3. Первая поставка

> Смена начинается со сверки, не с разгрузки.
`
		}
	},
	{
		id: "html",
		label: "HTML беседа",
		input: {
			name: "002.html",
			text: `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Ночная смена</title><main><h1>Ночная смена</h1><article><h3>Пользователь</h3><small>2025-06-08T06:52:33.253120Z</small><pre>Кто закрывает ворота?</pre></article><article><h3>Claude</h3><small>2025-06-08T06:52:35.202336Z</small><pre>Старший смены. В журнале нужна **отметка** и время.</pre></article></main></html>`
		}
	},
	{
		id: "csv",
		label: "Таблица CSV",
		input: {
			name: "этапы.csv",
			text: `Этап,Срок,Кто
Разгрузка,30 мин,Смена А
Сверка,1 час,Кладовщик
"Маркировка, ЗНАК",20 мин,Оператор
`
		}
	}
];
var DB_NAME = "folio";
var STORE = "bundles";
var MAX_KEPT = 24;
function openDb() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("База браузера недоступна"));
	});
}
async function saveBundle(bundle) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(bundle);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Не сохранилось"));
	});
	const extra = (await listBundles()).slice(MAX_KEPT);
	if (!extra.length) return;
	const trim = await openDb();
	await new Promise((resolve, reject) => {
		const tx = trim.transaction(STORE, "readwrite");
		for (const item of extra) tx.objectStore(STORE).delete(item.id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Не очистилось"));
	});
}
async function listBundles() {
	const db = await openDb();
	return (await new Promise((resolve, reject) => {
		const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
		request.onsuccess = () => resolve(request.result ?? []);
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("Не прочиталось"));
	})).map((bundle) => ({
		id: bundle.id,
		title: bundle.title,
		createdAt: bundle.createdAt,
		detected: bundle.detected,
		count: bundle.docs.length
	})).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
async function getBundle(id) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const request = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
		request.onsuccess = () => resolve(request.result ?? null);
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("Не прочиталось"));
	});
}
async function deleteBundle(id) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Не удалилось"));
	});
}
async function filesFromList(fileList) {
	return fileList.filter((file) => file.size <= 8e6 || file.name.toLowerCase().endsWith(".zip")).slice(0, 400);
}
async function readEntry(entry, bag, budget) {
	if (budget.left <= 0) return;
	if (entry.isFile) {
		const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
		bag.push(file);
		budget.left -= 1;
		return;
	}
	if (!entry.isDirectory) return;
	const reader = entry.createReader();
	const entries = [];
	while (true) {
		const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
		if (!batch.length) break;
		entries.push(...batch);
	}
	for (const child of entries) await readEntry(child, bag, budget);
}
function Studio({ initial = null, home = false }) {
	const router = useRouter();
	const fetchRemote = useServerFn(fetchRemoteFile);
	const fileRef = (0, import_react.useRef)(null);
	const dirRef = (0, import_react.useRef)(null);
	const [bundle, setBundle] = (0, import_react.useState)(initial);
	const [activeId, setActiveId] = (0, import_react.useState)(initial?.docs[0]?.id ?? null);
	const [mode, setMode] = (0, import_react.useState)("doc");
	const [query, setQuery] = (0, import_react.useState)("");
	const [showService, setShowService] = (0, import_react.useState)(false);
	const [scope, setScope] = (0, import_react.useState)("one");
	const [url, setUrl] = (0, import_react.useState)("");
	const [files, setFiles] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [notice, setNotice] = (0, import_react.useState)("");
	const [drag, setDrag] = (0, import_react.useState)(false);
	const [library, setLibrary] = (0, import_react.useState)([]);
	const [filter, setFilter] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		listBundles().then(setLibrary).catch(() => setLibrary([]));
	}, []);
	(0, import_react.useEffect)(() => {
		dirRef.current?.setAttribute("webkitdirectory", "");
		dirRef.current?.setAttribute("directory", "");
	}, [bundle]);
	const active = bundle?.docs.find((doc) => doc.id === activeId) ?? bundle?.docs[0] ?? null;
	const serviceCount = active?.messages.filter((message) => message.roleKey === "tool" || message.roleKey === "system").length ?? 0;
	async function run(inputs) {
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
		const inputs = [];
		for (const file of files) {
			const bytes = new Uint8Array(await file.arrayBuffer());
			inputs.push({
				name: file.webkitRelativePath || file.name,
				bytes
			});
		}
		const raw = url.trim();
		if (raw) {
			if (/^[a-zA-Z]:\\/.test(raw) || /^(\/Users\/|\/home\/|\\\\|~\/)/.test(raw)) {
				setError("Браузер не открывает путь на диске. Нажмите «Папка на компьютере» и укажите этот каталог — чтение останется у вас.");
				return;
			}
			if (/^https?:\/\//i.test(raw)) try {
				const normalized = normalizeRemoteUrl(raw);
				const remote = await fetchRemote({ data: { url: normalized } });
				inputs.push({
					name: remote.filename || "remote",
					bytes: base64ToBytes(remote.base64)
				});
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : "Ссылка не открылась");
				return;
			}
			else inputs.push({
				name: guessName(raw),
				text: raw
			});
		}
		if (!inputs.length) {
			setError("Добавьте файл, папку или ссылку.");
			return;
		}
		await run(inputs);
	}
	async function onDrop(event) {
		event.preventDefault();
		setDrag(false);
		const entries = [...event.dataTransfer.items].map((item) => item.webkitGetAsEntry?.()).filter((entry) => !!entry);
		if (entries.length) {
			const bag = [];
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
			const href = router.buildLocation({
				to: "/view/$id",
				params: { id: bundle.id }
			}).href;
			await navigator.clipboard.writeText(new URL(href, window.location.origin).toString());
			setNotice("Ссылка скопирована. Она открывается в этом браузере. Чтобы отправить документ, скачайте HTML и выложите файл — это и есть прямая страница просмотра.");
		} catch {
			setNotice("Не удалось скопировать ссылку.");
		}
	}
	async function openSaved(id) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "no-print sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2 text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-semibold text-bg",
							children: "F"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-base font-semibold tracking-tight",
							children: "Folio"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-sm text-muted sm:block",
						children: "Документы из архивов ИИ"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-2",
						children: [!home ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-muted",
							children: "Новый разбор"
						}) : bundle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 rounded-full px-3 text-sm font-medium text-muted",
							onClick: () => {
								setBundle(null);
								setFiles([]);
								setUrl("");
								setError("");
								setNotice("");
							},
							children: "Новый разбор"
						}) : null, library.length && !bundle ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm tabular-nums text-muted",
							children: [library.length, " в библиотеке"]
						}) : null]
					})
				]
			})
		}), !bundle ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-accent",
					children: "Локальная обработка"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl",
					children: "Архив чата становится документом."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-2xl text-pretty text-lg text-muted",
					children: "Claude, ChatGPT, Gemini, Grok, Markdown, JSON, HTML, CSV и ZIP. Формат определяется сам. Файлы читаются в браузере и не уходят на сервер — кроме случая, когда вы сами вставляете ссылку."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Intake, {
					url,
					setUrl,
					files,
					drag,
					busy,
					error,
					notice,
					fileRef,
					dirRef,
					onDrop,
					setDrag,
					onFiles: (list) => {
						setFiles(list);
						setNotice(list.length ? `В очереди ${list.length}.` : "");
					},
					onProcess: () => void process()
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex flex-wrap gap-2",
					children: samples.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 rounded-full bg-surface px-4 text-sm font-medium text-ink ring-1 ring-line",
						onClick: () => void run([sample.input]),
						children: sample.label
					}, sample.id))
				}),
				library.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold text-ink",
						children: "Недавние"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 divide-y divide-line rounded-3xl bg-surface ring-1 ring-line",
						children: library.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3 px-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "h-14 min-w-0 flex-1 text-left",
								onClick: () => void openSaved(item.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium text-ink",
									children: item.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted",
									children: [
										item.detected,
										" · ",
										item.count
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 px-2 text-sm text-muted",
								onClick: () => void deleteBundle(item.id).then(() => setLibrary((rows) => rows.filter((row) => row.id !== item.id))),
								children: "Удалить"
							})]
						}, item.id))
					})]
				}) : null
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-6xl lg:grid-cols-[280px_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "no-print border-line lg:min-h-[calc(100vh-4rem)] lg:border-r",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-4 py-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex h-11 items-center gap-2 rounded-full bg-surface px-3 ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: filter,
							onChange: (event) => setFilter(event.target.value),
							placeholder: "Найти беседу",
							className: "w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "max-h-72 overflow-auto px-2 pb-4 lg:max-h-[calc(100vh-8rem)]",
					children: shownDocs.map((doc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setActiveId(doc.id);
							setQuery("");
						},
						className: cn("w-full rounded-2xl px-3 py-3 text-left", doc.id === active?.id ? "bg-soft" : ""),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm font-medium text-ink",
							children: doc.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1 block truncate text-xs text-muted",
							children: [
								doc.kindLabel,
								" · ",
								doc.messages.length || doc.tables.length || 1
							]
						})]
					}) }, doc.id))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "min-w-0 px-4 py-4 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "no-print mb-4 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segment, {
								value: mode,
								onChange: setMode
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ml-auto flex rounded-full bg-soft p-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: cn("h-9 rounded-full px-3 text-sm", scope === "one" ? "bg-surface text-ink" : "text-muted"),
									onClick: () => setScope("one"),
									children: "Этот"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: cn("h-9 rounded-full px-3 text-sm", scope === "all" ? "bg-surface text-ink" : "text-muted"),
									onClick: () => setScope("all"),
									children: "Все"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: !active,
									onClick: () => {
										if (!active) return;
										downloadHtml(bundle, active, scope);
										setNotice(scope === "all" ? "Скачан один HTML со всеми документами. Файл открывается в любом браузере." : "HTML скачан. Откройте файл или отправьте его — страница смотрится без Folio.");
									},
									className: "inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-bg disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4" }), "Скачать HTML"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tool, {
									onClick: () => active && void downloadDocx(bundle, active, scope),
									children: "Word"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tool, {
									onClick: () => active && void downloadXlsx(bundle, active, scope),
									children: "Excel"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tool, {
									onClick: () => {
										if (!active) return;
										setNotice("Собираю PDF…");
										downloadPdf(bundle, active, scope).then(() => setNotice("PDF скачан. Откройте файл в любой программе для чтения.")).catch(() => setNotice("Не удалось собрать PDF."));
									},
									children: "PDF"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tool, {
									onClick: () => active && void downloadDocx(bundle, active, scope).then(() => setNotice("Файл .docx открывается в Google Документах: Файл → Открыть.")),
									children: "Google Документы"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tool, {
									onClick: () => active && downloadMarkdown(active),
									children: "Markdown"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tool, {
									onClick: () => active && downloadDiagram(active),
									children: "Схема SVG"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tool, {
									onClick: () => void share(),
									children: "Ссылка"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 min-w-64 flex-1 items-center gap-2 rounded-full bg-surface px-3 ring-1 ring-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: query,
									onChange: (event) => setQuery(event.target.value),
									placeholder: "Поиск по открытому документу",
									className: "w-full bg-transparent text-sm outline-none placeholder:text-muted"
								})]
							}), serviceCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: cn("h-11 rounded-full px-4 text-sm font-medium ring-1 ring-line", showService ? "bg-ink text-bg" : "bg-surface text-ink"),
								onClick: () => setShowService((value) => !value),
								children: ["Служебные · ", serviceCount]
							}) : null]
						}),
						notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: notice
						}) : null,
						bundle.issues.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: ["Пропущено: ", bundle.issues.slice(0, 3).map((issue) => `${issue.file} — ${issue.message}`).join("; ")]
						}) : null
					]
				}), active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocumentView, {
					doc: active,
					mode,
					query,
					showService
				}, active.id + mode) : null]
			})]
		})]
	});
}
function guessName(text) {
	const trimmed = text.trim();
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "вставка.json";
	if (/^<!doctype html|<html[\s>]/i.test(trimmed)) return "вставка.html";
	return "вставка.md";
}
function Segment({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex rounded-full bg-soft p-1",
		children: [
			{
				id: "doc",
				label: "Документ"
			},
			{
				id: "table",
				label: "Таблица"
			},
			{
				id: "map",
				label: "Схема"
			}
		].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange(item.id),
			className: cn("h-9 rounded-full px-4 text-sm font-medium", value === item.id ? "bg-ink text-bg" : "text-muted"),
			children: item.label
		}, item.id))
	});
}
function Tool({ children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "h-11 rounded-full bg-surface px-4 text-sm font-medium text-ink ring-1 ring-line",
		children
	});
}
function Intake({ url, setUrl, files, drag, busy, error, notice, fileRef, dirRef, onDrop, setDrag, onFiles, onProcess }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		onDragOver: (event) => {
			event.preventDefault();
			setDrag(true);
		},
		onDragLeave: () => setDrag(false),
		onDrop,
		className: cn("mt-8 rounded-3xl bg-surface p-4 ring-1 sm:p-6", drag ? "ring-accent" : "ring-line"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: url,
					onChange: (event) => setUrl(event.target.value),
					onKeyDown: (event) => {
						if (event.key === "Enter") onProcess();
					},
					placeholder: "Ссылка, путь к папке или вставленный текст",
					className: "h-12 w-full rounded-full bg-bg px-4 text-sm text-ink outline-none ring-1 ring-line placeholder:text-muted"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: busy,
					onClick: onProcess,
					className: "h-12 shrink-0 rounded-full bg-ink px-6 text-sm font-semibold text-bg disabled:opacity-50",
					children: busy ? "Читаю…" : "Обработать"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => fileRef.current?.click(),
						className: "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-4 w-4" }), " Файлы"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => dirRef.current?.click(),
						className: "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "h-4 w-4" }), " Папка на компьютере"]
					}),
					files.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "self-center text-sm text-muted",
						children: [files.length, " выбрано"]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				multiple: true,
				accept: ".md,.markdown,.txt,.json,.jsonl,.csv,.tsv,.html,.htm,.zip,text/*,application/json,application/zip",
				className: "hidden",
				onChange: (event) => onFiles([...event.target.files ?? []])
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: dirRef,
				type: "file",
				multiple: true,
				className: "hidden",
				onChange: (event) => onFiles([...event.target.files ?? []])
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-ink",
				children: error
			}) : null,
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: notice
			}) : null
		]
	});
}
//#endregion
export { getBundle as n, Studio as t };
