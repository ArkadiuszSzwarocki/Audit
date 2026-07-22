import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "AuditApp - Zarządzanie Audytami",
  description: "Nowoczesna aplikacja do zarządzania audytami 5S, GMP, HACCP i innymi standardami.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="antialiased">
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-950`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
