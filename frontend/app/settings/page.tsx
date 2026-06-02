'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { 
  ArrowLeft, 
  Brain, 
  Search, 
  Sliders, 
  Monitor, 
  CheckCircle, 
  AlertCircle,
  Loader2, 
  Save, 
  Moon, 
  Sun,
  ShieldAlert,
  Database
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();

  // Settings State
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.4);
  const [searchDepth, setSearchDepth] = useState('detailed');
  const [maxSources, setMaxSources] = useState(10);
  const [searchSource, setSearchSource] = useState('all');
  const [theme, setTheme] = useState('light');
  const [autoSave, setAutoSave] = useState(true);
  const [streamUpdates, setStreamUpdates] = useState(true);

  // Status State
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing settings when user is loaded
  useEffect(() => {
    if (user?.settings) {
      const s = user.settings;
      if (s.model) setModel(s.model);
      if (s.temperature !== undefined) setTemperature(Number(s.temperature));
      if (s.searchDepth) setSearchDepth(s.searchDepth);
      if (s.maxSources !== undefined) setMaxSources(Number(s.maxSources));
      if (s.searchSource) setSearchSource(s.searchSource);
      if (s.theme) setTheme(s.theme);
      if (s.autoSave !== undefined) setAutoSave(!!s.autoSave);
      if (s.streamUpdates !== undefined) setStreamUpdates(!!s.streamUpdates);
    }
  }, [user]);

  if (!user) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const newSettings = {
      model,
      temperature,
      searchDepth,
      maxSources,
      searchSource,
      theme,
      autoSave,
      streamUpdates
    };

    try {
      // updateProfile accepts: name, details, settings
      await updateProfile(user.name, user.details, newSettings);
      setStatusMessage({ type: 'success', text: 'Application settings saved successfully!' });
      
      // Update HTML theme body class
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased selection:bg-emerald-50 selection:text-emerald-700">
      {/* Background Decorative Soft Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.015] rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.25] pointer-events-none z-0" />

      <main className="max-w-4xl mx-auto px-6 py-6 animate-in fade-in duration-300 relative z-10">
        
        {/* Back Link */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs">
            <ArrowLeft className="w-4 h-4 text-slate-650" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Application Settings</h1>
            <p className="text-xs text-slate-500">Configure search models, agent pipelines, and user interface options</p>
          </div>
        </div>

        {/* Settings Status Banner */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50/80 border-emerald-250 text-emerald-800' 
              : 'bg-rose-50/80 border-rose-250 text-rose-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{statusMessage.text}</p>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* Card 1: AI Model Settings */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2 pb-1">
              <Brain className="w-4.5 h-4.5 text-emerald-500" />
              Inference & LLM Settings
            </h2>
            <p className="text-[11px] text-slate-500 mb-6 border-b border-slate-100 pb-4">
              Select the primary artificial intelligence model utilized by the research agents for plan generation and synthesis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="model" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Primary Research Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-slate-700 bg-slate-50/20 cursor-pointer"
                >
                  <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Recommended - Ultra Fast)</option>
                  <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Deep Complex Reasoning)</option>
                  <option value="llama-3.3-70b-versatile">Meta Llama 3.3 70B (Fast Versatile via Groq)</option>
                  <option value="mixtral-8x7b-32768">Mistral Mixtral 8x7B (Groq)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="temperature" className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Creativity / Temperature
                  </label>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                    {temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  id="temperature"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1.5 font-bold">
                  <span>Focused & Exact (0.0)</span>
                  <span>Creative & Scholarly (1.0)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Research Engine Settings */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2 pb-1">
              <Search className="w-4.5 h-4.5 text-emerald-500" />
              Intelligence Research Engine
            </h2>
            <p className="text-[11px] text-slate-500 mb-6 border-b border-slate-100 pb-4">
              Tune your agentic research pipelines, query depths, and external sources configuration.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Research depth selection */}
              <div>
                <label htmlFor="searchDepth" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Default Research Depth
                </label>
                <select
                  id="searchDepth"
                  value={searchDepth}
                  onChange={(e) => setSearchDepth(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-slate-700 bg-slate-50/20 cursor-pointer"
                >
                  <option value="basic">Basic (Fast search, 1 iteration)</option>
                  <option value="detailed">Detailed (Iterative web-crawl, 2-3 cycles)</option>
                  <option value="deep">Deep Research (Full Scholarly Loop, 4+ cycles)</option>
                </select>
              </div>

              {/* Max search sources */}
              <div>
                <label htmlFor="maxSources" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Max Search Sources
                </label>
                <select
                  id="maxSources"
                  value={maxSources}
                  onChange={(e) => setMaxSources(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-slate-700 bg-slate-50/20 cursor-pointer"
                >
                  <option value="5">Top 5 primary sources</option>
                  <option value="10">Top 10 primary sources</option>
                  <option value="15">Top 15 primary sources</option>
                  <option value="20">Top 20 primary sources</option>
                </select>
              </div>

              {/* Default Web Source */}
              <div>
                <label htmlFor="searchSource" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Primary Search Scope
                </label>
                <select
                  id="searchSource"
                  value={searchSource}
                  onChange={(e) => setSearchSource(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-slate-700 bg-slate-50/20 cursor-pointer"
                >
                  <option value="all">Entire Web Index</option>
                  <option value="academic">Academic Journals & Research</option>
                  <option value="tech">News & Technology Sites</option>
                  <option value="wikipedia">Wikipedia Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: App System Preferences */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2 pb-1">
              <Sliders className="w-4.5 h-4.5 text-emerald-500" />
              Workspace & Interface Preferences
            </h2>
            <p className="text-[11px] text-slate-500 mb-6 border-b border-slate-100 pb-4">
              Adjust accessibility styles, local cache choices, and live server updates behavior.
            </p>

            <div className="space-y-4">
              
              {/* Theme Settings Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Visual Color Theme</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Toggle between standard light layout and relaxing dark viewports</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white border-emerald-450 text-emerald-600 font-extrabold'
                        : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Light Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-950 text-white font-extrabold shadow-sm'
                        : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Dark Theme
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Auto Save Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800">Auto-Save Research Sessions</h3>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Automatically save session history into database queries</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSave(!autoSave)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoSave ? 'bg-emerald-505 bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        autoSave ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Real-time SSE Streams Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800">Stream Updates (SSE)</h3>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Enable real-time agent output streaming during investigations</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStreamUpdates(!streamUpdates)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      streamUpdates ? 'bg-emerald-505 bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        streamUpdates ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex justify-end gap-3">
            <Link 
              href="/"
              className="px-6 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 bg-white rounded-2xl text-xs font-bold transition-all shadow-xs"
            >
              Discard Changes
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-650 hover:to-teal-650 text-white rounded-2xl text-xs font-black transition-all shadow-[0_4px_14px_rgba(16,185,129,0.2)] disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save App Configuration
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
