import React, { useState, useRef, useEffect } from 'react';
import { JournalInteraction, ChatMessage, AIMode, JournalLocation } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LocationModal } from './LocationModal';
import { LocationCard } from './LocationCard';
import { 
  Sparkles, 
  Send, 
  CheckCheck, 
  RefreshCw, 
  Compass, 
  ListOrdered, 
  Lightbulb,
  Bot,
  User as UserIcon,
  HelpCircle,
  Clock,
  MapPin
} from 'lucide-react';

interface JournalEditorProps {
  currentEntry: JournalInteraction;
  onSaveEntry: (entry: JournalInteraction) => Promise<void>;
  userId: string;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

const PROMPT_SUGGESTIONS = [
  "What brought me clarity or energy today, and what felt draining?",
  "I have a tough decision to make regarding my work priorities...",
  "Help me reflect on a recent mistake and reframe what I learned.",
  "Brainstorm 3 habits that could support my mental well-being this week."
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  currentEntry,
  onSaveEntry,
  userId,
  isSaving,
  saveStatus,
}) => {
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState(currentEntry.title || '');
  const [mode, setMode] = useState<AIMode>(currentEntry.mode || 'reflect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if current entry changes
  useEffect(() => {
    setTitle(currentEntry.title || '');
    setMode(currentEntry.mode || 'reflect');
    setInputText('');
    setGenerationError(null);
  }, [currentEntry.id]);

  // Auto-scroll to latest response
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentEntry.messages.length, isGenerating]);

  const handleLocationAttached = async (loc: JournalLocation) => {
    const updated: JournalInteraction = {
      ...currentEntry,
      location: loc,
      updatedAt: new Date().toISOString(),
    };
    await onSaveEntry(updated);
  };

  const handleRemoveLocation = async () => {
    const updated: JournalInteraction = {
      ...currentEntry,
      location: undefined,
      updatedAt: new Date().toISOString(),
    };
    await onSaveEntry(updated);
  };

  // Handle submitting reflection to Gemini API & Firestore
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt ?? inputText).trim();
    if (!promptToSend || isGenerating) return;

    setGenerationError(null);
    setIsGenerating(true);

    const userMessageId = `msg-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: promptToSend,
      timestamp: new Date().toISOString(),
    };

    // Calculate updated title if untitled
    const updatedTitle =
      title.trim() && title !== 'Untitled Reflection'
        ? title.trim()
        : promptToSend.slice(0, 40) + (promptToSend.length > 40 ? '...' : '');

    // Optimistically update entry with user message
    const updatedMessagesWithUser = [...currentEntry.messages, newUserMsg];
    const intermediateEntry: JournalInteraction = {
      ...currentEntry,
      title: updatedTitle,
      mode,
      messages: updatedMessagesWithUser,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Call server-side Express Gemini endpoint (with sanitized location metadata)
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          mode,
          title: updatedTitle,
          location: currentEntry.location || null,
          history: currentEntry.messages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      const aiResponseText = result.response || 'No response generated.';
      const modelUsed = result.modelUsed || 'gemini-3.6-flash';

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: aiResponseText,
        timestamp: new Date().toISOString(),
        modelUsed,
      };

      const finalMessages = [...updatedMessagesWithUser, aiMessage];
      const finalEntry: JournalInteraction = {
        ...intermediateEntry,
        messages: finalMessages,
        summary: mode === 'summarize' ? aiResponseText.slice(0, 180) + '...' : currentEntry.summary,
        updatedAt: new Date().toISOString(),
      };

      // Guaranteed Transaction Verification: persist user prompt + Gemini output to Firestore
      await onSaveEntry(finalEntry);

      // Only clear input buffer once transaction has successfully verified and saved
      setInputText('');
      setTitle(updatedTitle);
    } catch (err: any) {
      console.error('Failed to process and persist reflection:', err);
      setGenerationError(err.message || 'Failed to complete reflection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTitleBlur = () => {
    if (title !== currentEntry.title) {
      onSaveEntry({
        ...currentEntry,
        title: title.trim() || 'Untitled Reflection',
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
      {/* Top Controls: Title, Mode Selector, Save Status */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex-1 min-w-[200px]">
          <input
            id="journal-entry-title-input"
            type="text"
            placeholder="Name your reflection..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full text-base sm:text-lg font-semibold text-stone-900 border-none bg-transparent focus:outline-hidden focus:ring-0 placeholder-stone-400"
          />
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
          <button
            id="mode-reflect-button"
            type="button"
            onClick={() => setMode('reflect')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'reflect'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>Reflect</span>
          </button>
          <button
            id="mode-summarize-button"
            type="button"
            onClick={() => setMode('summarize')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'summarize'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
            <span>Summarize</span>
          </button>
          <button
            id="mode-brainstorm-button"
            type="button"
            onClick={() => setMode('brainstorm')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'brainstorm'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            <span>Brainstorm</span>
          </button>
        </div>

        {/* Location Trigger Button (if not already attached) */}
        {!currentEntry.location ? (
          <button
            id="open-location-modal-button"
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Attach a location to this reflection"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Attach Location</span>
            <span className="sm:hidden">Location</span>
          </button>
        ) : (
          <button
            id="edit-location-modal-button"
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs truncate max-w-[160px]"
            title="Edit attached location"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">{currentEntry.location.placeName || 'Location'}</span>
          </button>
        )}

        {/* Firestore Sync Badge */}
        <div className="flex items-center text-xs">
          {saveStatus === 'saving' || isSaving ? (
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Saving to Firestore...</span>
            </span>
          ) : saveStatus === 'saved' ? (
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Saved in Firestore</span>
            </span>
          ) : (
            <span className="text-stone-400 text-xs">Auto-synced</span>
          )}
        </div>
      </div>

      {/* Attached Location Banner & Interactive Map Viewer */}
      {currentEntry.location && (
        <div className="px-4 sm:px-6 py-2.5 bg-emerald-50/40 border-b border-emerald-100/80">
          <LocationCard
            location={currentEntry.location}
            onRemoveLocation={handleRemoveLocation}
            onEditLocation={() => setIsLocationModalOpen(true)}
          />
        </div>
      )}

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {currentEntry.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Begin your reflection</h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
              Write down whatever is on your mind—a work victory, an emotional challenge, or a daily observation. Gemini 3.6 Flash will reflect, summarize, or brainstorm with you.
            </p>

            {/* Quick Inspiration Prompts */}
            <div className="mt-8 text-left">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Prompt Starters
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    id={`prompt-starter-${idx}`}
                    type="button"
                    onClick={() => {
                      setInputText(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 text-xs text-left bg-white hover:bg-amber-50/50 border border-stone-200 hover:border-amber-300 rounded-xl transition text-stone-700 leading-snug cursor-pointer"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          currentEntry.messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`max-w-3xl mx-auto flex gap-3 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 sm:p-5 shadow-2xs text-sm ${
                    isUser
                      ? 'bg-amber-600 text-white rounded-br-xs'
                      : 'bg-white text-stone-900 border border-stone-200 rounded-bl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2 pb-1 border-b border-black/5 text-[11px] opacity-75">
                    <span className="font-medium flex items-center gap-1">
                      {isUser ? (
                        <>
                          <UserIcon className="w-3 h-3" /> You
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3" /> Gemini
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {!isUser && message.modelUsed && (
                        <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          {message.modelUsed}
                        </span>
                      )}
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-white text-sm">
                      {message.text}
                    </p>
                  ) : (
                    <MarkdownRenderer content={message.text} />
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-1">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Streaming / Generation Indicator */}
        {isGenerating && (
          <div className="max-w-3xl mx-auto flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-2 text-xs text-stone-600">
              <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>Gemini is reflecting on your entry...</span>
            </div>
          </div>
        )}

        {/* Generation Error Callout with Retry */}
        {generationError && (
          <div
            id="generation-error-banner"
            className="max-w-3xl mx-auto p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-semibold">Unable to complete reflection</p>
              <p className="mt-0.5">{generationError}</p>
            </div>
            <button
              id="retry-generation-button"
              type="button"
              onClick={() => handleSendMessage()}
              className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Tray */}
      <div className="bg-white border-t border-stone-200 p-4 sm:p-5">
        <div className="max-w-3xl mx-auto">
          <div className="relative border border-stone-300 rounded-xl shadow-2xs focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 bg-white transition">
            <textarea
              id="journal-input-textarea"
              ref={textareaRef}
              rows={3}
              placeholder={
                mode === 'summarize'
                  ? "Paste thoughts or reflections to generate an executive summary..."
                  : mode === 'brainstorm'
                  ? "Describe a goal or puzzle you'd like creative brainstorming on..."
                  : "Write your reflection or question here... (Press Cmd+Enter or click Send)"
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              className="w-full p-3.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 bg-transparent border-none resize-none focus:outline-hidden"
            />

            <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-stone-100">
              <span className="text-[11px] text-stone-400 hidden sm:inline">
                Press <kbd className="px-1 py-0.5 bg-stone-100 rounded text-stone-600 font-mono text-[10px]">Cmd+Enter</kbd> to submit
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  id="send-reflection-button"
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 active:bg-black text-white text-xs font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reflection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Modal with User Permission and Consent Handling */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationAttached={handleLocationAttached}
        existingLocation={currentEntry.location}
      />
    </div>
  );
};
