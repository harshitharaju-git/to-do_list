import {
  Briefcase,
  CalendarClock,
  CheckSquare,
  CircleDot,
  GraduationCap,
  Layers,
  LogOut,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  TASK_CATEGORIES,
  type AuthUser,
  type TaskCategory,
  type TaskViewFilter,
} from '../types/task';

interface SidebarProps {
  user: AuthUser;
  onSignOut: () => void;
  activeView: TaskViewFilter;
  onSelectView: (view: TaskViewFilter) => void;
  activeCategory: TaskCategory | 'All';
  onSelectCategory: (category: TaskCategory | 'All') => void;
  counts: {
    all: number;
    today: number;
    pending: number;
    completed: number;
    byCategory: Record<TaskCategory, number>;
  };
  completionRate: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

function getCategoryMeta(category: TaskCategory): {
  icon: typeof Briefcase;
  iconColor: string;
} {
  switch (category) {
    case 'Work':
      return { icon: Briefcase, iconColor: 'text-sky-400' };
    case 'Academic':
      return { icon: GraduationCap, iconColor: 'text-fuchsia-400' };
    case 'Personal':
      return { icon: User, iconColor: 'text-teal-400' };
    case 'Other':
      return { icon: Sparkles, iconColor: 'text-amber-400' };
  }
}

export function Sidebar({
  user,
  onSignOut,
  activeView,
  onSelectView,
  activeCategory,
  onSelectCategory,
  counts,
  completionRate,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: TaskViewFilter;
    label: string;
    count: number;
    icon: typeof Layers;
    accent: string;
  }> = [
    { id: 'all', label: 'All Tasks', count: counts.all, icon: Layers, accent: 'text-indigo-300' },
    { id: 'today', label: "Today's Tasks", count: counts.today, icon: CalendarClock, accent: 'text-sky-300' },
    { id: 'pending', label: 'Pending Tasks', count: counts.pending, icon: CircleDot, accent: 'text-amber-300' },
    { id: 'completed', label: 'Completed Tasks', count: counts.completed, icon: CheckSquare, accent: 'text-emerald-300' },
  ];

  const handleViewClick = (view: TaskViewFilter) => {
    onSelectView(view);
    onCloseMobile();
  };

  const handleCategoryClick = (category: TaskCategory | 'All') => {
    onSelectCategory(category);
    onCloseMobile();
  };

  const userInitial = user.name.trim().charAt(0).toUpperCase() || 'U';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-white w-[264px] select-none border-r border-indigo-900/60">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <CheckSquare className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
            TaskFlow
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 text-indigo-200 hover:text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav aria-label="Task views and categories" className="flex-1 overflow-y-auto px-3 py-5 space-y-7">
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-indigo-300/90 tracking-wide">
            Views
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleViewClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                        : 'text-indigo-100/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 whitespace-nowrap">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : item.accent
                        }`}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isActive ? 'text-white font-semibold' : 'text-indigo-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs font-semibold text-indigo-300/90 tracking-wide">
              Categories
            </p>
            {activeCategory !== 'All' && (
              <button
                type="button"
                onClick={() => handleCategoryClick('All')}
                className="text-xs font-medium text-sky-300 hover:text-sky-200 whitespace-nowrap focus-visible:outline-none focus-visible:underline"
              >
                Show all
              </button>
            )}
          </div>
          <ul className="space-y-1">
            {TASK_CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              const { icon: CategoryIcon, iconColor } = getCategoryMeta(category);
              return (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(isActive ? 'All' : category)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                      isActive
                        ? 'bg-white/15 text-white ring-1 ring-white/25'
                        : 'text-indigo-100/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 whitespace-nowrap">
                      <CategoryIcon
                        className={`w-4 h-4 shrink-0 ${iconColor}`}
                        aria-hidden="true"
                      />
                      <span>{category}</span>
                    </span>
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isActive ? 'text-white font-semibold' : 'text-indigo-300'
                      }`}
                    >
                      {counts.byCategory[category]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Sidebar Progress Summary */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-indigo-200">Completion progress</span>
          <span className="font-mono font-semibold text-emerald-300 tabular-nums">
            {completionRate}%
          </span>
        </div>
        <div
          className="w-full h-2 bg-white/15 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall task completion progress"
        >
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-indigo-200/80 tabular-nums">
          {counts.completed} of {counts.all} tasks completed
        </p>
      </div>

      {/* Authenticated Account Footer */}
      <div className="p-3.5 border-t border-white/10 flex items-center justify-between gap-2 bg-indigo-950/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 text-white font-display text-xs font-bold flex items-center justify-center shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-indigo-200/80 truncate">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-indigo-950/60 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex h-full">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
