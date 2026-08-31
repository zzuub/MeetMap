import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/shared/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetMap",
  description: "오늘 갈 모임, 위치와 분위기로 골라요",
};

export const viewport: Viewport = {
  // 모바일 우선. 사용자 확대는 막지 않는다 (15장 접근성).
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBFAF6",
};

/**
 * 루트 레이아웃.
 *
 * 셸 폭(430px 중앙 정렬)은 여기서 잡지 않는다. `(main)` / `(stack)` /
 * `(onboarding)` 그룹마다 하단 탭·헤더 유무가 달라 각 그룹 레이아웃이 책임진다 (2.1).
 * 여기서는 전역 프로바이더만 얹는다.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
