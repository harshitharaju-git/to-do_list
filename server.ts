import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  authenticateUser,
  createTaskForUser,
  deleteTaskForUser,
  getAllTasksForUser,
  getMetaFlag,
  getTaskByIdForUser,
  getUserById,
  initializeDatabase,
  registerUser,
  setMetaFlag,
  updateTaskForUser,
  validateCreateInput,
  validateLoginInput,
  validateRegisterInput,
  validateUpdateInput,
} from './server/db.ts';
import {
  getSupabaseConfig,
  supabaseCreateTask,
  supabaseDeleteTask,
  supabaseGetTaskById,
  supabaseGetTasks,
  supabaseGetUser,
  supabaseSignIn,
  supabaseSignUp,
  supabaseUpdateTask,
} from './server/supabase.ts';
import type { AuthUser, Task } from './src/types/task.ts';

const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
  authToken?: string;
  storageMode?: 'sqlite' | 'supabase';
}

function signAuthToken(userId: number): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      mode: 'local',
      exp: Date.now() + TOKEN_TTL_MS,
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyAuthToken(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: unknown;
      mode?: unknown;
      exp?: unknown;
    };
    if (decoded.mode !== 'local' || typeof decoded.sub !== 'number' || typeof decoded.exp !== 'number') {
      return null;
    }
    if (Date.now() > decoded.exp) {
      return null;
    }
    return decoded.sub;
  } catch {
    return null;
  }
}

async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice(7).trim();

  // Check cryptographically signed local SQLite token first
  const localUserId = verifyAuthToken(token);
  if (localUserId !== null) {
    const user = getUserById(localUserId);
    if (!user) {
      res.status(401).json({ error: 'User account not found. Please sign in again.' });
      return;
    }
    req.authUser = user;
    req.authToken = token;
    req.storageMode = 'sqlite';
    next();
    return;
  }

  // Otherwise verify against Supabase Auth if configured
  const supabase = getSupabaseConfig();
  if (supabase) {
    try {
      const user = await supabaseGetUser(supabase, token);
      if (!user) {
        res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
        return;
      }
      req.authUser = user;
      req.authToken = token;
      req.storageMode = 'supabase';
      next();
    } catch (error) {
      console.error('Supabase session verification error:', error);
      res.status(500).json({ error: 'Unable to verify session with Supabase.' });
    }
    return;
  }

  res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
}

function parseTaskId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) {
    return null;
  }
  const id = Number.parseInt(rawId, 10);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function filterTasksByQuery(tasks: Task[], query: Request['query']): Task[] {
  let result = tasks;
  const statusParam = typeof query.status === 'string' ? query.status : '';
  const priorityParam = typeof query.priority === 'string' ? query.priority : '';
  const categoryParam = typeof query.category === 'string' ? query.category : '';
  const searchParam = typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';
  const todayParam = typeof query.today === 'string' ? query.today : '';

  if (statusParam === 'Pending' || statusParam === 'Completed') {
    result = result.filter((t) => t.status === statusParam);
  }
  if (priorityParam === 'High' || priorityParam === 'Medium' || priorityParam === 'Low') {
    result = result.filter((t) => t.priority === priorityParam);
  }
  if (
    categoryParam === 'Personal' ||
    categoryParam === 'Academic' ||
    categoryParam === 'Work' ||
    categoryParam === 'Other'
  ) {
    result = result.filter((t) => t.category === categoryParam);
  }
  if (searchParam) {
    result = result.filter((t) => t.title.toLowerCase().includes(searchParam));
  }
  if (todayParam === 'true') {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    result = result.filter((t) => t.due_date === todayStr);
  }
  return result;
}

