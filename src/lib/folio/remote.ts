import { createServerFn } from "@tanstack/react-start";

const MAX_BYTES = 8_000_000;

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "metadata.google.internal"
  ) {
    return true;
  }
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

export function normalizeRemoteUrl(raw: string): string {
  const url = new URL(raw);
  if (url.hostname.includes("drive.google.com") && /\/drive\/folders\//.test(url.pathname)) {
    throw new Error(
      "Папка Google Диска по ссылке не скачивается. Скачайте архив или выберите папку на компьютере.",
    );
  }
  const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
  if (url.hostname.includes("drive.google.com") && fileId && url.pathname.includes("/file/")) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url.toString();
}

export const fetchRemoteFile = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || typeof (input as { url?: unknown }).url !== "string") {
      throw new Error("Нужна ссылка");
    }
    const url = new URL((input as { url: string }).url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Только ссылки http и https");
    }
    if (isBlockedHost(url.hostname)) throw new Error("Эта ссылка недоступна");
    return { url: url.toString() };
  })
  .handler(async ({ data }) => {
    let current = data.url;
    let response: Response | null = null;
    for (let hop = 0; hop < 4; hop += 1) {
      const url = new URL(current);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Только ссылки http и https");
      }
      if (isBlockedHost(url.hostname)) throw new Error("Эта ссылка недоступна");
      response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
        headers: { accept: "*/*", "user-agent": "Folio/1.0" },
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
    const chunks: Uint8Array[] = [];
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
    for (let index = 0; index < bytes.length; index += stepSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + stepSize));
    }
    const disposition = response.headers.get("content-disposition") ?? "";
    const named = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition)?.[1];
    const fallback = decodeURIComponent(current.split("/").pop()?.split("?")[0] || "remote");
    return {
      filename: decodeURIComponent((named || fallback).replace(/"/g, "")) || "remote",
      contentType: response.headers.get("content-type") ?? "",
      base64: btoa(binary),
    };
  });
