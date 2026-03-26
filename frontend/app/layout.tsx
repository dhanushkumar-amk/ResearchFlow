import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import Navbar from "../components/Navbar";
import { AuthProvider } from "../lib/AuthContext";
import AuthGuard from "../components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResearchFlow — AI Powered Investigations",
  description: "Deep research, web searching, and document analysis powered by AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 selection:bg-blue-100">
        <AuthProvider>
          <AuthGuard>
            <NextTopLoader color="#2563eb" showSpinner={false} height={3} />
            <Navbar />
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
