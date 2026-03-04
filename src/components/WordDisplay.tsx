import { useCallback, useEffect, useState } from "react";
import type { SyncedWord } from "../hooks/useAudioSync";
import type { FontVariant, ResolvedTheme } from "../utils/qcfFont";
import { loadQcfFont, preloadQcfFont, qcfFontFamily } from "../utils/qcfFont";

interface Props {
  currentWord: SyncedWord | null;
  showVerseRef: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  tajweedEnabled: boolean;
  resolvedTheme: ResolvedTheme;
}

export function WordDisplay({ currentWord, showVerseRef, showTransliteration, showTranslation, tajweedEnabled, resolvedTheme }: Props) {
  const [fontReady, setFontReady] = useState(false);
  const [prevPage, setPrevPage] = useState<number | null>(null);
  const [prevVariant, setPrevVariant] = useState<FontVariant>("v4");
  const [prevTheme, setPrevTheme] = useState<ResolvedTheme>(resolvedTheme);
  const pageNumber = currentWord?.word.page_number ?? null;
  const variant: FontVariant = tajweedEnabled ? "v4" : "v2";

  // Reset fontReady during render when page, variant, or theme changes
  if (pageNumber !== prevPage || variant !== prevVariant || resolvedTheme !== prevTheme) {
    setPrevPage(pageNumber);
    setPrevVariant(variant);
    setPrevTheme(resolvedTheme);
    setFontReady(false);
  }

  useEffect(() => {
    if (pageNumber === null) return;
    let cancelled = false;
    loadQcfFont(pageNumber, variant, resolvedTheme)
      .then(() => {
        if (!cancelled) setFontReady(true);
        preloadQcfFont(pageNumber + 1, variant, resolvedTheme);
      })
      .catch(() => { /* font failed — will show text_uthmani fallback */ });
    return () => { cancelled = true; };
  }, [pageNumber, variant, resolvedTheme]);

  if (!currentWord) {
    return (
      <div className="word-display word-display--empty">
        <p className="word-display__placeholder">Select a surah to begin</p>
      </div>
    );
  }

  const { word, verseKey } = currentWord;

  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    e.clipboardData.setData("text/plain", word.text_uthmani);
  }, [word.text_uthmani]);

  return (
    <div className="word-display">
      {showVerseRef && <div className="word-display__verse-ref">{verseKey}</div>}

      <div className="word-display__arabic" dir="rtl" lang="ar" onCopy={handleCopy}>
        {fontReady ? (
          <span
            style={{ fontFamily: `"${qcfFontFamily(pageNumber!, variant, resolvedTheme)}"` }}
          >
            {word.code_v2}
          </span>
        ) : (
          word.text_uthmani
        )}
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
