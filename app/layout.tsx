import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cake Menu Studio | 점포별 케이크 메뉴판",
  description: "점포마다 다른 케이크 메뉴를 편집하고 A4·A5 재단 규격으로 인쇄하는 메뉴판 제작 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
