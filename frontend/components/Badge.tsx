import React from 'react';

interface BadgeProps {
  score?: number | null;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  children?: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ score, variant, children, className = '' }) => {
  // Original score-based logic (Legacy support)
  if (score !== undefined && score !== null) {
    let colorClass = 'bg-gray-100 text-gray-700';
    if (score >= 8) {
      colorClass = 'bg-green-100 text-green-700 border-green-200';
    } else if (score >= 6) {
      colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    } else {
      colorClass = 'bg-red-100 text-red-700 border-red-200';
    }

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}>
        {score}/10
      </span>
    );
  }

  // Variant-based logic
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    default: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const currentVariant = variant ? variants[variant] : variants.default;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentVariant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
