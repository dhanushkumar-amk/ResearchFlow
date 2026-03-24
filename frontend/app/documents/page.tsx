import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40 antialiased p-8">
      <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-blue-600 transition-colors mb-8 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Research
      </Link>
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-8 tracking-tight">Upload Documents</h1>
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-12 text-center group hover:border-blue-500 transition-all cursor-pointer">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 mb-4 group-hover:scale-110 transition-transform">
          <Upload className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Select a document to upload</h2>
        <p className="text-zinc-500 max-w-sm">Support for PDF and TXT files. Documents are indexed and used for relevant research queries.</p>
        <button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-md active:scale-95">
          Browse Files
        </button>
      </div>
    </div>
  );
}
