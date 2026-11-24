import { useState, type FormEvent, type RefObject } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  type CreateTaskInput,
  type TaskCategory,
  type TaskPriority,
} from '../types/task';

interface TaskFormProps {
  onAddTask: (input: CreateTaskInput) => Promise<boolean>;
  titleInputRef?: RefObject<HTMLInputElement | null>;
}

export function TaskForm({ onAddTask, titleInputRef }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('Medium');
    setCategory('Work');
    setValidationError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setValidationError('Please enter a task title before saving.');
      titleInputRef?.current?.focus();
      return;
    }

    if (trimmedTitle.length > 200) {
      setValidationError('Task title must be 200 characters or fewer.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    const success = await onAddTask({
      title: trimmedTitle,
      description: description.trim(),
      due_date: dueDate || null,
      priority,
      category,
    });

    setIsSubmitting(false);

    if (success) {
      handleReset();
    }
  };

  return (
    <section
      aria-labelledby="add-task-heading"
      className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400" aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="add-task-heading" className="font-display text-base font-semibold text-slate-900">
              Add New Task
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan your next milestone with priority, category, and target due date.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Task Title */}
            <div className="lg:col-span-6">
              <label htmlFor="new-task-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Task Title <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                ref={titleInputRef}
                id="new-task-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g., Design sprint review & prototype demo"
                maxLength={200}
                required
                aria-invalid={Boolean(validationError)}
                aria-describedby={validationError ? 'new-task-title-error' : undefined}
                className={`w-full h-10 px-3 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 ${
                  validationError ? 'border-rose-500' : 'border-slate-300'
                }`}
              />
              {validationError && (
                <p id="new-task-title-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                  {validationError}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div className="lg:col-span-2">
              <label htmlFor="new-task-due-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Due Date
              </label>
              <input
                id="new-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:bg-white font-mono tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
              />
            </div>

            {/* Priority */}
            <div className="lg:col-span-2">
              <label htmlFor="new-task-priority" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                id="new-task-priority"
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

            {/* Category */}
            <div className="lg:col-span-2">
              <label htmlFor="new-task-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="new-task-category"
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

          {/* Description & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-8">
              <label htmlFor="new-task-description" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                id="new-task-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add helpful context, notes, or checklist items (optional)..."
                maxLength={2000}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
              />
            </div>

            <div className="lg:col-span-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 shadow-sm transition-all whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{isSubmitting ? 'Adding...' : 'Add Task'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
