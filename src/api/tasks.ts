import type {
  AuthResponse,
  CreateTaskInput,
  LoginInput,
  RegisterInput,
  Task,
  UpdateTaskInput,
} from '../types/task';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(`Unexpected server response (${response.status}).`, response.status);
  }

  if (!response.ok) {
    const errMessage =
      payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}.`;
    throw new ApiError(errMessage, response.status);
  }

  return payload as T;
}

export async function loginApi(
  input: LoginInput & { mode?: 'local' | 'supabase' }
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });
  return handleJsonResponse<AuthResponse>(res);
}

export async function registerApi(
  input: RegisterInput & { mode?: 'local' | 'supabase' }
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });
  return handleJsonResponse<AuthResponse>(res);
}

export async function fetchTasks(token: string): Promise<Task[]> {
  const res = await fetch('/api/tasks', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleJsonResponse<{ tasks: Task[] }>(res);
  return data.tasks;
}

export async function createTaskApi(token: string, input: CreateTaskInput): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await handleJsonResponse<{ task: Task }>(res);
  return data.task;
}

export async function updateTaskApi(token: string, id: number, input: UpdateTaskInput): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await handleJsonResponse<{ task: Task }>(res);
  return data.task;
}

export async function deleteTaskApi(token: string, id: number): Promise<number> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleJsonResponse<{ id: number }>(res);
  return data.id;
}

export function getTodayLocalISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isTaskOverdue(task: Task, todayISO: string = getTodayLocalISO()): boolean {
  if (task.status === 'Completed' || !task.due_date) {
    return false;
  }
  return task.due_date < todayISO;
}

export function isTaskDueToday(task: Task, todayISO: string = getTodayLocalISO()): boolean {
  return task.due_date === todayISO;
}

export function formatDueDateLabel(dateStr: string | null, todayISO: string = getTodayLocalISO()): string {
  if (!dateStr) {
    return 'No due date';
  }
  if (dateStr === todayISO) {
    return 'Today';
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
