"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { motion, AnimatePresence } from "motion/react";
import { PlayIcon, PauseIcon, TrashIcon, DownloadIcon, InfoIcon } from "./Icons";
import { applyModifications } from "@/lib/lottieUtils";
import type { LottieFile } from "@/hooks/useLottieStore";

interface LottieCardProps {
  file: LottieFile;
  isSelected: boolean;
  isCardPlaying: boolean;
  speed: number;
  loop: boolean;
  direction: 1 | -1;
  bgColor: string;
  index: number;
  colorOverrides: Record<string, string>;
  hiddenLayers: number[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onTogglePlay: (id: string) => void;
  onOpenInspector?: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  return `${seconds.toFixed(1)}s`;
}

export default function LottieCard({
  file,
  isSelected,
  isCardPlaying,
  speed,
  loop,
  direction,
  bgColor,
  index,
  colorOverrides,
  hiddenLayers,
  onSelect,
  onRemove,
  onTogglePlay,
  onOpenInspector,
}: LottieCardProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [finished, setFinished] = useState(false);

  const isPlaying = isCardPlaying;

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  const hasModifications = Object.keys(colorOverrides).length > 0 || hiddenLayers.length > 0;
  const modifiedData = useMemo(() => {
    if (!hasModifications) return file.data;
    return applyModifications(file.data, colorOverrides, hiddenLayers);
  }, [file.data, colorOverrides, hiddenLayers, hasModifications]);

  useEffect(() => {
    if (!lottieRef.current) return;
    if (isPlaying) {
      lottieRef.current.play();
    } else {
      lottieRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (lottieRef.current) lottieRef.current.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    if (lottieRef.current) lottieRef.current.setDirection(direction);
  }, [direction]);

  useEffect(() => {
    if (!lottieRef.current) return;
    const interval = setInterval(() => {
      if (lottieRef.current) {
        setCurrentFrame(lottieRef.current.animationItem?.currentFrame || 0);
      }
    }, 1000 / 20);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = useCallback(() => {
    const data = hasModifications
      ? applyModifications(file.data, colorOverrides, hiddenLayers)
      : file.data;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [file, colorOverrides, hiddenLayers, hasModifications]);

  const handleTogglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePlay(file.id);
  }, [onTogglePlay, file.id]);

  const progress = file.meta.totalFrames > 0 ? currentFrame / file.meta.totalFrames : 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => onSelect(file.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-shadow duration-150"
      style={{
        background: "var(--bg-surface)",
        boxShadow: isSelected
          ? "0 0 0 2px var(--bg-accent), var(--shadow-md)"
          : "var(--shadow-sm)",
        border: isSelected ? "none" : "1px solid var(--border-subtle)",
      }}
    >
      {/* Animation viewport */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{
          background: bgColor === "transparent" ? "white" : bgColor,
        }}
      >
        {bgColor === "transparent" && <div className="checkerboard absolute inset-0" />}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <Lottie
            lottieRef={lottieRef}
            animationData={modifiedData}
            loop={loop}
            autoplay={true}
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

        {/* Top-right actions — visible on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute top-2 right-2 z-20 flex gap-1"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="flex items-center justify-center h-6 w-6 rounded-md transition-all duration-100"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "var(--text-secondary)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  backdropFilter: "blur(6px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <DownloadIcon size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.id);
                }}
                className="flex items-center justify-center h-6 w-6 rounded-md transition-all duration-100"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "var(--text-secondary)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  backdropFilter: "blur(6px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-danger)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <TrashIcon size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar at bottom of viewport */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] z-10" style={{ background: "var(--border-subtle)" }}>
          <div
            className="h-full transition-[width] duration-75"
            style={{
              width: `${progress * 100}%`,
              background: isSelected ? "var(--bg-accent)" : isPlaying ? "var(--text-tertiary)" : "var(--border-strong)",
            }}
          />
        </div>
      </div>

      {/* Card footer */}
      <div className="flex items-center gap-2 px-2.5 py-2"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        {/* Play/Pause button */}
        <button
          onClick={handleTogglePlay}
          className="flex items-center justify-center h-6 w-6 shrink-0 rounded-md transition-all duration-100"
          style={{
            background: isPlaying ? "var(--bg-accent)" : "var(--bg-canvas)",
            color: isPlaying ? "var(--text-inverse)" : "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.background = "var(--bg-accent-subtle)";
              e.currentTarget.style.color = "var(--bg-accent)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.background = "var(--bg-canvas)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }
          }}
        >
          {isPlaying ? <PauseIcon size={10} /> : <PlayIcon size={10} />}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-medium truncate leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {file.name.replace(/\.json$/, "")}
          </p>
          <p
            className="text-[10px] mt-0.5 font-mono tabular-nums"
            style={{ color: "var(--text-tertiary)" }}
          >
            {file.meta.width}&times;{file.meta.height} &middot; {formatDuration(file.meta.duration)} &middot; {Math.round(file.meta.totalFrames)}f
          </p>
        </div>

        {/* Mobile info button */}
        {onOpenInspector && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(file.id);
              onOpenInspector();
            }}
            className="flex md:hidden items-center justify-center h-6 w-6 shrink-0 rounded-md transition-all duration-100"
            style={{
              background: "var(--bg-canvas)",
              color: "var(--text-tertiary)",
            }}
          >
            <InfoIcon size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
