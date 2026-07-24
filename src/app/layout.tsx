import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "AuditApp - System Audytów, BHP i Jakości",
  description: "Nowoczesny system PWA do audytów produkcyjnych 5S, GMP, HACCP, BHP oraz zgłoszeń usterek.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AuditApp",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="antialiased">
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-950`}>
        <PwaRegister />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
