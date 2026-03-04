import { useEffect, useState } from "react";
import type { SyncedWord } from "../hooks/useAudioSync";
import { loadQcfFont, preloadQcfFont, qcfFontFamily } from "../utils/qcfFont";

interface Props {
  currentWord: SyncedWord | null;
  showTransliteration: boolean;
  showTranslation: boolean;
}

export function WordDisplay({ currentWord, showTransliteration, showTranslation }: Props) {
  const [fontReady, setFontReady] = useState(false);
  const [prevPage, setPrevPage] = useState<number | null>(null);
  const pageNumber = currentWord?.word.page_number ?? null;

  // Reset fontReady during render when page changes
  if (pageNumber !== prevPage) {
    setPrevPage(pageNumber);
    setFontReady(false);
  }

  useEffect(() => {
    if (pageNumber === null) return;
    let cancelled = false;
    loadQcfFont(pageNumber)
      .then(() => {
        if (!cancelled) setFontReady(true);
        preloadQcfFont(pageNumber + 1);
      })
      .catch(() => { /* font failed — will show text_uthmani fallback */ });
    return () => { cancelled = true; };
  }, [pageNumber]);

  if (!currentWord) {
    return (
      <div className="word-display word-display--empty">
        <p className="word-display__placeholder">Select a surah to begin</p>
      </div>
    );
  }

  const { word, verseKey } = currentWord;

  return (
    <div className="word-display">
      <div className="word-display__verse-ref">{verseKey}</div>

      <div
        className="word-display__arabic"
        dir="rtl"
        lang="ar"
        style={fontReady ? { fontFamily: `"${qcfFontFamily(pageNumber!)}"` } : undefined}
      >
        {fontReady ? word.code_v2 : word.text_uthmani}
      </div>

      {showTransliteration && word.transliteration?.text && (
        <div className="word-display__transliteration">
          {word.transliteration.text}
        </div>
      )}

      {showTranslation && word.translation?.text && (
        <div className="word-display__translation">
          {word.translation.text}
        </div>
      )}
    </div>
  );
}
