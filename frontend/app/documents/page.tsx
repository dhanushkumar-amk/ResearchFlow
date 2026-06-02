'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Globe, Search, BookOpen,
  Trash2, RefreshCw, FileText, CheckCircle2,
  Clock, Database, Info, HardDrive, 
  AlertCircle, ArrowLeft, Send, Sparkles, 
  Link2, Loader2, FileCheck, HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { uploadDocument, getHistory, deleteDocument, ingestUrl, queryKnowledgeBase } from '../../lib/api';
import { Document } from '../../types/research';
import { useAuth } from '../../lib/AuthContext';

// Custom SVG Youtube icon to bypass lucide-react export discrepancy
const YoutubeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface DocumentItem {
  id: string;
  name: string;
  type: 'PDF' | 'URL' | 'YouTube' | 'Word';
  status: 'indexed' | 'processing' | 'failed';
  dateAdded: string;
  size: string;
  chunks: number;
  s3Url?: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Data States
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'PDF' | 'URL' | 'YouTube' | 'Word'>('all');

  // Input states
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'website' | 'youtube'>('website');
  const [isIngestingUrl, setIsIngestingUrl] = useState(false);

  // Drag & Drop / File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Q&A Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatSources, setChatSources] = useState<string[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Feedback Notification Alerts
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (authToken: string) => {
    try {
      setIsLoading(true);
      const docs = await getHistory(authToken);
      setDocuments(docs || []);
    } catch (err) {
      console.error('Failed to load documents', err);
      setLocalError('Could not retrieve your documents. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchDocuments(token);
    }
  }, [token, fetchDocuments]);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setLocalError(null);
    setLocalSuccess(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleFileUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    setLocalSuccess(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleFileUpload(file);
    }
  };

  // Upload File Logic
  const handleFileUpload = async (file: File) => {
    if (!token || !user) {
      setLocalError('Authentication session not active.');
      return;
    }

    const allowedTypes = ['application/pdf', 'text/plain'];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setLocalError('Unsupported format. Please upload PDF, TXT or DOCX files.');
      return;
    }

    if (file.size > MAX_SIZE) {
      setLocalError('File size exceeds the 10MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const progInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 85 ? prev + 15 : prev));
      }, 350);

      const uploadSessionId = user.id;
      const newDoc = await uploadDocument(file, uploadSessionId, token);
      
      clearInterval(progInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setDocuments(prev => [newDoc, ...prev]);
        setIsUploading(false);
        setUploadProgress(0);
        setLocalSuccess(`"${file.name}" successfully parsed and stored.`);
        setTimeout(() => setLocalSuccess(null), 5000);
      }, 500);

    } catch (err: any) {
      console.error(err);
      setLocalError(err.message || 'Failed to complete document ingestion.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle URL Scrape & Vectorize Submission
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !token || !user) return;

    setLocalError(null);
    setLocalSuccess(null);
    setIsIngestingUrl(true);

    try {
      const uploadSessionId = user.id;
      const response = await ingestUrl(urlInput.trim(), urlType, uploadSessionId, token);
      
      setDocuments(prev => [response.document, ...prev]);
      setUrlInput('');
      setLocalSuccess(`"${response.document.filename}" indexed into vector space.`);
      setTimeout(() => setLocalSuccess(null), 5000);
    } catch (err: any) {
      console.error('URL ingestion failed:', err);
      setLocalError(err.message || 'Failed to scrape webpage. Ensure URL is public.');
    } finally {
      setIsIngestingUrl(false);
    }
  };

  // Handle RAG Q&A Assistant Query
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || !token || !user) return;

    setLocalError(null);
    setIsQuerying(true);
    setChatAnswer(null);
    setChatSources([]);

    try {
      const uploadSessionId = user.id;
      const response = await queryKnowledgeBase(chatQuery, uploadSessionId, token);
      setChatAnswer(response.answer);
      setChatSources(response.sources || []);
    } catch (err: any) {
      console.error('Q&A search failed:', err);
      setLocalError(err.message || 'Similarity search query failed.');
    } finally {
      setIsQuerying(false);
    }
  };

  // Delete Document Record
  const deleteDoc = async (id: string) => {
    if (!token) return;
    setLocalError(null);
    setLocalSuccess(null);

    const deletedDoc = documents.find(d => d.document_id === id);
    // Optimistic Update
    setDocuments(prev => prev.filter(d => d.document_id !== id));

    try {
      await deleteDocument(id, token);
      setLocalSuccess('Document deleted successfully.');
      setTimeout(() => setLocalSuccess(null), 3000);
    } catch (err: any) {
      if (deletedDoc) {
        setDocuments(prev => [...prev, deletedDoc]);
      }
      setLocalError('Failed to remove document.');
    }
  };

  // Map backend documents to Table items
  const mappedDocuments: DocumentItem[] = documents.map((doc) => {
    let mappedType: 'PDF' | 'URL' | 'YouTube' | 'Word' = 'PDF';
    const ext = (doc.mimetype || (doc as any).file_type || '').toLowerCase();
    if (ext === 'url' || ext === 'website') {
      mappedType = 'URL';
    } else if (ext === 'youtube') {
      mappedType = 'YouTube';
    } else if (ext === 'docx' || ext === 'doc' || ext === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      mappedType = 'Word';
    } else {
      mappedType = 'PDF';
    }

    let dateAdded = 'Unknown';
    try {
      const date = new Date(doc.uploaded_at || (doc as any).created_at);
      dateAdded = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      // fallback
    }

    let size = 'Web Link';
    if (mappedType === 'PDF') {
      size = 'PDF Document';
    } else if (mappedType === 'Word') {
      size = 'Word Document';
    } else if (mappedType === 'YouTube') {
      size = 'Video Script';
    }

    return {
      id: doc.document_id,
      name: doc.filename,
      type: mappedType,
      status: 'indexed',
      dateAdded,
      size,
      chunks: doc.chunk_count || 0,
      s3Url: (doc as any).s3_url,
    };
  });

  // Filter Table Items
  const filteredDocs = mappedDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate simulated capacity (0.35 MB per document)
  const totalStorageMB = parseFloat((documents.length * 0.35).toFixed(2));
  const storagePct = Math.min((totalStorageMB / 100) * 100, 100);

  const handleDocumentClick = (doc: DocumentItem) => {
    if (doc.s3Url) {
      window.open(doc.s3Url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pt-32 font-sans antialiased text-slate-800">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Banner Welcome Header Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-550/15 via-teal-500/5 to-indigo-550/15 border border-emerald-500/15 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="p-2 bg-white/80 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all duration-200 group shadow-xs hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                Knowledge Space
              </span>
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                Active Indexing
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Vector Knowledge Vault
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
              Supercharge your research assistant by connecting local documents, website articles, and video transcripts into a single semantic Q&A space.
            </p>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-emerald-450/10 rounded-full blur-3xl" />
          <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl" />
        </div>

        {/* Error / Success Alerts */}
        <AnimatePresence>
          {localError && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-700 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                <span>{localError}</span>
              </div>
              <button onClick={() => setLocalError(null)} className="text-red-400 hover:text-red-650 font-bold px-2 py-1">×</button>
            </motion.div>
          )}

          {localSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-green-50 border border-green-100 text-xs font-semibold text-green-755 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                <span>{localSuccess}</span>
              </div>
              <button onClick={() => setLocalSuccess(null)} className="text-green-400 hover:text-green-600 font-bold px-2 py-1">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inputs Layout: 3 Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: File Upload Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all h-[210px] ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/[0.15]'
                : 'border-zinc-200 bg-white hover:border-zinc-350 hover:bg-zinc-50/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.doc,.txt"
              disabled={isUploading}
            />
            <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl mb-3 text-zinc-650">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              ) : (
                <Upload className="h-6 w-6 text-zinc-500" />
              )}
            </div>
            <p className="text-sm font-bold text-zinc-800">
              {isUploading ? `Ingesting File (${uploadProgress}%)` : 'Drag & Drop files here'}
            </p>
            <p className="text-xs text-zinc-450 mt-1 font-semibold">
              {isUploading ? 'Chunking and generating embeddings...' : 'or click to browse. Supports PDF, DOCX, TXT (Max 10MB)'}
            </p>

            {isUploading && (
              <div className="w-full max-w-[200px] mt-3 h-1 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>

          {/* Column 2: Web & YouTube URL Scraper */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between gap-4 h-[210px]">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-50">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-zinc-400" /> Scrape & Vectorize URL
              </span>
              <div className="flex bg-zinc-50 p-0.5 rounded-lg border border-zinc-150">
                <button
                  onClick={() => setUrlType('website')}
                  className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                    urlType === 'website'
                      ? 'bg-white text-zinc-800 shadow-xs font-bold'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Website
                </button>
                <button
                  onClick={() => setUrlType('youtube')}
                  className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                    urlType === 'youtube'
                      ? 'bg-white text-red-650 shadow-xs font-bold'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  YouTube
                </button>
              </div>
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="relative">
                  {urlType === 'website' ? (
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  ) : (
                    <YoutubeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-red-500" />
                  )}
                  <input
                    type="url"
                    required
                    placeholder={urlType === 'website' ? 'https://example.com/research-paper' : 'https://youtube.com/watch?v=...'}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white transition-all text-zinc-800 placeholder-zinc-400"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal font-medium">
                  {urlType === 'website'
                    ? 'The webpage will be scraped, stripped of script boilerplates, and vectorized.'
                    : 'The video captions transcript will be reconstructed and vectorized as context.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isIngestingUrl || !urlInput.trim()}
                className="w-full bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {isIngestingUrl ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Ingesting Context...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Scrape & Index Context
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Column 3: Storage usage & metrics */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[210px]">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Storage Capacity (AWS S3)</span>
                <HardDrive className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-neutral-900 tracking-tight mt-1">
                {totalStorageMB} MB <span className="text-xs font-bold text-neutral-400">of 100 MB Limit</span>
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${storagePct}%` }} />
              </div>
              <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase">
                <span>{storagePct}% USED</span>
                <span>{(100 - totalStorageMB).toFixed(2)} MB AVAILABLE</span>
              </div>
            </div>

            <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-2">
              <Info className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-850 leading-normal font-semibold">
                Uploaded document archives are saved securely in AWS S3 and split into vector indexes for semantic workspace search.
              </p>
            </div>
          </div>

        </div>

        {/* 2 Columns: Table View on Left | Chat Assistant on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: TABLE VIEW OF DOCUMENTS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search & Filter Controls */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search library documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-555 bg-white transition-all text-zinc-800 placeholder-zinc-400"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-555 bg-white text-zinc-700 cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="PDF">PDFs</option>
                  <option value="URL">Web Links</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Word">Word Docs</option>
                </select>
              </div>
            </div>

            {/* Document Table */}
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[9px] tracking-wider">
                      <th className="p-4">Name / Title</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Date Added</th>
                      <th className="p-4">Chunks</th>
                      <th className="p-4">Storage Location</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="p-4 h-12 bg-zinc-50/20" />
                        </tr>
                      ))
                    ) : filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-550/5 transition-colors">
                        <td
                          onClick={() => handleDocumentClick(doc)}
                          className={`p-4 font-bold text-zinc-800 max-w-[280px] truncate transition-colors ${
                            doc.s3Url ? 'hover:text-emerald-600 hover:underline cursor-pointer' : ''
                          }`}
                          title={doc.name}
                        >
                          {doc.name}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-wider text-zinc-500">
                            {doc.type === 'PDF' && <FileText className="h-3.5 w-3.5 text-rose-500" />}
                            {doc.type === 'URL' && <Globe className="h-3.5 w-3.5 text-blue-500" />}
                            {doc.type === 'YouTube' && <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />}
                            {doc.type === 'Word' && <FileText className="h-3.5 w-3.5 text-indigo-500" />}
                            {doc.type}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500 font-semibold">{doc.dateAdded}</td>
                        <td className="p-4 text-zinc-650 font-mono font-bold">{doc.chunks}</td>
                        <td className="p-4 text-zinc-450 font-semibold truncate max-w-[140px]">
                          {doc.s3Url ? 'AWS S3 Cloud' : 'Qdrant DB Link'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => deleteDoc(doc.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors"
                            title="Delete Vectors & Archive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDocs.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-zinc-450 font-semibold uppercase tracking-wider text-[10px]">
                          No vector indexes found in your vault.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT: SEMANTIC RAG Q&A CHAT */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col h-[480px] justify-between">
              
              <div>
                <div className="pb-3 border-b border-zinc-100 flex items-center justify-between mb-4">
                  <h2 className="text-xs font-black text-zinc-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" /> RAG Q&A Assistant
                  </h2>
                  <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                    Grounded
                  </span>
                </div>

                {/* Chat Display Area */}
                <div className="h-[300px] overflow-y-auto pr-1 py-1 space-y-4 no-scrollbar">
                  {!chatAnswer && !isQuerying && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50 my-10">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner">
                        <BookOpen className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Ask Your Knowledge Base</h4>
                        <p className="text-[9px] text-zinc-500 max-w-[240px] mx-auto mt-1 leading-relaxed font-semibold uppercase tracking-wider">
                          Enter any question to search matching vector chunks and get cited answers.
                        </p>
                      </div>
                    </div>
                  )}

                  {isQuerying && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 my-10">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">
                        Retrieving relevant chunks...
                      </span>
                    </div>
                  )}

                  {chatAnswer && !isQuerying && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl text-zinc-700 font-sans text-xs leading-relaxed">
                        <div className="prose prose-xs max-w-none text-zinc-700">
                          <ReactMarkdown>{chatAnswer}</ReactMarkdown>
                        </div>
                      </div>

                      {/* Source Citations */}
                      {chatSources.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Retrieved sources:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {chatSources.map((source, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-bold text-zinc-650"
                              >
                                <FileCheck className="w-3 h-3 text-emerald-500" />
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleQuery} className="pt-3 border-t border-zinc-100">
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    required
                    disabled={isQuerying || documents.length === 0}
                    placeholder={documents.length === 0 ? "Upload documents to ask questions..." : "Ask your vector vault..."}
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-800 placeholder-zinc-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!chatQuery.trim() || isQuerying || documents.length === 0}
                    className="absolute right-1.5 top-1.5 p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
