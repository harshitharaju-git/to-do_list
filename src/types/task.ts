export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskCategory = 'Personal' | 'Academic' | 'Work' | 'Other';
export type TaskStatus = 'Pending' | 'Completed';

export type TaskViewFilter = 'all' | 'pending' | 'completed' | 'today';
export type TaskSortOption = 'due_date_asc' | 'due_date_desc' | 'priority_desc' | 'created_desc';

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  message?: string;
  requiresEmailConfirmation?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface Task {
  id: number;
  user_id?: number | string | null;
  title: string;
  description: string;
  due_date: string | null;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  due_date?: string | null;
  priority: TaskPriority;
  category: TaskCategory;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  due_date?: string | null;
  priority?: TaskPriority;
  category?: TaskCategory;
  status?: TaskStatus;
}

export const TASK_PRIORITIES: readonly TaskPriority[] = ['High', 'Medium', 'Low'] as const;
export const TASK_CATEGORIES: readonly TaskCategory[] = ['Personal', 'Academic', 'Work', 'Other'] as const;
export const TASK_STATUSES: readonly TaskStatus[] = ['Pending', 'Completed'] as const;
