import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lottie Viewer — Inspect & Preview Animations",
  description:
    "A free, browser-based Lottie animation viewer. Upload JSON files to preview, inspect layers, edit colors, toggle visibility, and download modified animations.",
  keywords: [
    "lottie",
    "lottie viewer",
    "lottie preview",
    "lottie editor",
    "lottie animation",
    "lottie json",
    "animation viewer",
    "motion design",
    "lottie colors",
    "lottie layers",
  ],
  authors: [{ name: "Lottie Viewer" }],
  creator: "Lottie Viewer",
  metadataBase: new URL("https://lottie-viewer.vercel.app"),
  openGraph: {
    title: "Lottie Viewer — Inspect & Preview Animations",
    description:
      "Upload Lottie JSON files to preview animations in a grid, inspect layers, edit colors, toggle layer visibility, and download modified files.",
    type: "website",
    siteName: "Lottie Viewer",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lottie Viewer — Inspect & Preview Animations",
    description:
      "Free browser-based Lottie animation viewer. Preview, inspect, edit colors, toggle layers, and download modified animations.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
