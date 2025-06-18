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
      <head>
        <link rel="stylesheet" type="text/css" href="/XEIcon/xeicon.min.css" />
      </head>
      <body className={`${notoSans.variable} ${notoSansKR.variable} antialiased w-dvw h-dvh`}>
        <div className="flex flex-col h-full">
          <header className="bg-gray-800 text-white p-4 w-screen">
            <h1 className="text-2xl font-bold">세븐나이츠 패키지 효율 계산기</h1>
          </header>
          <main className="flex-1 h-full text-black bg-background">{children}</main>
          <footer className="bg-gray-800 text-white p-4 text-center w-screen">&copy; {new Date().getFullYear()} Senahaza</footer>
        </div>
      </body>
    </html>
  );
}
