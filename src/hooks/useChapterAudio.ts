import { useState, useEffect } from "react";
import type { ChapterAudioFile } from "../api/types";
import { fetchChapterAudio } from "../api/quran";
import { cacheGet, cacheSet } from "../api/cache";

/** Fetch and cache chapter audio metadata with word-level timing segments */
export function useChapterAudio(reciterId: number | null, chapterNumber: number | null) {
  const [audioFile, setAudioFile] = useState<ChapterAudioFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reciterId === null || chapterNumber === null) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cacheKey = `reciter-${reciterId}-chapter-${chapterNumber}`;
        const cached = await cacheGet<ChapterAudioFile>("audioSegments", cacheKey);
        if (cached && !cancelled) {
          setAudioFile(cached);
          setLoading(false);
          return;
        }

        const data = await fetchChapterAudio(reciterId!, chapterNumber!);
        if (!cancelled) {
          setAudioFile(data.audio_file);
          await cacheSet("audioSegments", cacheKey, data.audio_file);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load audio");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [reciterId, chapterNumber]);

  return { audioFile, loading, error };
}
