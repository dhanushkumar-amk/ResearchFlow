import React from 'react';

interface BadgeProps {
  score: number | null;
}

const Badge: React.FC<BadgeProps> = ({ score }) => {
  if (score === null) return null;

  let colorClass = 'bg-gray-100 text-gray-700';
  if (score >= 8) {
    colorClass = 'bg-green-100 text-green-700 border-green-200';
  } else if (score >= 6) {
    colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
  } else {
    colorClass = 'bg-red-100 text-red-700 border-red-200';
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {score}/10
    </span>
  );
};

export default Badge;
