import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { Task } from '../types/task';

interface DeleteConfirmModalProps {
  task: Task | null;
  onCancel: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteConfirmModal({ task, onCancel, onConfirm }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!task) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [task, onCancel]);

  if (!task) {
    return null;
  }

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm(task.id);
    setIsDeleting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/55 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white border border-rose-200 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-rose-500 to-amber-500" aria-hidden="true" />
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="delete-modal-title" className="font-display text-base font-semibold text-slate-900">
                Delete Task
              </h2>
              <p id="delete-modal-description" className="mt-1 text-sm text-slate-600">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-slate-900">&ldquo;{task.title}&rdquo;</span>?
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-4 bg-rose-50/50 border-t border-rose-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-sm font-semibold text-white hover:from-rose-700 hover:to-red-700 shadow-sm transition-all whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
