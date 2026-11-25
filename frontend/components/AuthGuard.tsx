'use client';

import { useAuth } from '../lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from './Navbar';
import { Loader2 } from 'lucide-react';

// Pages that don't need auth
const PUBLIC_PATHS = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isOnboarding = pathname === '/get-started';
  const isPublic = pathname === '/' || isOnboarding || pathname.startsWith('/share/') || PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (PUBLIC_PATHS.includes(pathname)) {
      let destination = '/';
      try {
        const allowed = ['/', '/research', '/documents', '/history'];
        const requested = new URLSearchParams(window.location.search).get('next');
        if (requested && allowed.includes(requested)) {
          destination = requested;
          sessionStorage.setItem('rf_onboarding_next', requested);
        } else {
          const saved = sessionStorage.getItem('rf_onboarding_next');
          if (saved && allowed.includes(saved)) destination = saved;
        }
      } catch {
        // The account can still be used when browser storage is unavailable.
      }
      if (user) router.replace(destination);
    } else if (user) {
      try { sessionStorage.removeItem('rf_onboarding_next'); } catch {}
      if (isOnboarding) router.replace('/');
    } else if (!isPublic) {
      router.replace('/login');
    }
  }, [user, loading, pathname, isPublic, isOnboarding, router]);

  // Show spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-700" role="status" aria-label="Loading ResearchFlow" />
      </div>
    );
  }

  // If logged in and on a public-only auth page (like login/register) — show nothing (will redirect)
  if (user && (isOnboarding || PUBLIC_PATHS.includes(pathname))) return null;
  // If not logged in and on a protected page — show nothing (will redirect)
  if (!user && !isPublic) return null;

  if (user && !pathname.startsWith('/share/')) {
    return (
      <div className="rf-workspace">
        <a className="rf-skip-link" href="#workspace-content">Skip to content</a>
        <Navbar />
        <div className="rf-workspace-content" id="workspace-content" tabIndex={-1}>{children}</div>
      </div>
    );
  }

  return <div className={PUBLIC_PATHS.includes(pathname) ? 'rf-auth' : undefined}>{children}</div>;
}
