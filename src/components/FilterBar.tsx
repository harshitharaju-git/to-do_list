import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  type TaskCategory,
  type TaskPriority,
  type TaskSortOption,
  type TaskViewFilter,
} from '../types/task';

interface FilterBarProps {
  activeView: TaskViewFilter;
  onChangeView: (view: TaskViewFilter) => void;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  priorityFilter: TaskPriority | 'All';
  onChangePriority: (priority: TaskPriority | 'All') => void;
  categoryFilter: TaskCategory | 'All';
  onChangeCategory: (category: TaskCategory | 'All') => void;
  sortBy: TaskSortOption;
  onChangeSort: (sort: TaskSortOption) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  resultCount: number;
}

const VIEW_TABS: Array<{ id: TaskViewFilter; label: string }> = [
  { id: 'all', label: 'All Tasks' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'today', label: "Today's Tasks" },
];

export function FilterBar({
  activeView,
  onChangeView,
  searchQuery,
  onChangeSearch,
  priorityFilter,
  onChangePriority,
  categoryFilter,
  onChangeCategory,
  sortBy,
  onChangeSort,
  hasActiveFilters,
  onClearFilters,
  resultCount,
}: FilterBarProps) {
  return (
    <section
      aria-label="Search, filter, and sort tasks"
      className="bg-white border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
    >
      {/* Top row: Segmented View Filter + Result Count */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Task status views"
          className="inline-flex items-center gap-1 p-1 bg-indigo-50/80 border border-indigo-100 rounded-xl overflow-x-auto max-w-full"
        >
          {VIEW_TABS.map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChangeView(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'text-indigo-900/70 hover:text-indigo-950 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 tabular-nums whitespace-nowrap">
          Showing <span className="font-semibold text-indigo-700">{resultCount}</span>{' '}
          {resultCount === 1 ? 'task' : 'tasks'}
        </p>
      </div>

      {/* Bottom row: Search + Priority + Category + Sort + Clear */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="sm:col-span-2 lg:col-span-4 relative">
          <Search
            className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search tasks by title..."
            aria-label="Search tasks by title"
            className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onChangeSearch('')}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="lg:col-span-2">
          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => onChangePriority(e.target.value as TaskPriority | 'All')}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
          >
            <option value="All">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-2">
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => onChangeCategory(e.target.value as TaskCategory | 'All')}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
          >
            <option value="All">All Categories</option>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400 shrink-0 hidden xl:block" aria-hidden="true" />
          <select
            aria-label="Sort tasks"
            value={sortBy}
            onChange={(e) => onChangeSort(e.target.value as TaskSortOption)}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
          >
            <option value="due_date_asc">Sort: Due Date (Earliest)</option>
            <option value="due_date_desc">Sort: Due Date (Latest)</option>
            <option value="priority_desc">Sort: Priority (High to Low)</option>
            <option value="created_desc">Sort: Recently Added</option>
          </select>
        </div>

        {/* Clear Button */}
        <div className="lg:col-span-1 flex justify-end">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="w-full lg:w-auto h-10 px-3 rounded-lg border border-indigo-200 bg-indigo-50/70 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}
