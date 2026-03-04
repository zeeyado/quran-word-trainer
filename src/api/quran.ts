// Quran.com API v4 client

import type {
  ChapterRecitationResponse,
  VersesResponse,
  Chapter,
  ReciterConfig,
} from "./types";

const API_BASE = "https://api.quran.com/api/v4";
const AUDIO_CDN = "https://audio.qurancdn.com";

/** Available reciters with word-level timing data */
export const RECITERS: ReciterConfig[] = [
  {
    id: 7,
    name: "Mishari Al-Afasy",
    nameArabic: "مشاري راشد العفاسي",
    style: null,
  },
  {
    id: 12,
    name: "Al-Husary (Muallim)",
    nameArabic: "محمود خليل الحصري — معلّم",
    style: "Muallim",
  },
  {
    id: 6,
    name: "Al-Husary",
    nameArabic: "محمود خليل الحصري",
    style: null,
  },
];

/** Fetch all 114 surah metadata */
export async function fetchChapters(): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/chapters`);
  if (!res.ok) throw new Error(`Failed to fetch chapters: ${res.status}`);
  const data = await res.json();
  return data.chapters;
}

/**
 * Fetch verses with word-by-word data for a chapter.
 * Handles pagination (API max 50 per page).
 */
export async function fetchVerses(chapterNumber: number): Promise<VersesResponse["verses"]> {
  const allVerses: VersesResponse["verses"] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${API_BASE}/verses/by_chapter/${chapterNumber}?language=en&words=true&word_fields=text_uthmani,code_v2&per_page=50&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch verses: ${res.status}`);
    const data: VersesResponse = await res.json();

    allVerses.push(...data.verses);
    totalPages = data.pagination.total_pages;
    page++;
  }

  return allVerses;
}

/**
 * Fetch chapter audio with word-level timing segments.
 */
export async function fetchChapterAudio(
  reciterId: number,
  chapterNumber: number
): Promise<ChapterRecitationResponse> {
  const url = `${API_BASE}/chapter_recitations/${reciterId}/${chapterNumber}?segments=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
  return res.json();
}

/**
 * Get the full URL for a word-by-word audio clip.
 * Format: wbw/{chapter:03d}_{verse:03d}_{word:03d}.mp3
 */
export function getWordAudioUrl(chapter: number, verse: number, wordPosition: number): string {
  const ch = String(chapter).padStart(3, "0");
  const v = String(verse).padStart(3, "0");
  const w = String(wordPosition).padStart(3, "0");
  return `${AUDIO_CDN}/wbw/${ch}_${v}_${w}.mp3`;
}
