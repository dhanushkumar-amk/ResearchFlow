'use client';

import { useAuth } from '../lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Pages that don't need auth
const PUBLIC_PATHS = ['/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!user && !isPublic) {
      router.push('/login');
    }
    if (user && isPublic) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  // Show spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // If logged in and on a public page — show nothing (will redirect)
  if (user && isPublic) return null;
  // If not logged in and on a protected page — show nothing (will redirect)
  if (!user && !isPublic) return null;

  return <>{children}</>;
}
