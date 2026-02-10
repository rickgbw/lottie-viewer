"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { FileIcon, TrashIcon, UploadIcon, LottieIcon } from "./Icons";
import type { LottieFile } from "@/hooks/useLottieStore";

interface SidebarProps {
  files: LottieFile[];
  selectedId: string | null;
  bgColor: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveAll: () => void;
  onAddFiles: (files: { name: string; data: Record<string, unknown>; size: number }[]) => void;
  onBgColorChange: (color: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  return `${seconds.toFixed(1)}s`;
}

function BgColorRow({ bgColor, onBgColorChange }: { bgColor: string; onBgColorChange: (color: string) => void }) {
  const [hexInput, setHexInput] = useState(bgColor === "transparent" ? "" : bgColor);
  const isTransparent = bgColor === "transparent";

  const handleHexChange = (value: string) => {
    // Allow typing with or without #
    let v = value.trim();
    if (v && !v.startsWith("#")) v = "#" + v;
    setHexInput(v);
    // Apply when it looks like a valid hex color
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) {
      onBgColorChange(v);
    }
  };

  const handleClear = () => {
    onBgColorChange("transparent");
    setHexInput("");
  };

  // Sync input when bgColor changes externally (e.g. from native picker)
  const displayHex = bgColor === "transparent" ? "" : bgColor;
  if (displayHex && displayHex !== hexInput && document.activeElement?.tagName !== "INPUT") {
    // We'll just let the controlled input show the prop value when not focused
  }

  return (
    <div className="px-4 py-2.5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--text-tertiary)" }}>
          Background
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Color swatch with native picker */}
        <div className="relative shrink-0">
          <div
            className="w-7 h-7 rounded-md border overflow-hidden cursor-pointer"
            style={{
              borderColor: "var(--border-default)",
              background: isTransparent ? undefined : bgColor,
            }}
          >
            {isTransparent && <div className="checkerboard w-full h-full" />}
          </div>
          <input
            type="color"
            value={isTransparent ? "#ffffff" : bgColor}
            onChange={(e) => {
              onBgColorChange(e.target.value);
              setHexInput(e.target.value);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Hex input */}
        <input
          type="text"
          value={isTransparent ? "" : (hexInput || displayHex)}
          onChange={(e) => handleHexChange(e.target.value)}
          onFocus={() => {
            if (!isTransparent) setHexInput(bgColor);
          }}
          placeholder="transparent"
          className="flex-1 min-w-0 h-7 px-2 rounded-md text-[11px] font-mono outline-none transition-all duration-100"
          style={{
            background: "var(--bg-canvas)",
            border: "1px solid var(--border-default)",
            color: isTransparent ? "var(--text-tertiary)" : "var(--text-primary)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />

        {/* Clear button */}
        {!isTransparent && (
          <button
            onClick={handleClear}
            className="flex items-center justify-center h-7 w-7 shrink-0 rounded-md transition-all duration-100"
            style={{
              color: "var(--text-tertiary)",
              background: "var(--bg-canvas)",
              border: "1px solid var(--border-default)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.borderColor = "var(--border-strong)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
          >
            <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="8" y2="8" />
              <line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ files, selectedId, bgColor, onSelect, onRemove, onRemoveAll, onAddFiles, onBgColorChange }: SidebarProps) {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId]!.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json", ".lottie"] },
    noClick: files.length > 0,
  });

  return (
    <div className="flex h-full w-full flex-col" style={{ background: "var(--bg-surface)" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 h-11 shrink-0 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <LottieIcon size={22} />
        <span className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: "var(--text-primary)" }}>
          Lottie Viewer
        </span>
      </div>

      {/* File list section label */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--text-tertiary)" }}>
          Animations
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{ color: "var(--text-tertiary)" }}
          >
            {files.length}
          </span>
          {files.length > 0 && (
            <button
              onClick={onRemoveAll}
              className="flex items-center justify-center h-5 w-5 rounded transition-all duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-danger)";
                e.currentTarget.style.background = "#fef2f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-tertiary)";
                e.currentTarget.style.background = "transparent";
              }}
              title="Remove all animations"
            >
              <TrashIcon size={11} />
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-2">
        <input {...getInputProps()} />
        <AnimatePresence mode="popLayout">
          {files.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full px-4"
            >
              <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                No animations yet
              </p>
            </motion.div>
          ) : (
            files.map((file, index) => (
              <motion.div
                key={file.id}
                ref={(el) => { itemRefs.current[file.id] = el; }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelect(file.id)}
                className="group flex items-start gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer mb-0.5 transition-colors duration-100"
                style={{
                  background: file.id === selectedId ? "var(--bg-selection)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (file.id !== selectedId) {
                    e.currentTarget.style.background = "var(--bg-surface-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = file.id === selectedId ? "var(--bg-selection)" : "transparent";
                }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md mt-0.5"
                  style={{
                    background: file.id === selectedId ? "var(--bg-accent)" : "var(--bg-canvas)",
                    color: file.id === selectedId ? "var(--text-inverse)" : "var(--text-secondary)",
                  }}
                >
                  <FileIcon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[12px] font-medium truncate leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {file.name.replace(/\.json$/, "")}
                  </p>
                  <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--text-tertiary)" }}>
                    {formatSize(file.size)} &middot; {formatDuration(file.meta.duration)} &middot; {Math.round(file.meta.totalFrames)}f
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 flex items-center justify-center h-6 w-6 rounded-md transition-all duration-100 mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-danger)";
                    e.currentTarget.style.background = "#fef2f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <TrashIcon size={13} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Import button */}
      {files.length > 0 && (
        <div className="px-3 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <button
              className="flex w-full items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
              style={{
                background: isDragActive ? "var(--bg-accent-subtle)" : "var(--bg-canvas)",
                color: isDragActive ? "var(--bg-accent)" : "var(--text-secondary)",
                border: isDragActive ? "1.5px dashed var(--bg-accent)" : "1.5px dashed var(--border-strong)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-accent-subtle)";
                e.currentTarget.style.color = "var(--bg-accent)";
                e.currentTarget.style.borderColor = "var(--bg-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDragActive ? "var(--bg-accent-subtle)" : "var(--bg-canvas)";
                e.currentTarget.style.color = isDragActive ? "var(--bg-accent)" : "var(--text-secondary)";
                e.currentTarget.style.borderColor = isDragActive ? "var(--bg-accent)" : "var(--border-strong)";
              }}
            >
              <UploadIcon size={14} />
              Import Animation
            </button>
          </div>
        </div>
      )}

      {/* Background color */}
      <BgColorRow bgColor={bgColor} onBgColorChange={onBgColorChange} />
    </div>
  );
}
