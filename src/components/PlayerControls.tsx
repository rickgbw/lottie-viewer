"use client";

import { PlayIcon, PauseIcon, LoopIcon, ReverseIcon, SpeedIcon } from "./Icons";

interface PlayerControlsProps {
  isPlaying: boolean;
  speed: number;
  loop: boolean;
  direction: 1 | -1;
  currentFrame: number;
  totalFrames: number;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onLoopToggle: () => void;
  onDirectionToggle: () => void;
  onSeek: (frame: number) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3];

export default function PlayerControls({
  isPlaying,
  speed,
  loop,
  direction,
  currentFrame,
  totalFrames,
  onPlayPause,
  onSpeedChange,
  onLoopToggle,
  onDirectionToggle,
  onSeek,
}: PlayerControlsProps) {
  return (
    <div
      className="flex items-center gap-1 px-4 py-2.5 border-t"
      style={{
        borderColor: "var(--border-default)",
        background: "var(--bg-surface)",
      }}
    >
      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        className="flex items-center justify-center h-7 w-7 rounded-md transition-all duration-100"
        style={{
          background: isPlaying ? "var(--bg-accent)" : "transparent",
          color: isPlaying ? "var(--text-inverse)" : "var(--text-primary)",
        }}
        onMouseEnter={(e) => {
          if (!isPlaying) e.currentTarget.style.background = "var(--bg-canvas)";
        }}
        onMouseLeave={(e) => {
          if (!isPlaying) e.currentTarget.style.background = "transparent";
        }}
      >
        {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
      </button>

      {/* Timeline scrubber */}
      <div className="flex-1 flex items-center gap-3 mx-3">
        <span
          className="text-[10px] font-mono tabular-nums w-[32px] text-right"
          style={{ color: "var(--text-tertiary)" }}
        >
          {Math.round(currentFrame)}
        </span>
        <input
          type="range"
          min={0}
          max={totalFrames}
          value={currentFrame}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 cursor-pointer"
          step={1}
        />
        <span
          className="text-[10px] font-mono tabular-nums w-[32px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {totalFrames}
        </span>
      </div>

      {/* Reverse */}
      <button
        onClick={onDirectionToggle}
        className="flex items-center justify-center h-7 w-7 rounded-md transition-all duration-100"
        style={{
          color: direction === -1 ? "var(--bg-accent)" : "var(--text-tertiary)",
          background: direction === -1 ? "var(--bg-accent-subtle)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (direction !== -1) e.currentTarget.style.background = "var(--bg-canvas)";
        }}
        onMouseLeave={(e) => {
          if (direction !== -1) e.currentTarget.style.background = "transparent";
        }}
      >
        <ReverseIcon size={14} />
      </button>

      {/* Loop */}
      <button
        onClick={onLoopToggle}
        className="flex items-center justify-center h-7 w-7 rounded-md transition-all duration-100"
        style={{
          color: loop ? "var(--bg-accent)" : "var(--text-tertiary)",
          background: loop ? "var(--bg-accent-subtle)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!loop) e.currentTarget.style.background = "var(--bg-canvas)";
        }}
        onMouseLeave={(e) => {
          if (!loop) e.currentTarget.style.background = "transparent";
        }}
      >
        <LoopIcon size={14} />
      </button>

      {/* Speed selector */}
      <div className="relative group">
        <button
          className="flex items-center gap-1 h-7 px-2 rounded-md transition-all duration-100 text-[11px] font-medium font-mono tabular-nums"
          style={{
            color: speed !== 1 ? "var(--bg-accent)" : "var(--text-tertiary)",
            background: speed !== 1 ? "var(--bg-accent-subtle)" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (speed === 1) e.currentTarget.style.background = "var(--bg-canvas)";
          }}
          onMouseLeave={(e) => {
            if (speed === 1) e.currentTarget.style.background = "transparent";
          }}
        >
          <SpeedIcon size={13} />
          {speed}x
        </button>
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 min-w-[64px] z-50"
          style={{
            background: "var(--bg-panel)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-default)",
          }}
        >
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className="flex items-center justify-center w-full px-3 py-1 text-[11px] font-mono font-medium transition-colors duration-75"
              style={{
                color: s === speed ? "var(--bg-accent)" : "var(--text-secondary)",
                background: s === speed ? "var(--bg-accent-subtle)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (s !== speed) e.currentTarget.style.background = "var(--bg-surface-hover)";
              }}
              onMouseLeave={(e) => {
                if (s !== speed) e.currentTarget.style.background = "transparent";
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
