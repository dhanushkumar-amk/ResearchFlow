import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
        <Search className="w-6 h-6" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask anything... e.g., What are the latest trends in AI agents?"
        className="w-full pl-16 pr-32 py-5 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-lg text-zinc-900 dark:text-zinc-100 transition-all shadow-lg hover:shadow-xl"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white font-semibold flex items-center gap-2 px-8 py-3 rounded-xl transition-all shadow-md active:scale-95"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Research'
        )}
      </button>
    </form>
  );
};

export default SearchInput;
