'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Brain, ChevronDown, User, Settings, LogOut } from 'lucide-react';
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200/80 shadow-xs h-16 flex items-center">
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        
        {/* Brand Logo - ResearchMind styling */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-emerald-500 text-white p-1.5 rounded-[6px] shadow-[0_4px_12px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform">
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-950">
            ResearchMind
          </span>
        </Link>

        {/* Desktop Nav Links (Classy, simple Shadcn style) */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link, index) => {
            // Match active states. Since some point to same page, we can highlight the matching one.
            const isActive = pathname === link.href;
            return (
              <Link
                key={`${link.label}-${index}`}
                href={link.href}
                className={`text-xs font-semibold tracking-tight transition-colors py-1.5 px-3 rounded-md ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User Profile Dropdown Menu (Shadcn style) */}
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-zinc-55/10 focus:outline-none transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 text-xs font-extrabold select-none shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Box */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg p-1.5 z-55 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="px-3 py-2 text-left border-b border-zinc-100 mb-1">
                <p className="text-xs font-bold text-zinc-900 truncate leading-none">{user.name}</p>
                <p className="text-[10px] text-zinc-400 truncate mt-1 leading-none">{user.email}</p>
              </div>

              {/* Items */}
              <button
                onClick={() => { setDropdownOpen(false); router.push('/profile'); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-900 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Profile
              </button>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-900 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                Settings
              </button>

              <div className="border-t border-zinc-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-zinc-650 hover:text-red-650 rounded-lg text-xs font-bold transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                Log out
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 transition-colors"
            aria-label="Open menu"
          >
            <div className="space-y-1.5">
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 border-t border-zinc-200 bg-white px-4 py-3 space-y-1 shadow-lg z-45">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={`${link.label}-mobile-${index}`}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 font-bold'
                    : 'text-zinc-600 hover:bg-zinc-50'
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
