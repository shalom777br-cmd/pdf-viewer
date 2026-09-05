import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X, Loader2 } from 'lucide-react';
import { SearchMatch } from '../types';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  matches: SearchMatch[];
  isSearching: boolean;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  onClose,
  onSearch,
  matches,
  isSearching,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      if (matches.length > 0) {
        onNextMatch();
      } else {
        onSearch(query);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      onPrevMatch();
    }
  };

  return (
    <div className="absolute top-3 right-4 sm:right-6 z-40 bg-white rounded-lg shadow-lg border border-[#E8E1D9] p-2 flex items-center gap-2 text-xs select-none max-w-sm w-full">
      <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-1.5 min-w-0">
        <Search className="w-3.5 h-3.5 text-[#A09080] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="文書内を検索..."
          className="w-full bg-transparent border-none outline-none text-xs text-[#2A241F] placeholder:text-[#A09080]"
        />
      </form>

      {/* Match indicator / loader */}
      <div className="flex items-center gap-1 text-[11px] text-[#A09080] shrink-0">
        {isSearching ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#BC8F8F]" />
        ) : matches.length > 0 ? (
          <span>
            {currentMatchIndex + 1} / {matches.length}
          </span>
        ) : query.trim().length >= 2 ? (
          <span>一致なし</span>
        ) : null}
      </div>

      {/* Steppers */}
      <div className="flex items-center gap-0.5 shrink-0 border-l border-[#E8E1D9] pl-1.5">
        <button
          onClick={onPrevMatch}
          disabled={matches.length === 0}
          className="p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] disabled:opacity-30 transition-colors cursor-pointer"
          title="前の一致 (Shift+Enter)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onNextMatch}
          disabled={matches.length === 0}
          className="p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] disabled:opacity-30 transition-colors cursor-pointer"
          title="次の一致 (Enter)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#A09080] hover:bg-[#F8F5F0] hover:text-[#2A241F] transition-colors cursor-pointer ml-0.5"
          title="検索を閉じる (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
