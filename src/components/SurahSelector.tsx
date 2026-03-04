import type { Chapter } from "../api/types";

interface Props {
  chapters: Chapter[];
  selectedChapter: number | null;
  onSelect: (chapterNumber: number) => void;
}

export function SurahSelector({ chapters, selectedChapter, onSelect }: Props) {
  return (
    <select
      value={selectedChapter ?? ""}
      onChange={(e) => onSelect(Number(e.target.value))}
      className="surah-selector"
    >
      <option value="" disabled>
        Select Surah
      </option>
      {chapters.map((ch) => (
        <option key={ch.id} value={ch.id}>
          {ch.id}. {ch.name_simple} — {ch.name_arabic} ({ch.verses_count} ayat)
        </option>
      ))}
    </select>
  );
}
