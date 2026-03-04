interface Props {
  isPlaying: boolean;
  speed: number;
  currentIndex: number;
  totalWords: number;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5];

export function PlayerControls({
  isPlaying,
  speed,
  currentIndex,
  totalWords,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onSpeedChange,
}: Props) {
  return (
    <div className="player-controls">
      <div className="player-controls__transport">
        <button onClick={onPrev} disabled={currentIndex <= 0} title="Previous word">
          &#x23EE;
        </button>

        <button onClick={isPlaying ? onPause : onPlay} className="player-controls__play">
          {isPlaying ? "\u23F8" : "\u25B6"}
        </button>

        <button onClick={onNext} disabled={currentIndex >= totalWords - 1} title="Next word">
          &#x23ED;
        </button>
      </div>

      <div className="player-controls__speed">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={speed === s ? "active" : ""}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="player-controls__progress">
        {totalWords > 0 ? `${currentIndex + 1} / ${totalWords}` : "—"}
      </div>
    </div>
  );
}
