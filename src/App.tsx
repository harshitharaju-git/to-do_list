import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ClipboardList, LogOut, Menu, Plus, RefreshCw } from 'lucide-react';
import {
  ApiError,
  createTaskApi,
  deleteTaskApi,
  fetchTasks,
  getTodayLocalISO,
  isTaskDueToday,
  isTaskOverdue,
  updateTaskApi,
} from './api/tasks';
import { AuthScreen } from './components/AuthScreen';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EditTaskModal } from './components/EditTaskModal';
import { FilterBar } from './components/FilterBar';
import { Sidebar } from './components/Sidebar';
import { StatsBar } from './components/StatsBar';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import { ToastContainer, type ToastItem } from './components/ToastContainer';
import {
  TASK_CATEGORIES,
  type AuthResponse,
  type AuthUser,
  type CreateTaskInput,
  type Task,
  type TaskCategory,
  type TaskPriority,
  type TaskSortOption,
  type TaskViewFilter,
  type UpdateTaskInput,
} from './types/task';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getViewLabel(view: TaskViewFilter): string {
  switch (view) {
    case 'all':
      return 'All Tasks';
    case 'pending':
      return 'Pending Tasks';
    case 'completed':
      return 'Completed Tasks';
    case 'today':
      return "Today's Tasks";
  }
}

