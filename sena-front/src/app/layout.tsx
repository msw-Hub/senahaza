import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
});
const notoSansKR = Noto_Sans_KR({
  subsets: [],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "Senahaza - 세븐나이츠 패키지 효율 계산기",
  description: "세븐나이츠 패키지 효율 계산기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSans.variable} ${notoSansKR.variable} antialiased`}>{children}</body>
    </html>
  );
}
