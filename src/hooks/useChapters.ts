import { useState, useEffect } from "react";
import type { Chapter } from "../api/types";
import { fetchChapters } from "../api/quran";
import { cacheGet, cacheSet } from "../api/cache";

/** Fetch and cache the 114 surah metadata entries */
export function useChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Check cache first
        const cached = await cacheGet<Chapter[]>("chapters", "all");
        if (cached && !cancelled) {
          setChapters(cached);
          setLoading(false);
          return;
        }

        const data = await fetchChapters();
        if (!cancelled) {
          setChapters(data);
          await cacheSet("chapters", "all", data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chapters");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { chapters, loading, error };
}
