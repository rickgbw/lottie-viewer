"use client";

import { useState, useCallback } from "react";

export interface LottieFile {
  id: string;
  name: string;
  data: Record<string, unknown>;
  size: number;
  addedAt: number;
  /** Extracted metadata */
  meta: {
    version: string;
    frameRate: number;
    totalFrames: number;
    width: number;
    height: number;
    duration: number;
    layerCount: number;
    hasExpressions: boolean;
  };
}

export type GridSize = "small" | "medium" | "large" | "xlarge";

export interface ViewerState {
  files: LottieFile[];
  selectedId: string | null;
  isPlaying: boolean;
  speed: number;
  loop: boolean;
  direction: 1 | -1;
  showGrid: boolean;
  zoom: number;
  bgColor: string;
  gridSize: GridSize;
  /** Per-card playing state — used when global is off */
  cardPlayingMap: Record<string, boolean>;
  /** Per-file color overrides: fileId → { originalHex → newHex } */
  colorOverrides: Record<string, Record<string, string>>;
  /** Per-file hidden layer indices: fileId → number[] */
  hiddenLayers: Record<string, number[]>;
}

function extractMeta(data: Record<string, unknown>): LottieFile["meta"] {
  const fr = (data.fr as number) || 30;
  const ip = (data.ip as number) || 0;
  const op = (data.op as number) || 0;
  const w = (data.w as number) || 0;
  const h = (data.h as number) || 0;
  const layers = (data.layers as unknown[]) || [];
  const totalFrames = op - ip;

  return {
    version: (data.v as string) || "unknown",
    frameRate: fr,
    totalFrames,
    width: w,
    height: h,
    duration: totalFrames / fr,
    layerCount: layers.length,
    hasExpressions: JSON.stringify(data).includes('"x"'),
  };
}

export function useLottieStore() {
  const [state, setState] = useState<ViewerState>({
    files: [],
    selectedId: null,
    isPlaying: false,
    speed: 1,
    loop: true,
    direction: 1,
    showGrid: true,
    zoom: 1,
    bgColor: "transparent",
    gridSize: "medium" as GridSize,
    cardPlayingMap: {},
    colorOverrides: {},
    hiddenLayers: {},
  });

  const addFiles = useCallback((newFiles: { name: string; data: Record<string, unknown>; size: number }[]) => {
    setState((prev) => {
      const lottieFiles: LottieFile[] = newFiles.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        data: f.data,
        size: f.size,
        addedAt: Date.now(),
        meta: extractMeta(f.data),
      }));
      const updated = [...prev.files, ...lottieFiles];
      return {
        ...prev,
        files: updated,
        selectedId: prev.selectedId || lottieFiles[0]?.id || null,
      };
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setState((prev) => {
      const updated = prev.files.filter((f) => f.id !== id);
      return {
        ...prev,
        files: updated,
        selectedId: prev.selectedId === id ? (updated[0]?.id || null) : prev.selectedId,
      };
    });
  }, []);

  const selectFile = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedId: id }));
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    setState((prev) => ({
      ...prev,
      isPlaying: playing,
      cardPlayingMap: playing ? {} : prev.cardPlayingMap,
    }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, speed }));
  }, []);

  const setLoop = useCallback((loop: boolean) => {
    setState((prev) => ({ ...prev, loop }));
  }, []);

  const toggleDirection = useCallback(() => {
    setState((prev) => ({ ...prev, direction: prev.direction === 1 ? -1 : 1 }));
  }, []);

  const setShowGrid = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showGrid: show }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom: Math.max(0.25, Math.min(4, zoom)) }));
  }, []);

  const setBgColor = useCallback((bgColor: string) => {
    setState((prev) => ({ ...prev, bgColor }));
  }, []);

  const setGridSize = useCallback((gridSize: GridSize) => {
    setState((prev) => ({ ...prev, gridSize }));
  }, []);

  const toggleCardPlaying = useCallback((id: string) => {
    setState((prev) => {
      if (prev.isPlaying) {
        // Global is on → turn it off, set all cards to playing EXCEPT this one
        const map: Record<string, boolean> = {};
        for (const f of prev.files) {
          map[f.id] = f.id !== id;
        }
        return { ...prev, isPlaying: false, cardPlayingMap: map };
      }
      // Global is off → just toggle this card
      return {
        ...prev,
        cardPlayingMap: {
          ...prev.cardPlayingMap,
          [id]: !prev.cardPlayingMap[id],
        },
      };
    });
  }, []);

  const setColorOverride = useCallback((fileId: string, originalHex: string, newHex: string) => {
    setState((prev) => {
      const fileOverrides = { ...(prev.colorOverrides[fileId] || {}) };
      if (newHex === originalHex) {
        delete fileOverrides[originalHex];
      } else {
        fileOverrides[originalHex] = newHex;
      }
      return {
        ...prev,
        colorOverrides: { ...prev.colorOverrides, [fileId]: fileOverrides },
      };
    });
  }, []);

  const resetColors = useCallback((fileId: string) => {
    setState((prev) => {
      const updated = { ...prev.colorOverrides };
      delete updated[fileId];
      return { ...prev, colorOverrides: updated };
    });
  }, []);

  const toggleLayerVisibility = useCallback((fileId: string, layerIndex: number) => {
    setState((prev) => {
      const current = prev.hiddenLayers[fileId] || [];
      const hidden = current.includes(layerIndex)
        ? current.filter((i) => i !== layerIndex)
        : [...current, layerIndex];
      return {
        ...prev,
        hiddenLayers: { ...prev.hiddenLayers, [fileId]: hidden },
      };
    });
  }, []);

  const removeAllFiles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      files: [],
      selectedId: null,
      isPlaying: false,
      cardPlayingMap: {},
      colorOverrides: {},
      hiddenLayers: {},
    }));
  }, []);

  const selectedFile = state.files.find((f) => f.id === state.selectedId) || null;

  return {
    state,
    selectedFile,
    addFiles,
    removeFile,
    removeAllFiles,
    selectFile,
    setPlaying,
    setSpeed,
    setLoop,
    toggleDirection,
    setShowGrid,
    setZoom,
    setBgColor,
    setGridSize,
    toggleCardPlaying,
    setColorOverride,
    resetColors,
    toggleLayerVisibility,
  };
}
