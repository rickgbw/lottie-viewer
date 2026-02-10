"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { InfoIcon, LayersIcon, PaletteIcon, SpeedIcon, ChevronDownIcon, DownloadIcon, EyeIcon, EyeOffIcon, ResetIcon } from "./Icons";
import { extractColors, applyModifications } from "@/lib/lottieUtils";
import type { LottieFile } from "@/hooks/useLottieStore";

interface InspectorProps {
  file: LottieFile | null;
  colorOverrides: Record<string, string>;
  hiddenLayers: number[];
  speed: number;
  onColorChange: (originalHex: string, newHex: string) => void;
  onToggleLayer: (layerIndex: number) => void;
  onSpeedChange: (speed: number) => void;
  onRenameLayer: (layerIndex: number, newName: string) => void;
  onResetAll: () => void;
  hasAnyModification: boolean;
  hideHeader?: boolean;
}


function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 transition-colors duration-75"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-surface-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span
          className="transition-transform duration-150"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <ChevronDownIcon />
        </span>
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em]">
          {title}
        </span>
        <span className="ml-auto">{badge}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PropertyRow({ label, value, mono = false }: { label: string; value: string | React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span
        className={`text-[11px] font-medium ${mono ? "font-mono tabular-nums" : ""}`}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function EditableLayerName({
  name,
  isHidden,
  onRename,
}: {
  name: string;
  isHidden: boolean;
  onRename: (newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    } else {
      setDraft(name);
    }
  }, [draft, name, onRename]);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(name);
            setEditing(false);
          }
        }}
        className="text-[10px] font-medium flex-1 min-w-0 bg-transparent outline-none border-b px-0 py-0 rounded-none"
        style={{
          color: isHidden ? "var(--text-tertiary)" : "var(--text-secondary)",
          borderColor: "var(--bg-accent)",
        }}
      />
    );
  }

  return (
    <span
      className="text-[10px] font-medium truncate flex-1 min-w-0 cursor-text"
      style={{
        color: isHidden ? "var(--text-tertiary)" : "var(--text-secondary)",
        textDecoration: isHidden ? "line-through" : "none",
      }}
      onDoubleClick={() => {
        setDraft(name);
        setEditing(true);
      }}
    >
      {name}
    </span>
  );
}

function ColorSwatch({
  originalColor,
  currentColor,
  onChange,
}: {
  originalColor: string;
  currentColor: string;
  onChange: (newColor: string) => void;
}) {
  const isModified = currentColor !== originalColor;

  return (
    <div className="relative group" title={`${originalColor}${isModified ? ` → ${currentColor}` : ""}`}>
      <div
        className="w-7 h-7 rounded-md border cursor-pointer overflow-hidden"
        style={{
          background: currentColor,
          borderColor: isModified ? "var(--bg-accent)" : "var(--border-default)",
          boxShadow: isModified ? "0 0 0 1px var(--bg-accent)" : "none",
        }}
      />
      <input
        type="color"
        value={currentColor}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {isModified && (
        <div
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
          style={{ background: "var(--bg-accent)" }}
        />
      )}
    </div>
  );
}

