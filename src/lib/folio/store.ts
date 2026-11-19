import type { Bundle } from "./types";

const DB_NAME = "folio";
const STORE = "bundles";
const MAX_KEPT = 24;

export type BundleMeta = {
  id: string;
  title: string;
  createdAt: string;
  detected: string;
  count: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("База браузера недоступна"));
  });
}

export async function saveBundle(bundle: Bundle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(bundle);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Не сохранилось"));
  });
  const all = await listBundles();
  const extra = all.slice(MAX_KEPT);
  if (!extra.length) return;
  const trim = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = trim.transaction(STORE, "readwrite");
    for (const item of extra) tx.objectStore(STORE).delete(item.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Не очистилось"));
  });
}

export async function listBundles(): Promise<BundleMeta[]> {
  const db = await openDb();
  const rows = await new Promise<Bundle[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as Bundle[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("Не прочиталось"));
  });
  return rows
    .map((bundle) => ({
      id: bundle.id,
      title: bundle.title,
      createdAt: bundle.createdAt,
      detected: bundle.detected,
      count: bundle.docs.length,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBundle(id: string): Promise<Bundle | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as Bundle | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Не прочиталось"));
  });
}

export async function deleteBundle(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Не удалилось"));
  });
}
