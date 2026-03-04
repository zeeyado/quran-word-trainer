import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { ChapterAudioFile, Word, Verse, AudioSegment } from "../api/types";

export interface SyncedWord {
  word: Word;
  verseKey: string;
  segment: AudioSegment;
}

interface AudioSyncState {
  /** Flat list of all words with their timing info */
  syncedWords: SyncedWord[];
  /** Index of the currently active word */
  currentIndex: number;
  /** Whether audio is playing */
  isPlaying: boolean;
  /** Playback speed multiplier */
  speed: number;
}

/**
 * Core hook: synchronizes audio playback with word-level display.
 *
 * Takes chapter audio (with timing segments) and verse word data,
 * builds a flat timeline of words, and tracks which word is active
 * as the audio plays.
 */
export function useAudioSync(
  audioFile: ChapterAudioFile | null,
  verses: Verse[],
  initialIndex?: number
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);

  // Build the flat synced word list (pure derivation from props)
  const syncedWords = useMemo(() => {
    if (!audioFile || verses.length === 0) return [];

    const words: SyncedWord[] = [];

    for (const ts of audioFile.timestamps) {
      const verse = verses.find((v) => v.verse_key === ts.verse_key);
      if (!verse) continue;

      const segs = ts.segments.filter((s) => s.length >= 3);
      let maxPos = 0;

      for (let i = 0; i < segs.length; i++) {
        const [wordPos] = segs[i];

        // Skip isolated backward jumps (likely forced-alignment errors).
        // A backward segment is "isolated" if the next segment jumps forward
        // past the previous max — indicating a single glitch, not a sustained
        // reciter repetition (which would continue forward from the lower pos).
        if (wordPos < maxPos) {
          const nextPos = i + 1 < segs.length ? segs[i + 1][0] : null;
          if (nextPos === null || nextPos > maxPos) continue;
        }

        maxPos = Math.max(maxPos, wordPos);

        const word = verse.words.find(
          (w) => w.position === wordPos && w.char_type_name === "word"
        );
        if (!word) continue;

        words.push({ word, verseKey: ts.verse_key, segment: segs[i] });
      }
    }

    return words;
  }, [audioFile, verses]);

  // Reset currentIndex when synced words change
  const [prevSyncedWords, setPrevSyncedWords] = useState(syncedWords);
  const [usedInitialIndex, setUsedInitialIndex] = useState(false);

  const [state, setState] = useState<AudioSyncState>({
    syncedWords: [],
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
  });

  if (syncedWords !== prevSyncedWords) {
    setPrevSyncedWords(syncedWords);
    let idx = 0;
    if (!usedInitialIndex && initialIndex != null && syncedWords.length > 0) {
      idx = Math.min(initialIndex, syncedWords.length - 1);
      setUsedInitialIndex(true);
    }
    setState((s) => ({ ...s, syncedWords, currentIndex: idx }));
  }

  // Animation loop: track current word based on audio currentTime
  useEffect(() => {
    if (!state.isPlaying || state.syncedWords.length === 0) return;

    const loop = () => {
      const audio = audioRef.current;
      if (!audio) return;

      const currentMs = audio.currentTime * 1000;

      setState((s) => {
        let idx = s.currentIndex;
        for (let i = 0; i < s.syncedWords.length; i++) {
          const [, start, end] = s.syncedWords[i].segment;
          if (currentMs >= start && currentMs < end) {
            idx = i;
            break;
          }
        }
        return idx !== s.currentIndex ? { ...s, currentIndex: idx } : s;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state.isPlaying, state.syncedWords]);

  const play = useCallback(() => {
    if (!audioFile) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioFile.audio_url);
    }

    // Always seek to the displayed word's start time before playing.
    // Prevents desync when browser resets audio position after idle/background.
    const currentSW = state.syncedWords[state.currentIndex];
    if (currentSW) {
      const [, startMs] = currentSW.segment;
      audioRef.current.currentTime = startMs / 1000;
    }

    audioRef.current.playbackRate = state.speed;
    audioRef.current.play();
    setState((s) => ({ ...s, isPlaying: true }));
  }, [audioFile, state.speed, state.syncedWords, state.currentIndex]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const seekToWord = useCallback(
    (index: number) => {
      if (!audioRef.current || index < 0 || index >= state.syncedWords.length) return;
      const [, startMs] = state.syncedWords[index].segment;
      audioRef.current.currentTime = startMs / 1000;
      setState((s) => ({ ...s, currentIndex: index }));
    },
    [state.syncedWords]
  );

  const nextWord = useCallback(() => {
    seekToWord(state.currentIndex + 1);
  }, [state.currentIndex, seekToWord]);

  const prevWord = useCallback(() => {
    seekToWord(state.currentIndex - 1);
  }, [state.currentIndex, seekToWord]);

  const setSpeed = useCallback((speed: number) => {
    setState((s) => ({ ...s, speed }));
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return {
    syncedWords: state.syncedWords,
    currentIndex: state.currentIndex,
    currentWord: state.syncedWords[state.currentIndex] ?? null,
    isPlaying: state.isPlaying,
    speed: state.speed,
    play,
    pause,
    nextWord,
    prevWord,
    seekToWord,
    setSpeed,
  };
}