export default function Inspector({
  file,
  colorOverrides,
  hiddenLayers,
  speed,
  onColorChange,
  onToggleLayer,
  onSpeedChange,
  onRenameLayer,
  onResetAll,
  hasAnyModification,
  hideHeader,
}: InspectorProps) {
  const colors = useMemo(() => {
    if (!file) return [];
    return extractColors(file.data);
  }, [file]);


  const handleDownload = useCallback(() => {
    if (!file) return;
    const modified = applyModifications(file.data, colorOverrides, hiddenLayers, speed);
    const blob = new Blob([JSON.stringify(modified, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(/\.json$/, "") + (hasAnyModification ? "-modified" : "") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }, [file, colorOverrides, hiddenLayers, speed, hasAnyModification]);

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        borderColor: "var(--border-default)",
        background: "var(--bg-surface)",
      }}
    >
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 h-11 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <span className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: "var(--text-primary)" }}>
            Properties
          </span>
          {file && hasAnyModification && (
            <button
              onClick={onResetAll}
              className="flex items-center gap-1 text-[10px] font-medium rounded-md px-1.5 py-1 transition-colors duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-danger)";
                e.currentTarget.style.background = "var(--bg-canvas)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-tertiary)";
                e.currentTarget.style.background = "transparent";
              }}
              title="Reset all modifications"
            >
              <ResetIcon size={10} />
              Reset
            </button>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key={file.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Info section */}
              <CollapsibleSection
                title="Info"
                icon={<InfoIcon size={13} />}
              >
                <PropertyRow label="Version" value={file.meta.version} mono />
                <PropertyRow label="Dimensions" value={`${file.meta.width} × ${file.meta.height}`} mono />
                <PropertyRow label="Frame Rate" value={`${Math.round(file.meta.frameRate)} fps`} mono />
                <PropertyRow label="Frames" value={`${Math.round(file.meta.totalFrames)}`} mono />
                <PropertyRow label="Duration" value={`${file.meta.duration.toFixed(2)}s`} mono />
                <PropertyRow label="File Size" value={formatSize(file.size)} mono />
              </CollapsibleSection>

              {/* Speed section */}
              <CollapsibleSection
                title="Speed"
                icon={<SpeedIcon size={13} />}
              >
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0.1}
                      max={3}
                      step={0.1}
                      value={speed}
                      onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                      className="speed-slider flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: "var(--bg-accent)" }}
                    />
                    <span
                      className="text-[11px] font-mono font-medium tabular-nums w-[34px] text-right shrink-0"
                      style={{ color: speed !== 1 ? "var(--bg-accent)" : "var(--text-secondary)" }}
                    >
                      {speed.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex justify-between mt-1.5 px-0.5">
                    {[0.5, 1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => onSpeedChange(s)}
                        className="text-[9px] font-mono font-medium transition-colors duration-100"
                        style={{
                          color: s === speed ? "var(--bg-accent)" : "var(--text-tertiary)",
                        }}
                        onMouseEnter={(e) => {
                          if (s !== speed) e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                        onMouseLeave={(e) => {
                          if (s !== speed) e.currentTarget.style.color = s === speed ? "var(--bg-accent)" : "var(--text-tertiary)";
                        }}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>

              {/* Colors section */}
              <CollapsibleSection
                title="Colors"
                icon={<PaletteIcon size={13} />}
                badge={undefined}
              >
                {colors.length === 0 ? (
                  <p className="text-[10px] py-2" style={{ color: "var(--text-tertiary)" }}>
                    No static colors found
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {colors.map((color) => (
                        <ColorSwatch
                          key={color}
                          originalColor={color}
                          currentColor={colorOverrides[color] || color}
                          onChange={(newColor) => onColorChange(color, newColor)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </CollapsibleSection>

              {/* Layers section */}
              <CollapsibleSection
                title="Layers"
                icon={<LayersIcon size={13} />}
                badge={undefined}
              >
                <div className="space-y-0.5 mt-1">
                  {((file.data.layers as Array<{ nm?: string; ty?: number }>) || []).map((layer, i) => {
                    const isHidden = hiddenLayers.includes(i);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md group"
                        style={{
                          background: "var(--bg-canvas)",
                          opacity: isHidden ? 0.45 : 1,
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background:
                              layer.ty === 0
                                ? "#a78bfa"
                                : layer.ty === 1
                                ? "#fb923c"
                                : layer.ty === 2
                                ? "#34d399"
                                : layer.ty === 3
                                ? "#f472b6"
                                : layer.ty === 4
                                ? "#60a5fa"
                                : "#94a3b8",
                          }}
                        />
                        <EditableLayerName
                          name={layer.nm || `Layer ${i + 1}`}
                          isHidden={isHidden}
                          onRename={(newName) => onRenameLayer(i, newName)}
                        />
                        <span className="text-[9px] shrink-0 font-mono" style={{ color: "var(--text-tertiary)" }}>
                          {layer.ty === 0
                            ? "Pre"
                            : layer.ty === 1
                            ? "Solid"
                            : layer.ty === 2
                            ? "Image"
                            : layer.ty === 3
                            ? "Null"
                            : layer.ty === 4
                            ? "Shape"
                            : `T${layer.ty}`}
                        </span>
                        <button
                          onClick={() => onToggleLayer(i)}
                          className="flex items-center justify-center h-5 w-5 shrink-0 rounded transition-all duration-100"
                          style={{
                            color: isHidden ? "var(--text-tertiary)" : "var(--text-secondary)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = isHidden ? "var(--bg-accent)" : "var(--text-danger)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = isHidden ? "var(--text-tertiary)" : "var(--text-secondary)";
                          }}
                        >
                          {isHidden ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full px-6"
            >
              <p className="text-[11px] text-center" style={{ color: "var(--text-tertiary)" }}>
                Select an animation to view properties
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed download button */}
      {file && (
        <div className="shrink-0 px-3 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
            style={{
              background: "var(--bg-accent)",
              color: "var(--text-inverse)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <DownloadIcon size={14} />
            Download{hasAnyModification ? " Modified" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
