"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import LottieCard from "./LottieCard";
import { PlayIcon, PauseIcon, LoopIcon, ReverseIcon, UploadIcon, GridSmallIcon, GridMediumIcon, GridLargeIcon, GridXLargeIcon } from "./Icons";
import type { LottieFile, GridSize } from "@/hooks/useLottieStore";

interface CanvasProps {
  files: LottieFile[];
  selectedId: string | null;
  isPlaying: boolean;
  loop: boolean;
  direction: 1 | -1;
  showGrid: boolean;
  bgColor: string;
  gridSize: GridSize;
  cardPlayingMap: Record<string, boolean>;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onPlayPause: (playing: boolean) => void;
  onLoopToggle: (loop: boolean) => void;
  onDirectionToggle: () => void;
  onShowGridChange: (show: boolean) => void;
  onGridSizeChange: (size: GridSize) => void;
  onAddFiles: (files: { name: string; data: Record<string, unknown>; size: number }[]) => void;
  onToggleCardPlay: (id: string) => void;
  colorOverrides: Record<string, Record<string, string>>;
  hiddenLayers: Record<string, number[]>;
  speedOverrides: Record<string, number>;
}

const GRID_SIZE_CONFIG: Record<GridSize, { minWidth: string; label: string }> = {
  small: { minWidth: "160px", label: "Small" },
  medium: { minWidth: "240px", label: "Medium" },
  large: { minWidth: "360px", label: "Large" },
  xlarge: { minWidth: "480px", label: "X-Large" },
};

const GRID_SIZE_OPTIONS: { key: GridSize; icon: typeof GridSmallIcon }[] = [
  { key: "small", icon: GridSmallIcon },
  { key: "medium", icon: GridMediumIcon },
  { key: "large", icon: GridLargeIcon },
  { key: "xlarge", icon: GridXLargeIcon },
];

export default function Canvas({
  files,
  selectedId,
  isPlaying,
  loop,
  direction,
  showGrid,
  bgColor,
  gridSize,
  onSelect,
  onRemove,
  onPlayPause,
  onLoopToggle,
  onDirectionToggle,
  onShowGridChange,
  onGridSizeChange,
  onAddFiles,
  onToggleCardPlay,
  cardPlayingMap,
  colorOverrides,
  hiddenLayers,
  speedOverrides,
}: CanvasProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const readers = acceptedFiles.map(
        (file) =>
          new Promise<{ name: string; data: Record<string, unknown>; size: number }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const data = JSON.parse(reader.result as string);
                resolve({ name: file.name, data, size: file.size });
              } catch {
                reject(new Error(`Invalid JSON in ${file.name}`));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
          })
      );
      Promise.all(readers).then(onAddFiles).catch(console.error);
    },
    [onAddFiles]
  );

  const { getRootProps: getEmptyDropProps, getInputProps: getEmptyInputProps, isDragActive: emptyDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json", ".lottie"] },
  });

  const { minWidth } = GRID_SIZE_CONFIG[gridSize];

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {/* Toolbar strip */}
      <div
        className="flex items-center justify-between px-3 h-11 border-b shrink-0"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-surface)",
        }}
      >
        {/* Left: Playback controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPlayPause(!isPlaying)}
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

          <button
            onClick={() => onLoopToggle(!loop)}
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
        </div>

        {/* Center: Count */}
        <span
          className="text-[12px] font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          {files.length > 0 && `${files.length} animation${files.length !== 1 ? "s" : ""}`}
        </span>

        {/* Right: Grid size + dot grid toggle */}
        <div className="flex items-center gap-0.5">
          {/* Grid size selector — segmented control */}
          <div
            className="flex items-center rounded-md p-0.5"
            style={{ background: "var(--bg-canvas)" }}
          >
            {GRID_SIZE_OPTIONS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onGridSizeChange(key)}
                className="flex items-center justify-center h-6 w-6 rounded transition-all duration-100"
                style={{
                  background: gridSize === key ? "var(--bg-surface)" : "transparent",
                  color: gridSize === key ? "var(--bg-accent)" : "var(--text-tertiary)",
                  boxShadow: gridSize === key ? "var(--shadow-sm)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (gridSize !== key) e.currentTarget.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (gridSize !== key) e.currentTarget.style.color = "var(--text-tertiary)";
                }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>

          <div className="w-px h-4 mx-1" style={{ background: "var(--border-default)" }} />

          {/* Dot grid toggle */}
          <button
            onClick={() => onShowGridChange(!showGrid)}
            className="flex items-center justify-center h-7 w-7 rounded-md transition-all duration-100"
            style={{
              color: showGrid ? "var(--bg-accent)" : "var(--text-tertiary)",
              background: showGrid ? "var(--bg-accent-subtle)" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!showGrid) e.currentTarget.style.background = "var(--bg-canvas)";
            }}
            onMouseLeave={(e) => {
              if (!showGrid) e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width={14} height={14} viewBox="0 0 14 14" fill="currentColor">
              <circle cx="2" cy="2" r="1" />
              <circle cx="7" cy="2" r="1" />
              <circle cx="12" cy="2" r="1" />
              <circle cx="2" cy="7" r="1" />
              <circle cx="7" cy="7" r="1" />
              <circle cx="12" cy="7" r="1" />
              <circle cx="2" cy="12" r="1" />
              <circle cx="7" cy="12" r="1" />
              <circle cx="12" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid area */}
      <div
        className={`flex-1 overflow-y-auto ${showGrid ? "canvas-grid" : ""}`}
        style={{ background: "var(--bg-canvas)" }}
      >
        {files.length === 0 ? (
          /* Empty state — full drop zone */
          <div
            {...getEmptyDropProps()}
            className="flex flex-col items-center justify-center h-full cursor-pointer"
          >
            <input {...getEmptyInputProps()} />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center gap-5"
            >
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{
                  background: emptyDragActive ? "var(--bg-accent-subtle)" : "var(--bg-surface)",
                  border: emptyDragActive ? "2px dashed var(--bg-accent)" : "2px dashed var(--border-strong)",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.2s ease",
                }}
                animate={emptyDragActive ? { scale: 1.05 } : { scale: 1 }}
              >
                <UploadIcon size={28} />
              </motion.div>
              <div className="text-center">
                <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Drop Lottie files here
                </p>
                <p className="text-[12px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                  or click to browse &middot; .json files supported
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Grid of cards */
          <div className="p-5">
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}, 1fr))`,
              }}
            >
              <AnimatePresence mode="popLayout">
                {files.map((file, index) => (
                  <LottieCard
                    key={file.id}
                    file={file}
                    isSelected={file.id === selectedId}
                    isCardPlaying={isPlaying || !!cardPlayingMap[file.id]}
                    speed={speedOverrides[file.id] || 1}
                    loop={loop}
                    direction={direction}
                    bgColor={bgColor}
                    index={index}
                    colorOverrides={colorOverrides[file.id] || {}}
                    hiddenLayers={hiddenLayers[file.id] || []}
                    onSelect={onSelect}
                    onRemove={onRemove}
                    onTogglePlay={onToggleCardPlay}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
