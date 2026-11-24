import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Check,
  Edit3,
  Flag,
  GraduationCap,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { formatDueDateLabel, isTaskDueToday, isTaskOverdue } from '../api/tasks';
import type { Task, TaskCategory, TaskPriority } from '../types/task';

interface TaskCardProps {
  task: Task;
  todayISO: string;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function getPriorityStyle(priority: TaskPriority): string {
  switch (priority) {
    case 'High':
      return 'text-rose-700 font-semibold';
    case 'Medium':
      return 'text-amber-700 font-semibold';
    case 'Low':
      return 'text-sky-700 font-medium';
  }
}

function getCategoryVisual(category: TaskCategory): {
  icon: typeof Briefcase;
  textClass: string;
  iconClass: string;
} {
  switch (category) {
    case 'Work':
      return { icon: Briefcase, textClass: 'text-indigo-700 font-medium', iconClass: 'text-indigo-500' };
    case 'Academic':
      return { icon: GraduationCap, textClass: 'text-fuchsia-700 font-medium', iconClass: 'text-fuchsia-500' };
    case 'Personal':
      return { icon: User, textClass: 'text-teal-700 font-medium', iconClass: 'text-teal-500' };
    case 'Other':
      return { icon: Sparkles, textClass: 'text-amber-700 font-medium', iconClass: 'text-amber-500' };
  }
}

export function TaskCard({
  task,
  todayISO,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.status === 'Completed';
  const overdue = isTaskOverdue(task, todayISO);
  const dueToday = !isCompleted && isTaskDueToday(task, todayISO);
  const categoryVisual = getCategoryVisual(task.category);
  const CategoryIcon = categoryVisual.icon;

  return (
    <article
      className={`group rounded-2xl border p-4 sm:p-5 transition-all duration-150 ${
        overdue
          ? 'bg-gradient-to-r from-rose-50/80 to-white border-rose-200 hover:border-rose-300 shadow-sm'
          : isCompleted
            ? 'bg-gradient-to-r from-emerald-50/50 to-slate-50/70 border-emerald-200/80 hover:border-emerald-300'
            : 'bg-white border-indigo-100 hover:border-violet-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Toggle */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          aria-label={
            isCompleted
              ? `Mark "${task.title}" as pending`
              : `Mark "${task.title}" as completed`
          }
          aria-pressed={isCompleted}
          className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
            isCompleted
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-600 text-white shadow-sm hover:from-emerald-600 hover:to-teal-700'
              : 'bg-white border-indigo-300 text-transparent hover:border-violet-600 hover:bg-violet-50'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <h3
                className={`font-display text-base font-semibold leading-snug break-words ${
                  isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                }`}
              >
                {task.title}
              </h3>

              {task.description && (
                <p
                  className={`mt-1 text-sm leading-relaxed break-words ${
                    isCompleted ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit "${task.title}"`}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label={`Delete "${task.title}"`}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/50 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Unboxed Metadata Row with color-coded icons & typographic separators */}
          <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className={`inline-flex items-center gap-1.5 ${categoryVisual.textClass}`}>
              <CategoryIcon className={`w-3.5 h-3.5 ${categoryVisual.iconClass}`} aria-hidden="true" />
              <span>{task.category}</span>
            </span>

            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>

            <span className={`inline-flex items-center gap-1.5 ${getPriorityStyle(task.priority)}`}>
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{task.priority} Priority</span>
            </span>

            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>

            <span
              className={`inline-flex items-center gap-1.5 font-mono tabular-nums ${
                overdue
                  ? 'text-rose-700 font-semibold'
                  : dueToday
                    ? 'text-amber-700 font-semibold'
                    : 'text-slate-600'
              }`}
            >
              {overdue ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
              )}
              <span>
                {formatDueDateLabel(task.due_date, todayISO)}
                {overdue ? ' (Overdue)' : ''}
              </span>
            </span>

            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>

            <span
              className={`font-semibold ${
                isCompleted ? 'text-emerald-700' : 'text-indigo-700'
              }`}
            >
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
