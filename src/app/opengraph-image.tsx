import { ImageResponse } from "next/og";

export const alt = "Lottie Viewer — Inspect & Preview Animations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #e8f4fd 50%, #dbeafe 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "#0d99ff",
            marginBottom: 40,
            boxShadow: "0 20px 60px rgba(13, 153, 255, 0.3)",
          }}
        >
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="9" width="4" height="14" rx="2" fill="white" />
            <rect x="14" y="12" width="4" height="8" rx="2" fill="white" />
            <rect x="22" y="7" width="4" height="18" rx="2" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Lottie Viewer
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#6b7280",
            fontWeight: 500,
          }}
        >
          Inspect, preview & customize Lottie animations
        </div>
      </div>
    ),
    { ...size }
  );
}
