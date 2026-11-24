import { useEffect, useState, type FormEvent } from 'react';
import { Save, X } from 'lucide-react';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput,
} from '../types/task';

interface EditTaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (id: number, input: UpdateTaskInput) => Promise<boolean>;
}

export function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState<TaskCategory>('Personal');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setDueDate(task.due_date ?? '');
      setPriority(task.priority);
      setCategory(task.category);
      setStatus(task.status);
      setValidationError(null);
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [task, onClose]);

  if (!task) {
    return null;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Task title is required and cannot be empty.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setValidationError('Task title must be 200 characters or fewer.');
      return;
    }

    setValidationError(null);
    setIsSaving(true);

    const ok = await onSave(task.id, {
      title: trimmedTitle,
      description: description.trim(),
      due_date: dueDate || null,
      priority,
      category,
      status,
    });

    setIsSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-indigo-100 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400" aria-hidden="true" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-100 bg-indigo-50/40">
          <h2 id="edit-task-modal-title" className="font-display text-lg font-semibold text-slate-900">
            Edit Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit dialog"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div>
            <label htmlFor="edit-task-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Task Title <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <input
              id="edit-task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError(null);
              }}
              maxLength={200}
              required
              autoFocus
              aria-invalid={Boolean(validationError)}
              className={`w-full h-10 px-3 rounded-lg border text-sm text-slate-900 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 ${
                validationError ? 'border-rose-500' : 'border-slate-300'
              }`}
            />
            {validationError && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                {validationError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="edit-task-description" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              id="edit-task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Optional task details..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:bg-white resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-task-due-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Due Date
              </label>
              <input
                id="edit-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:bg-white font-mono tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
              />
            </div>

            <div>
              <label htmlFor="edit-task-status" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status
              </label>
              <select
                id="edit-task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-task-priority" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                id="edit-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-task-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="edit-task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-indigo-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 px-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 shadow-sm transition-all whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
