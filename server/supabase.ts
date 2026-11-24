import type {
  AuthUser,
  CreateTaskInput,
  LoginInput,
  RegisterInput,
  Task,
  UpdateTaskInput,
} from '../src/types/task.ts';

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const rawUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const rawKey = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!rawUrl || !rawKey) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return { url: parsed.origin, publishableKey: rawKey };
  } catch {
    return null;
  }
}

interface SupabaseAuthUserPayload {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: {
    name?: string;
  };
}

function mapSupabaseUser(raw: SupabaseAuthUserPayload): AuthUser {
  const email = raw.email ?? '';
  const fallbackName = email.includes('@') ? email.split('@')[0] : 'TaskFlow User';
  return {
    id: raw.id,
    name: raw.user_metadata?.name?.trim() || fallbackName,
    email,
    created_at: raw.created_at ?? new Date().toISOString(),
  };
}

function buildRestHeaders(config: SupabaseConfig, userToken?: string, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: config.publishableKey,
    ...extra,
  };
  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
  }
  return headers;
}

function isMissingUserIdColumnError(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  const code = typeof obj.code === 'string' ? obj.code : '';
  const msg = typeof obj.message === 'string' ? obj.message : '';
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    msg.toLowerCase().includes('user_id')
  );
}

function extractSupabaseError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const errorCode = typeof obj.error_code === 'string' ? obj.error_code : '';

    if (obj.code === 'PGRST205') {
      return "The 'tasks' table was not found in your Supabase project. Run supabase_schema.sql in your Supabase SQL Editor first.";
    }
    if (errorCode === 'over_email_send_rate_limit' || obj.code === 429) {
      return 'Supabase email rate limit exceeded. Turn off "Confirm email" in Supabase Dashboard (Authentication → Providers → Email).';
    }
    if (errorCode === 'email_not_confirmed') {
      return 'Your email address is not confirmed yet. Check your inbox or disable "Confirm email" in Supabase Authentication settings.';
    }
    if (errorCode === 'invalid_credentials') {
      return 'Invalid email or password.';
    }
    if (typeof obj.error_description === 'string' && obj.error_description) {
      return obj.error_description;
    }
    if (typeof obj.msg === 'string' && obj.msg) {
      return obj.msg;
    }
    if (typeof obj.message === 'string' && obj.message) {
      return obj.message;
    }
    if (typeof obj.error === 'string' && obj.error) {
      return obj.error;
    }
  }
  return fallback;
}

export async function supabaseSignUp(
  config: SupabaseConfig,
  input: RegisterInput
): Promise<
  | { ok: true; token: string | null; user: AuthUser; requiresEmailConfirmation: boolean }
  | { ok: false; status: number; error: string; errorCode?: string }
