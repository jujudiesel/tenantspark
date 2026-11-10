import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const kanit = localFont({
  src: [
    { path: "./fonts/Kanit-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Kanit-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-kanit",
  display: "swap",
});

const kanitItalic = localFont({
  src: "./fonts/Kanit-ExtraBoldItalic.ttf",
  variable: "--font-kanit-italic",
  weight: "800",
  style: "italic",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "TenantSpark", template: "%s | TenantSpark" },
  description: "Property management software for small landlords.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${kanit.variable} ${kanitItalic.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
