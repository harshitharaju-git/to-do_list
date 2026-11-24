import { AlertTriangle, CheckCircle2, Clock, Layers } from 'lucide-react';

interface StatsBarProps {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export function StatsBar({
  total,
  pending,
  completed,
  overdue,
  completionRate,
}: StatsBarProps) {
  return (
    <section
      aria-label="Task statistics and progress overview"
      className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-indigo-100">
        {/* Total */}
        <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-900/70">Total Tasks</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-indigo-950 tabular-nums">
            {total}
          </p>
          <p className="mt-1 text-xs text-slate-600">All tracked items</p>
        </div>

        {/* Pending */}
        <div className="p-5 bg-gradient-to-br from-amber-50/70 to-white border-l border-indigo-100 lg:border-l-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-900/75">Pending</p>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-950 tabular-nums">
            {pending}
          </p>
          <p className="mt-1 text-xs text-slate-600">In progress or queued</p>
        </div>

        {/* Completed */}
        <div className="p-5 bg-gradient-to-br from-emerald-50/70 to-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-900/75">Completed</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {completed}
          </p>
          <p className="mt-1 text-xs text-slate-600">Finished tasks</p>
        </div>

        {/* Overdue */}
        <div className="p-5 bg-gradient-to-br from-rose-50/70 to-white border-l border-indigo-100 lg:border-l-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-900/75">Overdue</p>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                overdue > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p
            className={`mt-2 font-display text-2xl font-bold tabular-nums ${
              overdue > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdue}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {overdue > 0 ? 'Needs immediate attention' : 'All deadlines on track'}
          </p>
        </div>
      </div>

      {/* Colorful Progress Overview */}
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/60 via-violet-50/60 to-emerald-50/60 border-t border-indigo-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0">
          <span className="text-xs font-semibold text-indigo-950">Progress Overview</span>
          <span className="font-mono text-xs font-semibold text-violet-700 tabular-nums">
            {completed}/{total} ({completionRate}%)
          </span>
        </div>
        <div
          className="flex-1 h-2.5 bg-white border border-indigo-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Task completion percentage"
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </section>
  );
}
