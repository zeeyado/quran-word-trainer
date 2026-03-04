interface Props {
  versesCount: number;
  currentAyah: number;
  onSelect: (ayah: number) => void;
}

export function AyahSelector({ versesCount, currentAyah, onSelect }: Props) {
  return (
    <select
      value={currentAyah}
      onChange={(e) => onSelect(Number(e.target.value))}
      className="ayah-selector"
    >
      {Array.from({ length: versesCount }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          Ayah {n}
        </option>
      ))}
    </select>
  );
}
