// Browser-side caching layer using IndexedDB
//
// All Quranic data is immutable — cache aggressively.
// Audio files are cached via the Cache API (service worker in v0.2+).
// Verse/word data and audio segments are cached in IndexedDB.

const DB_NAME = "quran-word-trainer";
const DB_VERSION = 1;

const STORES = {
  chapters: "chapters",
  verses: "verses",
  audioSegments: "audioSegments",
} as const;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.chapters)) {
        db.createObjectStore(STORES.chapters);
      }
      if (!db.objectStoreNames.contains(STORES.verses)) {
        db.createObjectStore(STORES.verses);
      }
      if (!db.objectStoreNames.contains(STORES.audioSegments)) {
        db.createObjectStore(STORES.audioSegments);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheGet<T>(store: keyof typeof STORES, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[store], "readonly");
    const req = tx.objectStore(STORES[store]).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheSet<T>(store: keyof typeof STORES, key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[store], "readwrite");
    tx.objectStore(STORES[store]).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
