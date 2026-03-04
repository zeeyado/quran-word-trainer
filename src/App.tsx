import { useState, useEffect, useRef } from "react";
import { RECITERS } from "./api/quran";
import { useChapters } from "./hooks/useChapters";
import { useWordData } from "./hooks/useWordData";
import { useChapterAudio } from "./hooks/useChapterAudio";
import { useAudioSync } from "./hooks/useAudioSync";
import { SurahSelector } from "./components/SurahSelector";
import { ReciterSelector } from "./components/ReciterSelector";
import { WordDisplay } from "./components/WordDisplay";
import { PlayerControls } from "./components/PlayerControls";
import { SettingsPanel } from "./components/SettingsPanel";

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
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [immersiveEnabled, setImmersiveEnabled] = useState(false);

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
    setSpeed,
  } = useAudioSync(audioFile, verses, savedWordIndex);

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
  const immersiveActive = immersiveEnabled && isPlaying;

  return (
    <div className={`app${immersiveActive ? " app--immersive" : ""}`}>
      <header className="app__header">
        <h1 className="app__title">Quran Word Trainer</h1>
        <div className="app__selectors">
          <SurahSelector
            chapters={chapters}
            selectedChapter={selectedChapter}
            onSelect={setSelectedChapter}
          />
          <ReciterSelector
            reciters={RECITERS}
            selectedId={selectedReciter}
            onSelect={setSelectedReciter}
          />
        </div>
      </header>

      <main
        className="app__main"
        onClick={immersiveActive ? () => setImmersiveEnabled(false) : undefined}
      >
        {isLoading ? (
          <div className="app__loading">Loading...</div>
        ) : (
          <WordDisplay
            currentWord={currentWord}
            showTransliteration={showTransliteration}
            showTranslation={showTranslation}
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
        />

        <SettingsPanel
          showTransliteration={showTransliteration}
          showTranslation={showTranslation}
          immersiveEnabled={immersiveEnabled}
          onToggleTransliteration={() => setShowTransliteration((v) => !v)}
          onToggleTranslation={() => setShowTranslation((v) => !v)}
          onToggleImmersive={() => setImmersiveEnabled((v) => !v)}
        />
      </footer>
    </div>
  );
}