export default function App() {
  // Hold Bearer token and user strictly in React memory (never localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<TaskViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<TaskSortOption>('due_date_asc');

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(1);
  const addTitleInputRef = useRef<HTMLInputElement | null>(null);

  const todayISO = getTodayLocalISO();
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleSignOut = useCallback(
    (reason?: string) => {
      setAuthToken(null);
      setCurrentUser(null);
      setTasks([]);
      setEditingTask(null);
      setDeletingTask(null);
      setIsMobileSidebarOpen(false);
      setActiveView('all');
      setSearchQuery('');
      setPriorityFilter('All');
      setCategoryFilter('All');
      addToast('success', reason ?? 'Signed out successfully.');
    },
    [addToast]
  );

  const loadAllTasks = useCallback(
    async (token: string) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchTasks(token);
        setTasks(data);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          handleSignOut('Session expired. Please sign in again.');
          return;
        }
        const msg = error instanceof Error ? error.message : 'Unable to load tasks.';
        setLoadError(msg);
        addToast('error', msg);
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, handleSignOut]
  );

  useEffect(() => {
    if (authToken) {
      loadAllTasks(authToken);
    }
  }, [authToken, loadAllTasks]);

  const handleAuthenticated = (auth: AuthResponse, isNewAccount: boolean) => {
    setAuthToken(auth.token);
    setCurrentUser(auth.user);
    addToast(
      'success',
      isNewAccount
        ? `Welcome to TaskFlow, ${auth.user.name}!`
        : `Welcome back, ${auth.user.name}.`
    );
  };

  const handleAddTask = async (input: CreateTaskInput): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const created = await createTaskApi(authToken, input);
      setTasks((prev) => [created, ...prev]);
      addToast('success', 'Task added successfully.');
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleSignOut('Session expired. Please sign in again.');
        return false;
      }
      const msg = error instanceof Error ? error.message : 'Failed to create task.';
      addToast('error', msg);
      return false;
    }
  };

  const handleUpdateTask = async (id: number, input: UpdateTaskInput): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const updated = await updateTaskApi(authToken, id, input);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      addToast('success', 'Task updated successfully.');
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleSignOut('Session expired. Please sign in again.');
        return false;
      }
      const msg = error instanceof Error ? error.message : 'Failed to update task.';
      addToast('error', msg);
      return false;
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!authToken) return;
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const updated = await updateTaskApi(authToken, task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      addToast(
        'success',
        nextStatus === 'Completed' ? 'Task marked as completed.' : 'Task reopened as pending.'
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleSignOut('Session expired. Please sign in again.');
        return;
      }
      const msg = error instanceof Error ? error.message : 'Failed to update task status.';
      addToast('error', msg);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    if (!authToken) return;
    try {
      await deleteTaskApi(authToken, id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setDeletingTask(null);
      addToast('success', 'Task deleted successfully.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleSignOut('Session expired. Please sign in again.');
        return;
      }
      const msg = error instanceof Error ? error.message : 'Failed to delete task.';
      addToast('error', msg);
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    let today = 0;

    const byCategory: Record<TaskCategory, number> = {
      Personal: 0,
      Academic: 0,
      Work: 0,
      Other: 0,
    };

    for (const task of tasks) {
      if (task.status === 'Completed') {
        completed += 1;
      } else {
        pending += 1;
      }
      if (isTaskOverdue(task, todayISO)) {
        overdue += 1;
      }
      if (isTaskDueToday(task, todayISO)) {
        today += 1;
      }
      if (TASK_CATEGORIES.includes(task.category)) {
        byCategory[task.category] += 1;
      }
    }

    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      pending,
      completed,
      overdue,
      today,
      byCategory,
      completionRate,
    };
  }, [tasks, todayISO]);

  const filteredAndSortedTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (activeView === 'pending' && task.status !== 'Pending') return false;
      if (activeView === 'completed' && task.status !== 'Completed') return false;
      if (activeView === 'today' && !isTaskDueToday(task, todayISO)) return false;

      if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
      if (categoryFilter !== 'All' && task.category !== categoryFilter) return false;
      if (query && !task.title.toLowerCase().includes(query)) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'due_date_asc') {
        if (!a.due_date && !b.due_date) return b.id - a.id;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      }
      if (sortBy === 'due_date_desc') {
        if (!a.due_date && !b.due_date) return b.id - a.id;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        if (a.due_date !== b.due_date) return b.due_date.localeCompare(a.due_date);
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      }
      if (sortBy === 'priority_desc') {
        const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (diff !== 0) return diff;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return b.id - a.id;
      }
      return b.id - a.id;
    });
  }, [tasks, activeView, searchQuery, priorityFilter, categoryFilter, sortBy, todayISO]);

  const hasActiveFilters =
    activeView !== 'all' ||
    searchQuery.trim() !== '' ||
    priorityFilter !== 'All' ||
    categoryFilter !== 'All';

  const handleClearFilters = () => {
    setActiveView('all');
    setSearchQuery('');
    setPriorityFilter('All');
    setCategoryFilter('All');
  };

  const focusAddTaskInput = () => {
    addTitleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      addTitleInputRef.current?.focus();
    }, 150);
  };

  if (!authToken || !currentUser) {
    return (
      <>
        <AuthScreen onAuthenticated={handleAuthenticated} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const firstName = currentUser.name.split(' ')[0] || currentUser.name;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50/70 via-slate-50 to-sky-50/70 text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        user={currentUser}
        onSignOut={() => handleSignOut()}
        activeView={activeView}
        onSelectView={setActiveView}
        activeCategory={categoryFilter}
        onSelectCategory={setCategoryFilter}
        counts={{
          all: stats.total,
          today: stats.today,
          pending: stats.pending,
          completed: stats.completed,
          byCategory: stats.byCategory,
        }}
        completionRate={stats.completionRate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur border-b border-indigo-100 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-indigo-700 hover:text-indigo-950 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0 truncate">
              <span className="text-indigo-500 font-medium hidden sm:inline">Workspace</span>
              <span className="text-indigo-200 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-display font-semibold text-slate-900 truncate">
                {getViewLabel(activeView)}
                {categoryFilter !== 'All' ? ` · ${categoryFilter}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={focusAddTaskInput}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-semibold text-white hover:from-indigo-700 hover:to-violet-700 shadow-sm transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>New Task</span>
            </button>

            <button
              type="button"
              onClick={() => handleSignOut()}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            >
              <LogOut className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="flex-1 w-full max-w-[1160px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* 1. Colorful Welcome Banner */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 p-6 sm:p-7 text-white shadow-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-24 -bottom-20 w-48 h-48 rounded-full bg-teal-300/15"
            />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-indigo-100 mb-1.5">
                  <CalendarDays className="w-4 h-4 text-sky-200" aria-hidden="true" />
                  <span>{formattedToday}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="mt-1.5 text-sm text-indigo-100">
                  <span className="tabular-nums font-semibold text-white">
                    {stats.pending} pending
                  </span>
                  {' · '}
                  <span className="tabular-nums font-semibold text-emerald-200">
                    {stats.completed} completed
                  </span>
                  {stats.overdue > 0 && (
                    <>
                      {' · '}
                      <span className="tabular-nums font-semibold text-rose-200">
                        {stats.overdue} overdue
                      </span>
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={focusAddTaskInput}
                className="self-start sm:self-center h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Task</span>
              </button>
            </div>
          </section>

          {/* 2. Task Statistics & Progress Overview */}
          <StatsBar
            total={stats.total}
            pending={stats.pending}
            completed={stats.completed}
            overdue={stats.overdue}
            completionRate={stats.completionRate}
          />

          {/* 3. Add Task Section */}
          <TaskForm onAddTask={handleAddTask} titleInputRef={addTitleInputRef} />

          {/* 4. Search & Filter Bar */}
          <FilterBar
            activeView={activeView}
            onChangeView={setActiveView}
            searchQuery={searchQuery}
            onChangeSearch={setSearchQuery}
            priorityFilter={priorityFilter}
            onChangePriority={setPriorityFilter}
            categoryFilter={categoryFilter}
            onChangeCategory={setCategoryFilter}
            sortBy={sortBy}
            onChangeSort={setSortBy}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            resultCount={filteredAndSortedTasks.length}
          />

          {/* 5. Task List */}
          <section aria-label="Task list" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
                {[1, 2, 3].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="bg-white border border-indigo-100 rounded-2xl p-5 animate-pulse"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 shrink-0" />
                      <div className="flex-1 space-y-2.5">
                        <div className="h-4 bg-indigo-100 rounded w-1/3" />
                        <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/2 mt-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
                <p className="font-display text-base font-semibold text-slate-900">
                  Unable to load tasks
                </p>
                <p className="mt-1 text-sm text-slate-600">{loadError}</p>
                <button
                  type="button"
                  onClick={() => loadAllTasks(authToken)}
                  className="mt-4 h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  <span>Retry</span>
                </button>
              </div>
            ) : filteredAndSortedTasks.length === 0 ? (
              <div className="bg-white border border-indigo-100 rounded-2xl p-10 text-center shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <ClipboardList className="w-6 h-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-base font-semibold text-slate-900">
                  {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks found'}
                </h2>
                <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
                  {tasks.length === 0
                    ? 'Get started by adding your first task above to organize your day and track your progress.'
                    : 'No tasks match your current search query or filters. Try adjusting or clearing your filters.'}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="h-10 px-4 rounded-lg border border-indigo-200 bg-indigo-50 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                    >
                      Clear Search &amp; Filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={focusAddTaskInput}
                      className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Create First Task</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  todayISO={todayISO}
                  onToggleComplete={handleToggleComplete}
                  onEdit={setEditingTask}
                  onDelete={setDeletingTask}
                />
              ))
            )}
          </section>
        </main>
      </div>

      {/* Modals & Toasts */}
      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
      />

      <DeleteConfirmModal
        task={deletingTask}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
