"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { useLottieStore } from "@/hooks/useLottieStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import Sidebar from "@/components/Sidebar";
import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";
import { CloseIcon } from "@/components/Icons";

export default function Home() {
  const {
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
    setBgColor,
    setGridSize,
    toggleCardPlaying,
    setColorOverride,
    toggleLayerVisibility,
    renameLayer,
    resetFileModifications,
  } = useLottieStore();

  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Close overlays when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
      setIsInspectorOpen(false);
    }
  }, [isMobile]);

  // Toggle body scroll lock when overlays are open
  useEffect(() => {
    if (isSidebarOpen || isInspectorOpen) {
      document.body.classList.add("overlay-open");
    } else {
      document.body.classList.remove("overlay-open");
    }
    return () => document.body.classList.remove("overlay-open");
  }, [isSidebarOpen, isInspectorOpen]);

  // Wrap selectFile for mobile: auto-close sidebar
  const handleSelectFile = useCallback(
    (id: string) => {
      selectFile(id);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
    [selectFile, isMobile]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const readers = acceptedFiles.map(
        (file) =>
          new Promise<{ name: string; data: Record<string, unknown>; size: number; fileType?: "lottie" | "svg"; svgContent?: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const text = reader.result as string;
              if (file.name.toLowerCase().endsWith(".svg")) {
                const wMatch = text.match(/viewBox="[^"]*?\s([\d.]+)\s([\d.]+)"/);
                const w = wMatch ? parseFloat(wMatch[1]) : 0;
                const h = wMatch ? parseFloat(wMatch[2]) : 0;
                resolve({ name: file.name, data: { w, h }, size: file.size, fileType: "svg", svgContent: text });
              } else {
                try {
                  const data = JSON.parse(text);
                  resolve({ name: file.name, data, size: file.size, fileType: "lottie" });
                } catch {
                  reject(new Error(`Invalid JSON in ${file.name}`));
                }
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
    accept: { "application/json": [".json", ".lottie"], "image/svg+xml": [".svg"] },
    noClick: true,
    noKeyboard: true,
  });

  const inspectorProps = {
    file: selectedFile,
    colorOverrides: selectedFile ? (state.colorOverrides[selectedFile.id] || {}) : {},
    hiddenLayers: selectedFile ? (state.hiddenLayers[selectedFile.id] || []) : [],
    speed: selectedFile ? (state.speedOverrides[selectedFile.id] || 1) : 1,
    onColorChange: (originalHex: string, newHex: string) => {
      if (selectedFile) setColorOverride(selectedFile.id, originalHex, newHex);
    },
    onToggleLayer: (layerIndex: number) => {
      if (selectedFile) toggleLayerVisibility(selectedFile.id, layerIndex);
    },
    onSpeedChange: (speed: number) => {
      if (selectedFile) setFileSpeed(selectedFile.id, speed);
    },
    onRenameLayer: (layerIndex: number, newName: string) => {
      if (selectedFile) renameLayer(selectedFile.id, layerIndex, newName);
    },
    onResetAll: () => {
      if (selectedFile) resetFileModifications(selectedFile.id);
    },
    hasAnyModification: selectedFile
      ? !!(
          Object.keys(state.colorOverrides[selectedFile.id] || {}).length ||
          (state.hiddenLayers[selectedFile.id] || []).length ||
          state.speedOverrides[selectedFile.id] ||
          (state.originalData[selectedFile.id] && state.originalData[selectedFile.id] !== selectedFile.data)
        )
      : false,
  };

  const sidebarProps = {
    files: state.files,
    selectedId: state.selectedId,
    bgColor: state.bgColor,
    onSelect: handleSelectFile,
    onRemove: removeFile,
    onRemoveAll: removeAllFiles,
    onAddFiles: addFiles,
    onBgColorChange: setBgColor,
  };

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
                Drop files
              </p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                JSON, .lottie or .svg files
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-[260px] shrink-0 border-r" style={{ borderColor: "var(--border-default)" }}>
          <Sidebar {...sidebarProps} />
        </div>
      )}

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sliding panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col"
              style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-lg)" }}
            >
              {/* Close button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-2 right-2 z-10 flex items-center justify-center h-8 w-8 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-canvas)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <CloseIcon size={16} />
              </button>
              <Sidebar {...sidebarProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main canvas — always visible */}
      <Canvas
        files={state.files}
        selectedId={state.selectedId}
        isPlaying={state.isPlaying}
        loop={state.loop}
        direction={state.direction}
        showGrid={state.showGrid}
        bgColor={state.bgColor}
        gridSize={state.gridSize}
        cardPlayingMap={state.cardPlayingMap}
        onSelect={handleSelectFile}
        onRemove={removeFile}
        onPlayPause={setPlaying}
        onLoopToggle={setLoop}
        onDirectionToggle={toggleDirection}
        onShowGridChange={setShowGrid}
        onGridSizeChange={setGridSize}
        onAddFiles={addFiles}
        onToggleCardPlay={toggleCardPlaying}
        colorOverrides={state.colorOverrides}
        hiddenLayers={state.hiddenLayers}
        speedOverrides={state.speedOverrides}
        onOpenSidebar={isMobile ? () => setIsSidebarOpen(true) : undefined}
        onOpenInspector={isMobile ? () => setIsInspectorOpen(true) : undefined}
      />

      {/* Desktop Inspector */}
      {!isMobile && (
        <div className="w-[240px] shrink-0 border-l flex flex-col" style={{ borderColor: "var(--border-default)" }}>
          <Inspector {...inspectorProps} />
        </div>
      )}

      {/* Mobile Inspector — slide from right */}
      <AnimatePresence>
        {isMobile && isInspectorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setIsInspectorOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] flex flex-col"
              style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-lg)" }}
            >
              {/* Mobile header with close button — replaces Inspector's own header */}
              <div
                className="flex items-center justify-between px-4 h-11 border-b shrink-0"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: "var(--text-primary)" }}>
                  Properties
                </span>
                <div className="flex items-center gap-1">
                  {selectedFile && inspectorProps.hasAnyModification && (
                    <button
                      onClick={inspectorProps.onResetAll}
                      className="flex items-center gap-1 text-[10px] font-medium rounded-md px-1.5 py-1 transition-colors duration-100"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setIsInspectorOpen(false)}
                    className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-canvas)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              </div>
              <Inspector {...inspectorProps} hideHeader />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
