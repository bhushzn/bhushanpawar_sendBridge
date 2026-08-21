import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import QueryProvider from "@/providers/query-provider";
import { Navbar } from "@/components/layout/navbar";
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
  title: "SendBridge — Cross-Border Remittance on Stellar",
  description:
    "Fast, transparent and low-cost cross-border remittance powered by Stellar. Stellar Testnet Demo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0f1a] text-white font-[family-name:var(--font-geist-sans)]">
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-600">
            <p>
              Stellar Testnet Demo — Not a real-money remittance service.
            </p>
            <p className="mt-1">
              Powered by Stellar Soroban Smart Contracts
            </p>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
