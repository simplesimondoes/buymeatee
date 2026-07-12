import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { StructuredData } from "@/components/structured-data";
import { rootMetadata } from "@/lib/seo/metadata";
import { webSiteJsonLd } from "@/lib/seo/structured-data";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest focus:px-5 focus:py-2.5 focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <StructuredData data={webSiteJsonLd()} />
      </body>
    </html>
  );
}
