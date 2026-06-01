'use client';

import React from 'react';
import { useAuth } from '../../lib/AuthContext';
import { User, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white pt-20">
      <main className="max-w-xl mx-auto px-6 py-12 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-550" />
          </Link>
          <h1 className="text-xl font-bold text-zinc-950">Profile Details</h1>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 text-2xl font-extrabold shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{user.name}</h2>
              <p className="text-xs text-zinc-400">Researcher Profile</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-zinc-650">
              <User className="w-4 h-4 text-zinc-400" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Full Name</p>
                <p className="font-semibold text-zinc-955 mt-0.5">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-650">
              <Mail className="w-4 h-4 text-zinc-400" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Email Address</p>
                <p className="font-semibold text-zinc-955 mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
