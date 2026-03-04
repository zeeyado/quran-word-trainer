import type { ReciterConfig } from "../api/types";

interface Props {
  reciters: ReciterConfig[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export function ReciterSelector({ reciters, selectedId, onSelect }: Props) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(Number(e.target.value))}
      className="reciter-selector"
    >
      {reciters.map((r) => (
        <option key={r.id} value={r.id}>
          {r.nameArabic}{r.style ? ` (${r.style})` : ""}
        </option>
      ))}
    </select>
  );
}
