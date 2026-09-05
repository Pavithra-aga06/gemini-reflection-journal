import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { JournalInteraction } from '../types';
import { 
  fetchUserInteractions, 
  saveJournalInteraction, 
  deleteJournalInteraction 
} from '../lib/firebase';
import { EntryHistory } from './EntryHistory';
import { JournalEditor } from './JournalEditor';
import { ErrorToast } from './ErrorToast';
import { PanelLeftClose, PanelLeft, Plus } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalInteraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | undefined>(undefined);
  const [showSidebar, setShowSidebar] = useState(true);

  // Helper to create a fresh journal entry template
  const createNewEntryObject = useCallback((): JournalInteraction => {
    return {
      id: `entry-${Date.now()}`,
      userId: user.uid,
      title: 'Untitled Reflection',
      mode: 'reflect',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [user.uid]);

  // Load user's isolated interactions from Firestore
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const items = await fetchUserInteractions(user.uid);
      setEntries(items);
      if (items.length > 0 && !selectedEntry) {
        setSelectedEntry(items[0]);
      } else if (items.length === 0) {
        setSelectedEntry(createNewEntryObject());
      }
    } catch (err: any) {
      console.error('Error loading journal entries:', err);
      setErrorMessage(`Unable to fetch your journal history: ${err?.message || 'Firestore error'}`);
    } finally {
      setLoading(false);
    }
  }, [user.uid, createNewEntryObject, selectedEntry]);

  useEffect(() => {
    loadEntries();
  }, [user.uid]);

  useEffect(() => {
    const handleNewEntryTrigger = () => {
      setSelectedEntry(createNewEntryObject());
    };
    window.addEventListener('app:new-entry', handleNewEntryTrigger);
    return () => window.removeEventListener('app:new-entry', handleNewEntryTrigger);
  }, [createNewEntryObject]);

  // Handle saving an interaction with Guaranteed Transaction Verification
  const handleSaveEntry = async (updatedEntry: JournalInteraction) => {
    setIsSaving(true);
    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      await saveJournalInteraction(user.uid, updatedEntry);
      
      // Update local state smoothly
      setSelectedEntry(updatedEntry);
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === updatedEntry.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = updatedEntry;
          return updated.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        } else {
          return [updatedEntry, ...prev];
        }
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error: any) {
      console.error('Firestore save failure:', error);
      setSaveStatus('error');
      const msg = `Failed to persist reflection to Firestore: ${error?.message || 'Permission or network issue'}`;
      setErrorMessage(msg);

      // Provide retry handler as mandated by Explicit Error Escalation standard
      setRetryAction(() => () => handleSaveEntry(updatedEntry));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle creating a brand new reflection
  const handleStartNewEntry = () => {
    const newEntry = createNewEntryObject();
    setSelectedEntry(newEntry);
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteJournalInteraction(user.uid, entryId);
      const remaining = entries.filter((e) => e.id !== entryId);
      setEntries(remaining);
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(remaining.length > 0 ? remaining[0] : createNewEntryObject());
      }
    } catch (err: any) {
      setErrorMessage(`Failed to delete reflection: ${err?.message || 'Unknown error'}`);
    }
  };

  const activeEntry = selectedEntry || createNewEntryObject();

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Collapsible Sidebar / History Drawer */}
      <aside
        className={`${
          showSidebar ? 'w-80 min-w-[280px]' : 'w-0'
        } transition-all duration-200 ease-in-out shrink-0 overflow-hidden relative z-20 border-r border-stone-200 hidden md:flex flex-col`}
      >
        <EntryHistory
          entries={entries}
          selectedEntryId={activeEntry.id}
          onSelectEntry={(entry) => setSelectedEntry(entry)}
          onDeleteEntry={handleDeleteEntry}
          loading={loading}
        />
      </aside>

      {/* Main Journal Working Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Toggle Sidebar Button */}
        <div className="absolute top-3.5 left-4 z-30 hidden md:block">
          <button
            id="toggle-sidebar-button"
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-lg shadow-2xs hover:bg-stone-50 transition cursor-pointer"
            title={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile History View Trigger */}
        <div className="md:hidden bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-600 font-medium truncate max-w-[200px]">
            {activeEntry.title || 'Untitled'}
          </span>
          <button
            id="mobile-new-entry-button"
            type="button"
            onClick={handleStartNewEntry}
            className="flex items-center gap-1 text-amber-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            New Reflection
          </button>
        </div>

        <JournalEditor
          key={activeEntry.id}
          currentEntry={activeEntry}
          onSaveEntry={handleSaveEntry}
          userId={user.uid}
          isSaving={isSaving}
          saveStatus={saveStatus}
        />
      </div>

      {/* Global Error Banner / Toast with Retry */}
      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onRetry={retryAction}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
};
