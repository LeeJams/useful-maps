import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://useful-maps.vercel.app"),
  title: {
    default: "쓸모지도 — 복잡한 개념을 작동하는 지도로",
    template: "%s · 쓸모지도"
  },
  description:
    "개발 개념과 실전 팁을 직접 조작하고 비교하며 이해하는 인터랙티브 시각 가이드 라이브러리.",
  openGraph: {
    title: "쓸모지도",
    description: "복잡한 개념을 작동하는 지도로 이해하세요.",
    locale: "ko_KR",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
