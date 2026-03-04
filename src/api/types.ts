// Quran.com API v4 response types

/** Reciter metadata from /resources/recitations */
export interface Reciter {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name: {
    name: string;
    language_name: string;
  };
}

/** Word-level timing segment: [word_position, start_ms, end_ms] */
export type AudioSegment = [number, number, number];

/** Per-verse timestamp with word segments */
export interface VerseTimestamp {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  duration: number;
  segments: AudioSegment[];
}

/** Chapter recitation audio file with timing data */
export interface ChapterAudioFile {
  id: number;
  chapter_id: number;
  file_size: number;
  format: string;
  audio_url: string;
  timestamps: VerseTimestamp[];
}

/** Response from /chapter_recitations/{id}/{chapter}?segments=true */
export interface ChapterRecitationResponse {
  audio_file: ChapterAudioFile;
}

/** Word translation */
export interface WordTranslation {
  text: string;
  language_name: string;
}

/** Word transliteration */
export interface WordTransliteration {
  text: string;
  language_name: string;
}

/** Individual word from /verses/by_chapter with words=true */
export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: "word" | "end";
  text_uthmani: string;
  text: string;
  code_v2: string;
  page_number: number;
  line_number: number;
  translation: WordTranslation;
  transliteration: WordTransliteration;
}

/** Verse from /verses/by_chapter */
export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  words: Word[];
}

/** Response from /verses/by_chapter */
export interface VersesResponse {
  verses: Verse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

/** Surah metadata from /chapters */
export interface Chapter {
  id: number;
  revelation_place: "makkah" | "madinah";
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
}

/** App-level reciter config (subset we expose in the UI) */
export interface ReciterConfig {
  id: number;
  name: string;
  nameArabic: string;
  style: string | null;
}
