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
  onEnterImmersive: () => void;
}

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
  onEnterImmersive,
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
        <input
          type="range"
          min={0.25}
          max={2}
          step={0.25}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
        <span className="player-controls__speed-label">{speed}x</span>
      </div>

      <div className="player-controls__bottom">
        <span className="player-controls__progress">
          {totalWords > 0 ? `${currentIndex + 1} / ${totalWords}` : "\u2014"}
        </span>
        <button onClick={onEnterImmersive} className="player-controls__immersive" title="Focus mode">
          &#x26F6;
        </button>
      </div>
    </div>
  );
}