async function startServer(): Promise<void> {
  initializeDatabase();

  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // Malformed JSON error handler
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Invalid JSON payload in request body.' });
      return;
    }
    next(err);
  });

  // Health & active backend status
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', backend: getSupabaseConfig() ? 'supabase' : 'sqlite' });
  });

  // POST /api/auth/register
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const validation = validateRegisterInput(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const forceLocal = Boolean(
      req.body && typeof req.body === 'object' && (req.body as { mode?: unknown }).mode === 'local'
    );
    const supabase = forceLocal ? null : getSupabaseConfig();

    if (supabase) {
      try {
        const result = await supabaseSignUp(supabase, validation.data);
        if (result.ok && result.token && !result.requiresEmailConfirmation) {
          res.status(201).json({
            token: result.token,
            user: result.user,
            message: 'Account created successfully.',
          });
          return;
        }

        const shouldFallbackToLocal =
          (result.ok && (result.requiresEmailConfirmation || !result.token)) ||
          (!result.ok &&
            (result.status === 429 ||
              result.errorCode === 'over_email_send_rate_limit' ||
              result.errorCode === 'email_address_invalid'));

        if (!shouldFallbackToLocal && !result.ok) {
          res.status(result.status).json({ error: result.error });
          return;
        }
      } catch (error) {
        console.error('Supabase registration error, falling back to SQLite auth:', error);
      }
    }

    try {
      const result = registerUser(validation.data);
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      const token = signAuthToken(Number(result.user.id));
      res.status(201).json({
        token,
        user: result.user,
        message: 'Account created successfully.',
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Unable to create account right now.' });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const validation = validateLoginInput(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const forceLocal = Boolean(
      req.body && typeof req.body === 'object' && (req.body as { mode?: unknown }).mode === 'local'
    );
    const supabase = forceLocal ? null : getSupabaseConfig();

    if (supabase) {
      try {
        const result = await supabaseSignIn(supabase, validation.data);
        if (result.ok) {
          res.json({
            token: result.token,
            user: result.user,
            message: 'Signed in successfully.',
          });
          return;
        }

        const localUser = authenticateUser(validation.data);
        if (localUser) {
          const token = signAuthToken(Number(localUser.id));
          res.json({
            token,
            user: localUser,
            message: 'Signed in successfully.',
          });
          return;
        }

        res.status(result.status).json({ error: result.error });
        return;
      } catch (error) {
        console.error('Supabase sign-in error, checking SQLite:', error);
      }
    }

    try {
      const user = authenticateUser(validation.data);
      if (!user) {
        res.status(401).json({ error: 'Invalid email address or password.' });
        return;
      }

      const token = signAuthToken(Number(user.id));
      res.json({
        token,
        user,
        message: 'Signed in successfully.',
      });
    } catch (error) {
      console.error('Error authenticating user:', error);
      res.status(500).json({ error: 'Unable to sign in right now.' });
    }
  });

  // GET /api/auth/me
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.authUser });
  });

  // GET /api/tasks
  app.get('/api/tasks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const supabase = getSupabaseConfig();
    if (supabase) {
      const userToken = req.storageMode === 'supabase' ? req.authToken : undefined;
      const userId = req.storageMode === 'supabase' ? String(req.authUser!.id) : undefined;
      let result = await supabaseGetTasks(supabase, userToken);
      if (result.ok) {
        if (result.tasks.length === 0 && !getMetaFlag('supabase_tasks_seeded')) {
          const formatOffset = (days: number) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
              d.getDate()
            ).padStart(2, '0')}`;
          };
          const starterInputs = [
            {
              title: 'Finalize Q4 product roadmap presentation',
              description:
                'Review milestone dependencies with engineering leads and update delivery dates on slide 8.',
              due_date: formatOffset(0),
              priority: 'High' as const,
              category: 'Work' as const,
            },
            {
              title: 'Submit database architecture lab report',
              description:
                'Include ER diagram, normalization analysis, and SQL query benchmarks before midnight.',
              due_date: formatOffset(-1),
              priority: 'High' as const,
              category: 'Academic' as const,
            },
            {
              title: 'Schedule annual dental checkup',
              description: 'Call clinic reception to confirm an early morning slot next week.',
              due_date: formatOffset(3),
              priority: 'Low' as const,
              category: 'Personal' as const,
            },
            {
              title: 'Prepare sprint retrospective notes',
              description:
                'Summarize velocity metrics and top three workflow improvements from the last two weeks.',
              due_date: formatOffset(1),
              priority: 'Medium' as const,
              category: 'Work' as const,
            },
          ];

          const seededTasks: Task[] = [];
          for (const item of starterInputs) {
            const created = await supabaseCreateTask(supabase, item, { userToken, userId });
            if (created.ok) {
              seededTasks.push(created.task);
            }
          }
          setMetaFlag('supabase_tasks_seeded', '1');
          if (seededTasks.length > 0) {
            result = { ok: true, tasks: seededTasks.reverse() };
          }
        }
        res.json({ tasks: filterTasksByQuery(result.tasks, req.query) });
        return;
      }
      if (req.storageMode === 'supabase') {
        res.status(result.status).json({ error: result.error });
        return;
      }
    }

    try {
      const userId = Number(req.authUser!.id);
      const tasks = filterTasksByQuery(getAllTasksForUser(userId), req.query);
      res.json({ tasks });
    } catch (error) {
      console.error('Error retrieving tasks:', error);
      res.status(500).json({ error: 'Failed to retrieve tasks from the database.' });
    }
  });

  // GET /api/tasks/:id
  app.get('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Invalid task ID. Must be a positive integer.' });
      return;
    }

    const supabase = getSupabaseConfig();
    if (supabase) {
      const userToken = req.storageMode === 'supabase' ? req.authToken : undefined;
      const result = await supabaseGetTaskById(supabase, id, userToken);
      if (result.ok) {
        if (!result.task) {
          res.status(404).json({ error: `Task with ID ${id} was not found.` });
          return;
        }
        res.json({ task: result.task });
        return;
      }
      if (req.storageMode === 'supabase') {
        res.status(result.status).json({ error: result.error });
        return;
      }
    }

    try {
      const task = getTaskByIdForUser(id, Number(req.authUser!.id));
      if (!task) {
        res.status(404).json({ error: `Task with ID ${id} was not found.` });
        return;
      }
      res.json({ task });
    } catch (error) {
      console.error('Error retrieving task:', error);
      res.status(500).json({ error: 'Failed to retrieve task from the database.' });
    }
  });

  // POST /api/tasks
  app.post('/api/tasks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const validation = validateCreateInput(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const supabase = getSupabaseConfig();
    if (supabase) {
      const userToken = req.storageMode === 'supabase' ? req.authToken : undefined;
      const userId = req.storageMode === 'supabase' ? String(req.authUser!.id) : undefined;
      const result = await supabaseCreateTask(supabase, validation.data, { userToken, userId });
      if (result.ok) {
        res.status(201).json({ task: result.task, message: 'Task created successfully.' });
        return;
      }
      if (req.storageMode === 'supabase') {
        res.status(result.status).json({ error: result.error });
        return;
      }
    }

    try {
      const task = createTaskForUser(Number(req.authUser!.id), validation.data);
      res.status(201).json({ task, message: 'Task created successfully.' });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to save task to the database.' });
    }
  });

  // PUT /api/tasks/:id
  app.put('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Invalid task ID. Must be a positive integer.' });
      return;
    }

    const validation = validateUpdateInput(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const supabase = getSupabaseConfig();
    if (supabase) {
      const userToken = req.storageMode === 'supabase' ? req.authToken : undefined;
      const result = await supabaseUpdateTask(supabase, id, validation.data, userToken);
      if (result.ok) {
        if (!result.task) {
          res.status(404).json({ error: `Task with ID ${id} was not found.` });
          return;
        }
        res.json({ task: result.task, message: 'Task updated successfully.' });
        return;
      }
      if (req.storageMode === 'supabase') {
        res.status(result.status).json({ error: result.error });
        return;
      }
    }

    try {
      const updated = updateTaskForUser(id, Number(req.authUser!.id), validation.data);
      if (!updated) {
        res.status(404).json({ error: `Task with ID ${id} was not found.` });
        return;
      }
      res.json({ task: updated, message: 'Task updated successfully.' });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task in the database.' });
    }
  });

  // DELETE /api/tasks/:id
  app.delete('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Invalid task ID. Must be a positive integer.' });
      return;
    }

    const supabase = getSupabaseConfig();
    if (supabase) {
      const userToken = req.storageMode === 'supabase' ? req.authToken : undefined;
      const result = await supabaseDeleteTask(supabase, id, userToken);
      if (result.ok) {
        if (!result.deleted) {
          res.status(404).json({ error: `Task with ID ${id} was not found.` });
          return;
        }
        res.json({ id, message: 'Task deleted successfully.' });
        return;
      }
      if (req.storageMode === 'supabase') {
        res.status(result.status).json({ error: result.error });
        return;
      }
    }

    try {
      const deleted = deleteTaskForUser(id, Number(req.authUser!.id));
      if (!deleted) {
        res.status(404).json({ error: `Task with ID ${id} was not found.` });
        return;
      }
      res.json({ id, message: 'Task deleted successfully.' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task from the database.' });
    }
  });

  // Unknown API route handler
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `TaskFlow server listening on http://localhost:${PORT} (tasks backend: ${
        getSupabaseConfig() ? 'Supabase' : 'SQLite'
      })`
    );
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting TaskFlow server:', err);
  process.exit(1);
});
