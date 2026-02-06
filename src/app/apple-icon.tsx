import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d99ff",
          borderRadius: 40,
        }}
      >
        <svg width="100" height="100" viewBox="0 0 32 32" fill="none">
          <rect x="6" y="9" width="4" height="14" rx="2" fill="white" />
          <rect x="14" y="12" width="4" height="8" rx="2" fill="white" />
          <rect x="22" y="7" width="4" height="18" rx="2" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
