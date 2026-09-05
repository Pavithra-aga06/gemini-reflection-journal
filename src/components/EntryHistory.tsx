import React, { useState } from 'react';
import { JournalInteraction } from '../types';
import { 
  Search, 
  Calendar, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  ChevronRight, 
  FileText,
  Clock,
  MapPin
} from 'lucide-react';

interface EntryHistoryProps {
  entries: JournalInteraction[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalInteraction) => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  loading: boolean;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = (entry.title || '').toLowerCase().includes(query);
    const matchesSummary = (entry.summary || '').toLowerCase().includes(query);
    const matchesMessages = entry.messages.some((m) => m.text.toLowerCase().includes(query));
    return matchesTitle || matchesSummary || matchesMessages;
  });

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this reflection? This action cannot be undone.')) {
      setDeletingId(entryId);
      try {
        await onDeleteEntry(entryId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-stone-200">
      {/* Header & Search */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-500" />
            <span>Journal History</span>
          </h2>
          <span className="text-xs text-stone-600 bg-stone-100 font-medium px-2 py-0.5 rounded-full">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search past reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-stone-800 placeholder-stone-400 transition"
          />
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
        {loading && entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            Loading your entries...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            {searchQuery ? (
              <p>No reflections match your search.</p>
            ) : (
              <div>
                <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="font-medium text-stone-600">No reflections yet</p>
                <p className="mt-1 text-stone-400">Write your first journal entry to begin.</p>
              </div>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            const firstMsg = entry.messages[0]?.text || '';
            const previewText = entry.summary || firstMsg;

            return (
              <div
                key={entry.id}
                id={`history-item-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`p-3.5 text-left transition cursor-pointer group flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-amber-50/60 border-l-4 border-l-amber-500'
                    : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-semibold text-stone-900 truncate flex-1">
                    {entry.title || 'Untitled Reflection'}
                  </h3>
                  <button
                    id={`delete-entry-${entry.id}`}
                    type="button"
                    onClick={(e) => handleDelete(e, entry.id)}
                    disabled={deletingId === entry.id}
                    title="Delete reflection"
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                  {previewText || 'Empty entry'}
                </p>

                {entry.location && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-800 bg-emerald-50/80 border border-emerald-200/50 px-2 py-0.5 rounded-md w-fit max-w-full">
                    <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{entry.location.placeName || entry.location.city || 'Location attached'}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2.5 pt-1 text-[11px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.updatedAt || entry.createdAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {entry.messages.length}
                    </span>
                    <span className="capitalize px-1.5 py-0.5 rounded bg-amber-100/60 text-amber-800 text-[10px] font-medium">
                      {entry.mode}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
