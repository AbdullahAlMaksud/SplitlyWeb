import type { Metadata } from "next";
import {
  Anek_Bangla,
  Geist,
  Geist_Mono,
  Noto_Serif_Bengali,
} from "next/font/google";
import { Providers } from "@/components/app/providers";
import "./globals.css";

const anekBangla = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["bengali", "latin"],
});

const notoSerifBengali = Noto_Serif_Bengali({
  variable: "--font-noto-serif-bengali",
  subsets: ["bengali", "latin"],
});

export const metadata: Metadata = {
  title: "Splitly",
  description: "খরচ ভাগ ও সেটেলমেন্ট করার সিস্টেম",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${anekBangla.variable} ${notoSerifBengali.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
