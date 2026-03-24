import React from 'react';
import { FileText, Clock } from 'lucide-react';
import { ResearchHistoryItem } from '../types/research';
import Badge from './Badge';

interface RecentResearchProps {
  history: ResearchHistoryItem[];
}

const RecentResearch: React.FC<RecentResearchProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-400">
        No recent research found. Start your first research task above!
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <Clock className="w-5 h-5" /> Recent Research
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
        {history.map((item) => (
          <div 
            key={item.session_id} 
            className="group p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {item.query}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge score={item.quality_score} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentResearch;