> {
  const res = await fetch(`${config.url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.publishableKey,
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: { name: input.name },
    }),
  });

  const payload = (await res.json().catch(() => null)) as
    | {
        access_token?: string;
        user?: SupabaseAuthUserPayload;
        session?: { access_token?: string } | null;
        error_code?: string;
      }
    | null;

  if (!res.ok || !payload) {
    return {
      ok: false,
      status: res.status || 400,
      error: extractSupabaseError(payload, 'Unable to create Supabase account.'),
      errorCode: payload?.error_code,
    };
  }

  const userPayload = payload.user ?? (payload as unknown as SupabaseAuthUserPayload);
  if (!userPayload || !userPayload.id) {
    return { ok: false, status: 400, error: 'Invalid response from Supabase Auth.' };
  }

  const token = payload.access_token || payload.session?.access_token || null;
  return {
    ok: true,
    token,
    user: mapSupabaseUser(userPayload),
    requiresEmailConfirmation: !token,
  };
}

export async function supabaseSignIn(
  config: SupabaseConfig,
  input: LoginInput
): Promise<
  | { ok: true; token: string; user: AuthUser }
  | { ok: false; status: number; error: string; errorCode?: string }
> {
  const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.publishableKey,
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });

  const payload = (await res.json().catch(() => null)) as
    | { access_token?: string; user?: SupabaseAuthUserPayload; error_code?: string }
    | null;

  if (!res.ok || !payload?.access_token || !payload.user) {
    return {
      ok: false,
      status: res.status === 400 ? 401 : res.status || 401,
      error: extractSupabaseError(payload, 'Invalid email address or password.'),
      errorCode: payload?.error_code,
    };
  }

  return {
    ok: true,
    token: payload.access_token,
    user: mapSupabaseUser(payload.user),
  };
}

export async function supabaseGetUser(
  config: SupabaseConfig,
  token: string
): Promise<AuthUser | null> {
  const res = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return null;
  }

  const payload = (await res.json().catch(() => null)) as SupabaseAuthUserPayload | null;
  if (!payload || !payload.id) {
    return null;
  }
  return mapSupabaseUser(payload);
}

export async function supabaseGetTasks(
  config: SupabaseConfig,
  userToken?: string
): Promise<{ ok: true; tasks: Task[] } | { ok: false; status: number; error: string }> {
  const res = await fetch(
    `${config.url}/rest/v1/tasks?select=*&order=created_at.desc,id.desc`,
    {
      headers: buildRestHeaders(config, userToken),
    }
  );

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      status: res.status === 404 ? 503 : res.status || 500,
      error: extractSupabaseError(payload, 'Failed to fetch tasks from Supabase.'),
    };
  }

  return { ok: true, tasks: Array.isArray(payload) ? (payload as Task[]) : [] };
}

export async function supabaseGetTaskById(
  config: SupabaseConfig,
  id: number,
  userToken?: string
): Promise<{ ok: true; task: Task | null } | { ok: false; status: number; error: string }> {
  const res = await fetch(
    `${config.url}/rest/v1/tasks?id=eq.${id}&select=*`,
    {
      headers: buildRestHeaders(config, userToken),
    }
  );

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      status: res.status === 404 ? 503 : res.status || 500,
      error: extractSupabaseError(payload, 'Failed to fetch task from Supabase.'),
    };
  }

  const rows = Array.isArray(payload) ? (payload as Task[]) : [];
  return { ok: true, task: rows[0] ?? null };
}

export async function supabaseCreateTask(
  config: SupabaseConfig,
  input: CreateTaskInput,
  options?: { userToken?: string; userId?: string }
): Promise<{ ok: true; task: Task } | { ok: false; status: number; error: string }> {
  const baseBody = {
    title: input.title,
    description: input.description ?? '',
    due_date: input.due_date ?? null,
    priority: input.priority,
    category: input.category,
    status: 'Pending' as const,
  };

  const bodyWithUser =
    options?.userId && options?.userToken
      ? { ...baseBody, user_id: options.userId }
      : baseBody;

  let res = await fetch(`${config.url}/rest/v1/tasks`, {
    method: 'POST',
    headers: buildRestHeaders(config, options?.userToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(bodyWithUser),
  });

  let payload = await res.json().catch(() => null);

  // If the Supabase tasks table was created without a user_id column, retry cleanly without user_id
  if (!res.ok && 'user_id' in bodyWithUser && isMissingUserIdColumnError(payload)) {
    res = await fetch(`${config.url}/rest/v1/tasks`, {
      method: 'POST',
      headers: buildRestHeaders(config, options?.userToken, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(baseBody),
    });
    payload = await res.json().catch(() => null);
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status === 404 ? 503 : res.status || 500,
      error: extractSupabaseError(payload, 'Failed to create task in Supabase.'),
    };
  }

  const rows = Array.isArray(payload) ? (payload as Task[]) : [];
  if (!rows[0]) {
    return { ok: false, status: 500, error: 'Supabase did not return the created task.' };
  }
  return { ok: true, task: rows[0] };
}

export async function supabaseUpdateTask(
  config: SupabaseConfig,
  id: number,
  input: UpdateTaskInput,
  userToken?: string
): Promise<{ ok: true; task: Task | null } | { ok: false; status: number; error: string }> {
  const res = await fetch(`${config.url}/rest/v1/tasks?id=eq.${id}`, {
    method: 'PATCH',
    headers: buildRestHeaders(config, userToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(input),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      status: res.status === 404 ? 503 : res.status || 500,
      error: extractSupabaseError(payload, 'Failed to update task in Supabase.'),
    };
  }

  const rows = Array.isArray(payload) ? (payload as Task[]) : [];
  return { ok: true, task: rows[0] ?? null };
}

export async function supabaseDeleteTask(
  config: SupabaseConfig,
  id: number,
  userToken?: string
): Promise<{ ok: true; deleted: boolean } | { ok: false; status: number; error: string }> {
  const res = await fetch(`${config.url}/rest/v1/tasks?id=eq.${id}`, {
    method: 'DELETE',
    headers: buildRestHeaders(config, userToken, {
      Prefer: 'return=representation',
    }),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      status: res.status === 404 ? 503 : res.status || 500,
      error: extractSupabaseError(payload, 'Failed to delete task from Supabase.'),
    };
  }

  const rows = Array.isArray(payload) ? (payload as Task[]) : [];
  return { ok: true, deleted: rows.length > 0 };
}
