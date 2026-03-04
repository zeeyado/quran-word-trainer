import { useState, useEffect } from "react";
import type { Verse } from "../api/types";
import { fetchVerses } from "../api/quran";
import { cacheGet, cacheSet } from "../api/cache";

/** Fetch and cache word-by-word data for a chapter */
export function useWordData(chapterNumber: number | null) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chapterNumber === null) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cacheKey = `chapter-${chapterNumber}`;
        const cached = await cacheGet<Verse[]>("verses", cacheKey);
        if (cached && !cancelled) {
          setVerses(cached);
          setLoading(false);
          return;
        }

        const data = await fetchVerses(chapterNumber!);
        if (!cancelled) {
          setVerses(data);
          await cacheSet("verses", cacheKey, data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load verses");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [chapterNumber]);

  return { verses, loading, error };
}
