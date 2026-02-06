"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "motion/react";
import { useLottieStore } from "@/hooks/useLottieStore";
import Sidebar from "@/components/Sidebar";
import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";

export default function Home() {
  const {
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
    setBgColor,
    setGridSize,
    toggleCardPlaying,
    setColorOverride,
    resetColors,
    toggleLayerVisibility,
  } = useLottieStore();

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
      Promise.all(readers).then(addFiles).catch(console.error);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json", ".lottie"] },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className="flex h-screen w-screen overflow-hidden relative"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <input {...getInputProps()} />

      {/* Global drag overlay */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: "rgba(13, 153, 255, 0.06)",
            backdropFilter: "blur(2px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4 p-10 rounded-2xl"
            style={{
              background: "var(--bg-surface)",
              boxShadow: "var(--shadow-lg)",
              border: "2px dashed var(--bg-accent)",
            }}
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ background: "var(--bg-accent-subtle)" }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4v20M4 14h20" stroke="var(--bg-accent)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Drop Lottie files
              </p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                JSON or .lottie files
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Sidebar */}
      <Sidebar
        files={state.files}
        selectedId={state.selectedId}
        bgColor={state.bgColor}
        onSelect={selectFile}
        onRemove={removeFile}
        onRemoveAll={removeAllFiles}
        onAddFiles={addFiles}
        onBgColorChange={setBgColor}
      />

      {/* Main canvas — grid of all animations */}
      <Canvas
        files={state.files}
        selectedId={state.selectedId}
        isPlaying={state.isPlaying}
        speed={state.speed}
        loop={state.loop}
        direction={state.direction}
        showGrid={state.showGrid}
        bgColor={state.bgColor}
        gridSize={state.gridSize}
        cardPlayingMap={state.cardPlayingMap}
        onSelect={selectFile}
        onRemove={removeFile}
        onPlayPause={setPlaying}
        onSpeedChange={setSpeed}
        onLoopToggle={setLoop}
        onDirectionToggle={toggleDirection}
        onShowGridChange={setShowGrid}
        onGridSizeChange={setGridSize}
        onAddFiles={addFiles}
        onToggleCardPlay={toggleCardPlaying}
        colorOverrides={state.colorOverrides}
        hiddenLayers={state.hiddenLayers}
      />

      {/* Inspector panel */}
      <Inspector
        file={selectedFile}
        colorOverrides={selectedFile ? (state.colorOverrides[selectedFile.id] || {}) : {}}
        hiddenLayers={selectedFile ? (state.hiddenLayers[selectedFile.id] || []) : []}
        onColorChange={(originalHex, newHex) => {
          if (selectedFile) setColorOverride(selectedFile.id, originalHex, newHex);
        }}
        onResetColors={() => {
          if (selectedFile) resetColors(selectedFile.id);
        }}
        onToggleLayer={(layerIndex) => {
          if (selectedFile) toggleLayerVisibility(selectedFile.id, layerIndex);
        }}
      />
    </div>
  );
}
