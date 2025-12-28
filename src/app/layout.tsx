import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from "@/components/ui/sonner";
import { HeaderWrapper } from "@/components/header-wrapper";
import { SkipLink } from "@/components/ui/skip-link";
import RegisterSW from "./RegisterSW";
import { frFR } from '@clerk/localizations';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASUL Team - Plan d'entraînement et vie du club",
  description: "Création de plans d'entraînement personnalisés et gestion de la vie du club pour la Team ASUL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SkipLink />
          <HeaderWrapper />
          <RegisterSW />
          <main id="main-content" className="pt-16" role="main" tabIndex={-1}>
            {children}
          </main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
