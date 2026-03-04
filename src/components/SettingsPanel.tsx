interface Props {
  showTransliteration: boolean;
  showTranslation: boolean;
  immersiveEnabled: boolean;
  onToggleTransliteration: () => void;
  onToggleTranslation: () => void;
  onToggleImmersive: () => void;
}

export function SettingsPanel({
  showTransliteration,
  showTranslation,
  immersiveEnabled,
  onToggleTransliteration,
  onToggleTranslation,
  onToggleImmersive,
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
          checked={immersiveEnabled}
          onChange={onToggleImmersive}
        />
        Immersive
      </label>
    </div>
  );
}
