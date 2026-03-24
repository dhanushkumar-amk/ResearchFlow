'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Trash2, 
  ArrowLeft, 
  FileCheck, 
  AlertCircle,
  Clock,
  Database,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';
import Link from 'next/link';

import { uploadDocument, getHistory, deleteDocument } from '../../lib/api';
import { Document } from '../../types/research';

export default function DocumentsPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Feedback Status
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const docs = await getHistory(id);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
      setError('Could not retrieve your documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Phase 40: Unified Identity Migration
    let id = localStorage.getItem('research_user_id') || localStorage.getItem('research_session_id');
    if (!id || id.includes('user_')) {
      id = crypto.randomUUID();
    }
    localStorage.setItem('research_user_id', id);
    setSessionId(id);
    fetchDocuments(id);
  }, [fetchDocuments]);

  // Handle file validation and upload
  const handleUpload = async (file: File) => {
    if (!sessionId) return;
    
    // Reset feedback
    setError(null);
    setSuccess(null);

    // 1. Validation (Frontend)
    const allowedTypes = ['application/pdf', 'text/plain'];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF and TXT are supported.');
      return;
    }

    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    // 2. Start Upload
    setIsUploading(true);
    setUploadProgress(10); // Start with some progress

    try {
      // Small simulated progress increments (actual fetch doesn't expose progress easily without XHR)
      const progInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 300);

      const newDoc = await uploadDocument(file, sessionId);
      
      clearInterval(progInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setDocuments(prev => [newDoc, ...prev]);
        setIsUploading(false);
        setUploadProgress(0);
        setSuccess(`'${file.name}' has been successfully analyzed and embedded.`);
      }, 500);

    } catch (err: unknown) {
      setError((err as Error).message || 'Analysis failed. Please ensure the document is not password protected.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Drag & Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  // Optimistic Delete
  const handleDelete = async (docId: string) => {
    const deletedDoc = documents.find(d => d.id === docId);
    // 1. Optimistic Update
    setDocuments(prev => prev.filter(d => d.id !== docId));
    
    try {
      await deleteDocument(docId);
      setSuccess(`Document deleted successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      // Rollback if failed
      if (deletedDoc) setDocuments(prev => [...prev, deletedDoc]);
      setError('Deletion failed. The server might be unreachable.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 pt-20">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Document Vault
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Upload PDFs or TXT files to ground your research in specific context.
              </p>
            </div>
          </div>
        </div>

        {/* Messaging Area */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">×</button>
          </div>
        )}

        {/* Upload Dropzone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative group bg-white border-2 border-dashed rounded-3xl transition-all duration-300 ${
            isDragging ? 'border-blue-500 bg-blue-50/10 scale-[1.01]' : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="p-12 md:p-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${
              isDragging ? 'bg-blue-600 text-white rotate-12 scale-110 shadow-xl' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}>
              {isUploading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <Upload className="w-10 h-10" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                {isDragging ? 'Drop it like it\'s hot' : 'Drag & Drop Research Material'}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                PDF or TXT documents (Max 10MB). <br className="hidden md:block" />
                These will be vectorized for the RAG agent.
              </p>
            </div>

            <label className="cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.txt" 
                onChange={onFileChange} 
                disabled={isUploading}
              />
              <span className={`px-8 py-3 rounded-2xl font-semibold transition-all shadow-md block ${
                isUploading 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' 
                : 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:scale-105 active:scale-95'
              }`}>
                {isUploading ? 'Analyzing...' : 'Browse Local Files'}
              </span>
            </label>

            {/* Progress Bar */}
            {isUploading && (
              <div className="w-full max-w-md space-y-2 pt-4">
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs font-mono text-zinc-400 text-right">{uploadProgress}% Complete</p>
              </div>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-zinc-400" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Knowledge Base</h2>
            </div>
            <div className="text-sm text-zinc-400 font-medium">
              {documents.length} {documents.length === 1 ? 'Document' : 'Documents'} Loaded
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
              ))
            ) : documents.length > 0 ? (
              documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="group relative bg-white p-6 rounded-2xl border border-zinc-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">{doc.filename}</h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Vector Chunks</span>
                      <span className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                        {doc.chunk_count}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">RAG Enabled</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  <Info className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">No documents found</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">
                    Start by uploading reference material to improve AI reasoning accuracy.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
