import type { ThemePreference } from "../hooks/useTheme";

interface Props {
  showTransliteration: boolean;
  showTranslation: boolean;
  immersiveEnabled: boolean;
  tajweedEnabled: boolean;
  themePreference: ThemePreference;
  onToggleTransliteration: () => void;
  onToggleTranslation: () => void;
  onToggleImmersive: () => void;
  onToggleTajweed: () => void;
  onThemeChange: (theme: ThemePreference) => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function SettingsPanel({
  showTransliteration,
  showTranslation,
  immersiveEnabled,
  tajweedEnabled,
  themePreference,
  onToggleTransliteration,
  onToggleTranslation,
  onToggleImmersive,
  onToggleTajweed,
  onThemeChange,
}: Props) {
  return (
    <div className="settings-panel">
      <label>
        <input
          type="checkbox"
          checked={showTransliteration}
          onChange={onToggleTransliteration}
        />
        Transliteration
      </label>

      <label>
        <input
          type="checkbox"
          checked={showTranslation}
          onChange={onToggleTranslation}
        />
        Translation
      </label>

      <label>
        <input
          type="checkbox"
          checked={tajweedEnabled}
          onChange={onToggleTajweed}
        />
        Tajweed
      </label>

      <label>
        <input
          type="checkbox"
          checked={immersiveEnabled}
          onChange={onToggleImmersive}
        />
        Immersive
      </label>

      <div className="settings-panel__theme">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onThemeChange(opt.value)}
            className={`settings-panel__theme-btn${themePreference === opt.value ? " active" : ""}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
