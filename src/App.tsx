import { useState } from "react";
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

export default function App() {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [immersiveEnabled, setImmersiveEnabled] = useState(false);

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
  } = useAudioSync(audioFile, verses);

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
        onClick={immersiveActive ? pause : undefined}
        style={immersiveActive ? { cursor: "pointer" } : undefined}
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
