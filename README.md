# Quran Word Trainer

**[Try it live](https://zeeyado.github.io/quran-word-trainer/)**

A web app that helps users connect Arabic letter shapes to sounds by flashing individual Quranic words synchronized with reciter audio.

Instead of highlighting words in a sentence, it shows only the current word — large and centered — while the reciter's audio for that word plays. Like speed-reading, but for learning to read Arabic through the Quran.

## Features

- **RSVP word display** — one word at a time, large Arabic text, centered
- **Tajweed rendering** — QCF V4 COLRv1 color fonts with per-page dynamic loading
- **Tajweed toggle** — switch off tajweed colors while keeping QCF glyph quality (V2 fonts)
- **Light/dark theme** — auto (follows system), light, or dark; persisted in localStorage, no FOUC
- **Audio-synced** — words flash in time with reciter audio (word-level timing)
- **Surah & ayah selectors** — pick any surah, jump to any verse
- **Multiple reciters** — Mishari Al-Afasy (default), Al-Husary (Muallim), Al-Husary
- **Speed control** — 0.5x to 1.5x playback
- **Stop after surah** — pauses at end of surah (on by default); uncheck to let audio continue
- **Immersive mode** — hides all UI except the current word during playback, enlarged text
- **Auto-resume** — remembers your chapter, reciter, and word position across sessions
- **Copyable text** — selecting/copying the displayed word gives proper Arabic (not PUA glyphs)
- **Mobile-responsive** — touch-friendly layout for phones and tablets
- **Transliteration & translation** — optional overlays toggled via checkboxes

## Running

```bash
npm install
npm run dev
```

## Data Source

All Quranic data is fetched client-side from the [Quran.com API v4](https://api.quran.com/api/v4). Audio files are served from QuranicAudio CDN. Tajweed fonts from [Quran Foundation CDN](https://verses.quran.foundation). No backend required.

## License

GPL-3.0 — see [LICENSE](LICENSE).
