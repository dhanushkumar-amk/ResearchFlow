'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Clock3, Compass, LayoutGrid, LogOut, Menu, Settings, UserRound, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import Brand from './Brand';
import ObservatoryArt from './ObservatoryArt';

const navigation = [
  { href: '/', label: 'Overview', icon: LayoutGrid },
  { href: '/research', label: 'New research', icon: Compass },
  { href: '/documents', label: 'Library', icon: BookOpen },
  { href: '/history', label: 'History', icon: Clock3 },
];

const accountLinks = [
  { href: '/profile', label: 'Profile', icon: UserRound },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const mobileToggle = useRef<HTMLButtonElement>(null);

  if (!user || pathname.startsWith('/share/')) return null;

  const avatarUrl = user.avatarUrl?.startsWith('/')
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${user.avatarUrl}`
    : user.avatarUrl;

  const renderLinks = (links: typeof navigation) => links.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
    return (
      <Link key={href} href={href} className="rf-nav-link" aria-current={active ? 'page' : undefined} onClick={() => setMenuPath(null)}>
        <Icon size={18} aria-hidden="true" />
        {label}
      </Link>
    );
  });

  return (
    <header className="rf-workspace-header" onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuPath(null);
        mobileToggle.current?.focus();
      }
    }}>
      <div className="rf-workspace-brand">
        <Brand />
        <button
          type="button"
          ref={mobileToggle}
          className="rf-mobile-toggle"
          aria-expanded={menuOpen}
          aria-controls="workspace-navigation"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setMenuPath(menuOpen ? null : pathname)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <nav id="workspace-navigation" className="rf-workspace-navigation" data-open={menuOpen} aria-label="Workspace">
        <div className="rf-nav-group">{renderLinks(navigation)}</div>
        <ObservatoryArt className="rf-nav-landscape" sizes="(max-width: 767px) 100vw, 235px" />
        <div className="rf-nav-group rf-nav-account">
          {renderLinks(accountLinks)}
          <button type="button" className="rf-nav-link" onClick={() => {
            setMenuPath(null);
            logout();
            router.push('/login');
          }}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
          <div className="rf-account-summary">
            <span className="rf-account-initial" aria-hidden="true">
              {avatarUrl ? <Image src={avatarUrl} alt="" width={36} height={36} className="size-full object-cover" unoptimized /> : user.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <strong className="block truncate">{user.name}</strong>
              <span className="block truncate text-xs text-slate-600">{user.email}</span>
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
}
