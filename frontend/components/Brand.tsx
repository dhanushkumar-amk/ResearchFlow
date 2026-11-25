import Link from 'next/link';
import { Layers3 } from 'lucide-react';

export default function Brand({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`rf-brand ${className}`}>
      <span className="rf-brand-mark"><Layers3 size={19} aria-hidden="true" /></span>
      <span>ResearchFlow</span>
    </Link>
  );
}
