import type { Metadata } from "next";
import {
  Anek_Bangla,
  Noto_Serif_Bengali,
} from "next/font/google";
import { Providers } from "@/components/common/providers";
import { AppShell } from "@/components/common/app-shell";
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
  title: "Bonton — Expense Sharing & Settlement System",
  description: "Easily split expenses with friends and settle them in a local-first secure system.",
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
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
