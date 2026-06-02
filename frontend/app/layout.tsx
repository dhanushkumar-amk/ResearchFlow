import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import Navbar from "../components/Navbar";
import { AuthProvider } from "../lib/AuthContext";
import AuthGuard from "../components/AuthGuard";
import ErrorSuppressor from "../components/ErrorSuppressor";

const inter = Inter({
  variable: "--font-inter",
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
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function suppressMetaMask(e) {
              var msg = e.message || (e.reason && e.reason.message) || String(e.reason || '');
              var stack = (e.error && e.error.stack) || (e.reason && e.reason.stack) || '';
              var file = e.filename || '';
              if (
                msg.indexOf('MetaMask') !== -1 ||
                msg.indexOf('nkbihfbeogaeaoehlefnkodbefgpgknn') !== -1 ||
                stack.indexOf('nkbihfbeogaeaoehlefnkodbefgpgknn') !== -1 ||
                file.indexOf('nkbihfbeogaeaoehlefnkodbefgpgknn') !== -1
              ) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return true;
              }
            }
            window.addEventListener('error', suppressMetaMask, true);
            window.addEventListener('unhandledrejection', suppressMetaMask, true);
          })();
        ` }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 selection:bg-emerald-100">
        <ErrorSuppressor />
        <AuthProvider>
          <AuthGuard>
            <NextTopLoader color="#10b981" showSpinner={false} height={3} />
            <Navbar />
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}

