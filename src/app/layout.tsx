import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lottie Viewer — Inspect & Preview Animations",
  description: "A Figma-inspired viewer to preview and inspect Lottie animation files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
