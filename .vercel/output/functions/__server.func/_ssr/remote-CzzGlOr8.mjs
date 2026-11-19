import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/remote-CzzGlOr8.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var MAX_BYTES = 8e6;
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
var fetchRemoteFile_createServerFn_handler = createServerRpc({
	id: "187239d053849eee21f42821e4573c4335b6ec4787f09189645576374753bd04",
	name: "fetchRemoteFile",
	filename: "src/lib/folio/remote.ts"
}, (opts) => fetchRemoteFile.__executeServer(opts));
var fetchRemoteFile = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input !== "object" || typeof input.url !== "string") throw new Error("Нужна ссылка");
	const url = new URL(input.url);
	if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Только ссылки http и https");
	if (isBlockedHost(url.hostname)) throw new Error("Эта ссылка недоступна");
	return { url: url.toString() };
}).handler(fetchRemoteFile_createServerFn_handler, async ({ data }) => {
	let current = data.url;
	let response = null;
	for (let hop = 0; hop < 4; hop += 1) {
		const url = new URL(current);
		if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Только ссылки http и https");
		if (isBlockedHost(url.hostname)) throw new Error("Эта ссылка недоступна");
		response = await fetch(current, {
			redirect: "manual",
			signal: AbortSignal.timeout(2e4),
			headers: {
				accept: "*/*",
				"user-agent": "Folio/1.0"
			}
		});
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get("location");
			if (!location) throw new Error("Редирект без адреса");
			current = new URL(location, current).toString();
			continue;
		}
		break;
	}
	if (!response) throw new Error("Пустой ответ");
	if (!response.ok) throw new Error(`Сервер ответил ${response.status}`);
	const reader = response.body?.getReader();
	if (!reader) throw new Error("Пустой ответ");
	const chunks = [];
	let total = 0;
	while (true) {
		const step = await reader.read();
		if (step.done) break;
		total += step.value.byteLength;
		if (total > MAX_BYTES) {
			await reader.cancel();
			throw new Error("Файл больше 8 МБ");
		}
		chunks.push(step.value);
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	let binary = "";
	const stepSize = 8192;
	for (let index = 0; index < bytes.length; index += stepSize) binary += String.fromCharCode(...bytes.subarray(index, index + stepSize));
	const disposition = response.headers.get("content-disposition") ?? "";
	const named = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition)?.[1];
	const fallback = decodeURIComponent(current.split("/").pop()?.split("?")[0] || "remote");
	return {
		filename: decodeURIComponent((named || fallback).replace(/"/g, "")) || "remote",
		contentType: response.headers.get("content-type") ?? "",
		base64: btoa(binary)
	};
});
//#endregion
export { fetchRemoteFile_createServerFn_handler };
