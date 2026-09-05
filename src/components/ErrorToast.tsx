import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

interface ErrorToastProps {
  message: string;
  onRetry?: () => void;
  onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onRetry, onClose }) => {
  return (
    <div
      id="error-notification-toast"
      className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-rose-200 rounded-xl shadow-xl p-4 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-3"
      role="alert"
    >
      <div className="p-1 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-semibold text-stone-900">Operation Notice</p>
        <p className="text-stone-600 mt-0.5 leading-snug">{message}</p>
        {onRetry && (
          <button
            id="retry-action-button"
            type="button"
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Save
          </button>
        )}
      </div>
      <button
        id="dismiss-error-toast"
        type="button"
        onClick={onClose}
        className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition cursor-pointer"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
