"use client";

import { useState, useCallback } from "react";

export interface LottieFile {
  id: string;
  name: string;
  data: Record<string, unknown>;
  size: number;
  addedAt: number;
  fileType: "lottie" | "svg";
  svgContent?: string;
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
  /** Per-file speed overrides: fileId → speed multiplier */
  speedOverrides: Record<string, number>;
  /** Per-file original data snapshot for reset: fileId → original Lottie JSON */
  originalData: Record<string, Record<string, unknown>>;
}

function extractMeta(data: Record<string, unknown>, fileType: "lottie" | "svg" = "lottie"): LottieFile["meta"] {
  if (fileType === "svg") {
    const w = (data.w as number) || 0;
    const h = (data.h as number) || 0;
    return {
      version: "N/A",
      frameRate: 0,
      totalFrames: 0,
      width: w,
      height: h,
      duration: 0,
      layerCount: 0,
      hasExpressions: false,
    };
  }
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
    isPlaying: true,
    loop: true,
    direction: 1,
    showGrid: true,
    zoom: 1,
    bgColor: "transparent",
    gridSize: "medium" as GridSize,
    cardPlayingMap: {},
    colorOverrides: {},
    hiddenLayers: {},
    speedOverrides: {},
    originalData: {},
  });

  const addFiles = useCallback((newFiles: { name: string; data: Record<string, unknown>; size: number; fileType?: "lottie" | "svg"; svgContent?: string }[]) => {
    setState((prev) => {
      const lottieFiles: LottieFile[] = newFiles.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        data: f.data,
        size: f.size,
        addedAt: Date.now(),
        fileType: f.fileType || "lottie",
        svgContent: f.svgContent,
        meta: extractMeta(f.data, f.fileType || "lottie"),
      }));
      const updated = [...prev.files, ...lottieFiles];
      const origData = { ...prev.originalData };
      for (const lf of lottieFiles) {
        origData[lf.id] = lf.data;
      }
      return {
        ...prev,
        files: updated,
        selectedId: prev.selectedId || lottieFiles[0]?.id || null,
        originalData: origData,
      };
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setState((prev) => {
      const updated = prev.files.filter((f) => f.id !== id);
      const origData = { ...prev.originalData };
      delete origData[id];
      return {
        ...prev,
        files: updated,
        selectedId: prev.selectedId === id ? (updated[0]?.id || null) : prev.selectedId,
        originalData: origData,
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

  const setFileSpeed = useCallback((fileId: string, speed: number) => {
    setState((prev) => {
      const overrides = { ...prev.speedOverrides };
      if (speed === 1) {
        delete overrides[fileId];
      } else {
        overrides[fileId] = speed;
      }
      return { ...prev, speedOverrides: overrides };
    });
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

  const resetFileModifications = useCallback((fileId: string) => {
    setState((prev) => {
      const origData = prev.originalData[fileId];
      const files = origData
        ? prev.files.map((f) => (f.id === fileId ? { ...f, data: origData } : f))
        : prev.files;
      const colorOverrides = { ...prev.colorOverrides };
      delete colorOverrides[fileId];
      const hiddenLayers = { ...prev.hiddenLayers };
      delete hiddenLayers[fileId];
      const speedOverrides = { ...prev.speedOverrides };
      delete speedOverrides[fileId];
      return { ...prev, files, colorOverrides, hiddenLayers, speedOverrides };
    });
  }, []);

  const renameLayer = useCallback((fileId: string, layerIndex: number, newName: string) => {
    setState((prev) => {
      const files = prev.files.map((f) => {
        if (f.id !== fileId) return f;
        const layers = [...(f.data.layers as Array<Record<string, unknown>>)];
        layers[layerIndex] = { ...layers[layerIndex], nm: newName };
        return { ...f, data: { ...f.data, layers } };
      });
      return { ...prev, files };
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
      speedOverrides: {},
      originalData: {},
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
    setFileSpeed,
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
    renameLayer,
    resetFileModifications,
  };
}
