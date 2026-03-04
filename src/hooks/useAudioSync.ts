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
  initialIndex?: number,
  stopAfterSelection?: boolean
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const stopAfterRef = useRef(stopAfterSelection ?? true);
  stopAfterRef.current = stopAfterSelection ?? true;

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
    // Stop playback when data changes (chapter/reciter switch)
    audioRef.current?.pause();
    setState((s) => ({ ...s, syncedWords, currentIndex: idx, isPlaying: false }));
  }

  // Animation loop: track current word based on audio currentTime
  useEffect(() => {
    if (!state.isPlaying || state.syncedWords.length === 0) return;

    const loop = () => {
      const audio = audioRef.current;
      if (!audio) return;

      const currentMs = audio.currentTime * 1000;

      // Stop at end of last synced word when "stop after selection" is on
      if (stopAfterRef.current) {
        const lastSeg = state.syncedWords[state.syncedWords.length - 1]?.segment;
        if (lastSeg && currentMs >= lastSeg[2]) {
          audio.pause();
          setState((s) => ({ ...s, isPlaying: false }));
          return;
        }
      }

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

  // Ensure audio element exists (lazy-created, replaced on URL change)
  const ensureAudio = useCallback(() => {
    if (!audioFile) return null;
    if (audioRef.current && audioRef.current.src === audioFile.audio_url) {
      return audioRef.current;
    }
    // New audio file — replace element
    audioRef.current?.pause();
    const audio = new Audio(audioFile.audio_url);
    audio.addEventListener("ended", () => {
      setState((s) => ({ ...s, isPlaying: false }));
    });
    audioRef.current = audio;
    return audio;
  }, [audioFile]);

  const play = useCallback(() => {
    const audio = ensureAudio();
    if (!audio) return;

    // Always seek to the displayed word's start time before playing.
    // Prevents desync when browser resets audio position after idle/background.
    const currentSW = state.syncedWords[state.currentIndex];
    if (currentSW) {
      const [, startMs] = currentSW.segment;
      audio.currentTime = startMs / 1000;
    }

    audio.playbackRate = state.speed;
    audio.play();
    setState((s) => ({ ...s, isPlaying: true }));
  }, [ensureAudio, state.speed, state.syncedWords, state.currentIndex]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const seekToWord = useCallback(
    (index: number) => {
      if (index < 0 || index >= state.syncedWords.length) return;
      const audio = ensureAudio();
      if (audio) {
        const [, startMs] = state.syncedWords[index].segment;
        audio.currentTime = startMs / 1000;
      }
      setState((s) => ({ ...s, currentIndex: index }));
    },
    [state.syncedWords, ensureAudio]
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
