import { useState, useEffect, useRef, useCallback } from "react";
import { RECITERS } from "./api/quran";
import { useChapters } from "./hooks/useChapters";
import { useWordData } from "./hooks/useWordData";
import { useChapterAudio } from "./hooks/useChapterAudio";
import { useAudioSync } from "./hooks/useAudioSync";
import { SurahSelector } from "./components/SurahSelector";
import { AyahSelector } from "./components/AyahSelector";
import { ReciterSelector } from "./components/ReciterSelector";
import { WordDisplay } from "./components/WordDisplay";
import { PlayerControls } from "./components/PlayerControls";
import { SettingsPanel } from "./components/SettingsPanel";
import { useTheme } from "./hooks/useTheme";

const STORAGE_KEY = "qwt-state";

interface SavedState {
  chapter: number;
  reciter: number;
  wordIndex: number;
}

function loadSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const saved = loadSavedState();

export default function App() {
  const [selectedChapter, setSelectedChapter] = useState<number>(saved?.chapter ?? 1);
  const [selectedReciter, setSelectedReciter] = useState(saved?.reciter ?? RECITERS[0].id);
  const [showVerseRef, setShowVerseRef] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [stopAfterSelection, setStopAfterSelection] = useState(true);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("qwt-tajweed") !== "false"; }
    catch { return true; }
  });
  const { preference: themePreference, resolved: resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    try { localStorage.setItem("qwt-tajweed", String(tajweedEnabled)); } catch { /* ignore */ }
  }, [tajweedEnabled]);

  const handlePlaybackEnd = useCallback(() => {
    setImmersiveMode(false);
  }, []);

  const savedWordIndex = saved?.wordIndex ?? 0;

  const { chapters, loading: chaptersLoading } = useChapters();
  const { verses, loading: versesLoading } = useWordData(selectedChapter);
  const { audioFile, loading: audioLoading } = useChapterAudio(
    selectedReciter,
    selectedChapter
  );

  const {
    syncedWords,
    currentWord,
    currentIndex,
    isPlaying,
    speed,
    play,
    pause,
    nextWord,
    prevWord,
    seekToWord,
    setSpeed,
  } = useAudioSync(audioFile, verses, savedWordIndex, stopAfterSelection, handlePlaybackEnd);

  const currentChapter = chapters.find((ch) => ch.id === selectedChapter);
  const versesCount = currentChapter?.verses_count ?? 0;
  const currentAyah = currentWord
    ? Number(currentWord.verseKey.split(":")[1])
    : 1;

  const handleAyahSelect = (ayah: number) => {
    const targetKey = `${selectedChapter}:${ayah}`;
    const idx = syncedWords.findIndex((sw) => sw.verseKey === targetKey);
    if (idx >= 0) seekToWord(idx);
  };

  // Keep ref in sync for use in event listeners
  const stateRef = useRef({ chapter: selectedChapter, reciter: selectedReciter, wordIndex: currentIndex });
  useEffect(() => {
    stateRef.current = { chapter: selectedChapter, reciter: selectedReciter, wordIndex: currentIndex };
  }, [selectedChapter, selectedReciter, currentIndex]);

  // Persist state to localStorage
  useEffect(() => {
    const save = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
    };

    document.addEventListener("visibilitychange", save);
    window.addEventListener("beforeunload", save);
    return () => {
      save();
      document.removeEventListener("visibilitychange", save);
      window.removeEventListener("beforeunload", save);
    };
  }, []);

  const isLoading = chaptersLoading || versesLoading || audioLoading;

  const enterImmersive = useCallback(() => {
    setImmersiveMode(true);
    setControlsVisible(false);
  }, []);

  const exitImmersive = useCallback(() => {
    setImmersiveMode(false);
  }, []);

  return (
    <>
      <div className="app">
        <header className="app__header">
          <h1 className="app__title">Quran Word Trainer</h1>
          <div className="app__selectors">
            <SurahSelector
              chapters={chapters}
              selectedChapter={selectedChapter}
              onSelect={setSelectedChapter}
            />
            {versesCount > 0 && (
              <AyahSelector
                versesCount={versesCount}
                currentAyah={currentAyah}
                onSelect={handleAyahSelect}
              />
            )}
            <ReciterSelector
              reciters={RECITERS}
              selectedId={selectedReciter}
              onSelect={setSelectedReciter}
            />
          </div>
        </header>

        <main className="app__main">
          {isLoading ? (
            <div className="app__loading">Loading...</div>
          ) : (
            <WordDisplay
              currentWord={currentWord}
              showVerseRef={showVerseRef}
              showTransliteration={showTransliteration}
              showTranslation={showTranslation}
              tajweedEnabled={tajweedEnabled}
              resolvedTheme={resolvedTheme}
            />
          )}
        </main>

        <footer className="app__footer">
          <PlayerControls
            isPlaying={isPlaying}
            speed={speed}
            currentIndex={currentIndex}
            totalWords={syncedWords.length}
            onPlay={play}
            onPause={pause}
            onPrev={prevWord}
            onNext={nextWord}
            onSpeedChange={setSpeed}
            onEnterImmersive={enterImmersive}
          />

          <SettingsPanel
            showVerseRef={showVerseRef}
            showTransliteration={showTransliteration}
            showTranslation={showTranslation}
            stopAfterSelection={stopAfterSelection}
            tajweedEnabled={tajweedEnabled}
            themePreference={themePreference}
            onToggleVerseRef={() => setShowVerseRef((v) => !v)}
            onToggleTransliteration={() => setShowTransliteration((v) => !v)}
            onToggleTranslation={() => setShowTranslation((v) => !v)}
            onToggleStopAfter={() => setStopAfterSelection((v) => !v)}
            onToggleTajweed={() => setTajweedEnabled((v) => !v)}
            onThemeChange={setTheme}
          />
        </footer>
      </div>

      {immersiveMode && (
        <div
          className="immersive"
          onClick={() => setControlsVisible((v) => !v)}
        >
          <div className="immersive__word">
            <WordDisplay
              currentWord={currentWord}
              showVerseRef={showVerseRef}
              showTransliteration={showTransliteration}
              showTranslation={showTranslation}
              tajweedEnabled={tajweedEnabled}
              resolvedTheme={resolvedTheme}
            />
          </div>

          {controlsVisible && (
            <div
              className="immersive__controls"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="immersive__transport">
                <button onClick={prevWord} disabled={currentIndex <= 0}>
                  &#x23EE;
                </button>
                <button
                  onClick={isPlaying ? pause : play}
                  className="immersive__play"
                >
                  {isPlaying ? "\u23F8" : "\u25B6"}
                </button>
                <button onClick={nextWord} disabled={currentIndex >= syncedWords.length - 1}>
                  &#x23ED;
                </button>
              </div>

              <div className="immersive__speed">
                <input
                  type="range"
                  min={0.25}
                  max={2}
                  step={0.25}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
                <span className="immersive__speed-label">{speed}x</span>
              </div>

              <div className="immersive__bottom">
                <span className="immersive__progress">
                  {syncedWords.length > 0 ? `${currentIndex + 1} / ${syncedWords.length}` : "\u2014"}
                </span>
                <button onClick={exitImmersive} className="immersive__toggle" title="Exit focus mode">
                  &#x26F6;
                </button>
              </div>

              <SettingsPanel
                showVerseRef={showVerseRef}
                showTransliteration={showTransliteration}
                showTranslation={showTranslation}
                stopAfterSelection={stopAfterSelection}
                tajweedEnabled={tajweedEnabled}
                themePreference={themePreference}
                onToggleVerseRef={() => setShowVerseRef((v) => !v)}
                onToggleTransliteration={() => setShowTransliteration((v) => !v)}
                onToggleTranslation={() => setShowTranslation((v) => !v)}
                onToggleStopAfter={() => setStopAfterSelection((v) => !v)}
                onToggleTajweed={() => setTajweedEnabled((v) => !v)}
                onThemeChange={setTheme}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
