'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Brain, ChevronDown, User, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/research', label: 'Research General' },
  { href: '/documents', label: 'RAG' },
  { href: '/history', label: 'History' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Do not render navbar on public pages or when user is not logged in
  if (loading || !user) return null;

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] h-16 flex items-center transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 w-full flex items-center justify-between">
        
        {/* Brand Logo - Premium Glow */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-500 text-white p-2 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.2)] group-hover:scale-105 transition-transform duration-300">
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            ResearchMind
          </span>
        </Link>

        {/* Desktop Nav Links (Clean, modern active pills) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/65 p-1 rounded-xl border border-slate-200/40">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={`${link.label}-${index}`}
                href={link.href}
                className={`text-xs font-bold tracking-tight transition-all duration-300 py-1.5 px-4 rounded-lg ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-sm shadow-slate-100 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User Profile Dropdown Menu */}
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-205 transition-all duration-300 cursor-pointer"
          >
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider hidden sm:inline">{user.name.split(' ')[0]}</span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 border border-emerald-400/20 flex items-center justify-center text-white text-xs font-black shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-305 ${dropdownOpen ? 'rotate-180 text-slate-600' : ''}`} />
          </button>

          {/* Dropdown Box */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2.5 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-100/50 p-1.5 z-55 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="px-3 py-2 text-left border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate leading-none">{user.name}</p>
                <p className="text-[9px] text-slate-400 truncate mt-1 leading-none">{user.email}</p>
              </div>

              {/* Items */}
              <button
                onClick={() => { setDropdownOpen(false); router.push('/profile'); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-650 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Profile
              </button>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-650 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Settings
              </button>

              <div className="border-t border-slate-150 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-slate-650 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                Log out
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1 shadow-lg z-45 animate-in fade-in slide-in-from-top-2 duration-150">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={`${link.label}-mobile-${index}`}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-905 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
