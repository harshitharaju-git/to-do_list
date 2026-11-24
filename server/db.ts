import crypto from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  AuthUser,
  CreateTaskInput,
  LoginInput,
  RegisterInput,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from '../src/types/task.ts';

const VALID_PRIORITIES = new Set<TaskPriority>(['High', 'Medium', 'Low']);
const VALID_CATEGORIES = new Set<TaskCategory>(['Personal', 'Academic', 'Work', 'Other']);
const VALID_STATUSES = new Set<TaskStatus>(['Pending', 'Completed']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DB_PATH = path.resolve(process.cwd(), 'taskflow.db');
const db = new DatabaseSync(DB_PATH);

export function initializeDatabase(): void {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      due_date DATE,
      priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
      category VARCHAR(30) NOT NULL DEFAULT 'Personal',
      status VARCHAR(20) NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Safe migration for existing databases created before user_id was added
  const columns = db.prepare('PRAGMA table_info(tasks)').all() as Array<{ name: string }>;
  const hasUserId = columns.some((col) => col.name === 'user_id');
  if (!hasUserId) {
    db.exec('ALTER TABLE tasks ADD COLUMN user_id INTEGER;');
  }
}

export function getMetaFlag(key: string): string | null {
  const row = db.prepare('SELECT value FROM app_meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

export function setMetaFlag(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)').run(key, value);
}

function formatLocalDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function seedStarterTasksForUser(userId: number): void {
  const insertStmt = db.prepare(`
    INSERT INTO tasks (user_id, title, description, due_date, priority, category, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const starterTasks: Array<[string, string, string | null, TaskPriority, TaskCategory, TaskStatus]> = [
    [
      'Finalize Q4 product roadmap presentation',
      'Review milestone dependencies with engineering leads and update delivery dates on slide 8.',
      formatLocalDate(0),
      'High',
      'Work',
      'Pending',
    ],
    [
      'Submit database architecture lab report',
      'Include ER diagram, normalization analysis, and SQL query benchmarks before midnight.',
      formatLocalDate(-1),
      'High',
      'Academic',
      'Pending',
    ],
    [
      'Schedule annual dental checkup',
      'Call clinic reception to confirm an early morning slot next week.',
      formatLocalDate(3),
      'Low',
      'Personal',
      'Pending',
    ],
    [
      'Prepare sprint retrospective notes',
      'Summarize velocity metrics and top three workflow improvements from the last two weeks.',
      formatLocalDate(1),
      'Medium',
      'Work',
      'Pending',
    ],
    [
      'Organize cloud storage backups',
      'Archive completed semester coursework folders and verify backup integrity.',
      formatLocalDate(-2),
      'Medium',
      'Other',
      'Completed',
    ],
  ];

  for (const task of starterTasks) {
    insertStmt.run(userId, ...task);
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;

  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export interface ValidationResult<T> {
  ok: true;
  data: T;
}

export interface ValidationError {
  ok: false;
  error: string;
}

export function validateRegisterInput(raw: unknown): ValidationResult<RegisterInput> | ValidationError {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid request payload.' };
  }
  const body = raw as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || name.length < 2) {
    return { ok: false, error: 'Please enter your full name (at least 2 characters).' };
  }
  if (name.length > 120) {
    return { ok: false, error: 'Name must be 120 characters or fewer.' };
  }
  if (!email || !EMAIL_REGEX.test(email) || email.length > 255) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters long.' };
  }
  if (password.length > 128) {
    return { ok: false, error: 'Password must be 128 characters or fewer.' };
  }

  return { ok: true, data: { name, email, password } };
}

export function validateLoginInput(raw: unknown): ValidationResult<LoginInput> | ValidationError {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid request payload.' };
  }
  const body = raw as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { ok: false, error: 'Please enter your password.' };
  }

  return { ok: true, data: { email, password } };
}

export function registerUser(input: RegisterInput): { ok: true; user: AuthUser } | { ok: false; error: string; status: number } {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(input.email) as { id: number } | undefined;
  if (existing) {
    return { ok: false, error: 'An account with this email address already exists.', status: 409 };
  }

  const passwordHash = hashPassword(input.password);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(input.name, input.email, passwordHash);

  const userId = Number(result.lastInsertRowid);

  // Claim any pre-auth tasks for the first registered user, or seed starter tasks
  const orphanRow = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id IS NULL').get() as { count: number };
  if (orphanRow.count > 0) {
    db.prepare('UPDATE tasks SET user_id = ? WHERE user_id IS NULL').run(userId);
  } else {
    seedStarterTasksForUser(userId);
  }

  const user = getUserById(userId);
  if (!user) {
    throw new Error('Failed to load newly created user.');
  }
  return { ok: true, user };
}

export function authenticateUser(input: LoginInput): AuthUser | null {
  const row = db
    .prepare('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?')
    .get(input.email) as (AuthUser & { password_hash: string }) | undefined;

  if (!row) {
    return null;
  }

  if (!verifyPassword(input.password, row.password_hash)) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
  };
}

export function getUserById(id: number): AuthUser | null {
  const row = db
    .prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
    .get(id) as AuthUser | undefined;
  return row ?? null;
}

function normalizeDate(value: unknown): { valid: boolean; date: string | null } {
  if (value === undefined || value === null || value === '') {
    return { valid: true, date: null };
  }
  if (typeof value !== 'string') {
    return { valid: false, date: null };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: true, date: null };
  }
  if (!DATE_REGEX.test(trimmed)) {
    return { valid: false, date: null };
  }
  const [y, m, d] = trimmed.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    return { valid: false, date: null };
  }
  return { valid: true, date: trimmed };
}

export function validateCreateInput(raw: unknown): ValidationResult<CreateTaskInput> | ValidationError {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid request payload.' };
  }

  const body = raw as Record<string, unknown>;
  const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
  if (!rawTitle) {
    return { ok: false, error: 'Task title is required and cannot be empty.' };
  }
  if (rawTitle.length > 200) {
    return { ok: false, error: 'Task title must be 200 characters or fewer.' };
  }

  let description = '';
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      return { ok: false, error: 'Task description must be text.' };
    }
    description = body.description.trim();
    if (description.length > 2000) {
      return { ok: false, error: 'Task description must be 2000 characters or fewer.' };
    }
  }

  const dateCheck = normalizeDate(body.due_date);
  if (!dateCheck.valid) {
    return { ok: false, error: 'Due date must be a valid date in YYYY-MM-DD format.' };
  }

  const priority = (body.priority ?? 'Medium') as TaskPriority;
  if (typeof priority !== 'string' || !VALID_PRIORITIES.has(priority)) {
    return { ok: false, error: 'Priority must be High, Medium, or Low.' };
  }

  const category = (body.category ?? 'Personal') as TaskCategory;
  if (typeof category !== 'string' || !VALID_CATEGORIES.has(category)) {
    return { ok: false, error: 'Category must be Personal, Academic, Work, or Other.' };
  }

  return {
    ok: true,
    data: {
      title: rawTitle,
      description,
      due_date: dateCheck.date,
      priority,
      category,
    },
  };
}

export function validateUpdateInput(raw: unknown): ValidationResult<UpdateTaskInput> | ValidationError {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid request payload.' };
  }

  const body = raw as Record<string, unknown>;
  const update: UpdateTaskInput = {};

  if ('title' in body) {
    const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
    if (!rawTitle) {
      return { ok: false, error: 'Task title is required and cannot be empty.' };
    }
    if (rawTitle.length > 200) {
      return { ok: false, error: 'Task title must be 200 characters or fewer.' };
    }
    update.title = rawTitle;
  }

  if ('description' in body) {
    if (body.description === null || body.description === undefined) {
      update.description = '';
    } else if (typeof body.description !== 'string') {
      return { ok: false, error: 'Task description must be text.' };
    } else {
      const trimmedDesc = body.description.trim();
      if (trimmedDesc.length > 2000) {
        return { ok: false, error: 'Task description must be 2000 characters or fewer.' };
      }
      update.description = trimmedDesc;
    }
  }

  if ('due_date' in body) {
    const dateCheck = normalizeDate(body.due_date);
    if (!dateCheck.valid) {
      return { ok: false, error: 'Due date must be a valid date in YYYY-MM-DD format.' };
    }
    update.due_date = dateCheck.date;
  }

  if ('priority' in body) {
    if (typeof body.priority !== 'string' || !VALID_PRIORITIES.has(body.priority as TaskPriority)) {
      return { ok: false, error: 'Priority must be High, Medium, or Low.' };
    }
    update.priority = body.priority as TaskPriority;
  }

  if ('category' in body) {
    if (typeof body.category !== 'string' || !VALID_CATEGORIES.has(body.category as TaskCategory)) {
      return { ok: false, error: 'Category must be Personal, Academic, Work, or Other.' };
    }
    update.category = body.category as TaskCategory;
  }

  if ('status' in body) {
    if (typeof body.status !== 'string' || !VALID_STATUSES.has(body.status as TaskStatus)) {
      return { ok: false, error: 'Status must be Pending or Completed.' };
    }
    update.status = body.status as TaskStatus;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: 'At least one valid field must be provided for update.' };
  }

  return { ok: true, data: update };
}

export function getAllTasksForUser(userId: number): Task[] {
  const stmt = db.prepare(`
    SELECT id, user_id, title, description, due_date, priority, category, status, created_at
    FROM tasks
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
  `);
  return stmt.all(userId) as unknown as Task[];
}

export function getTaskByIdForUser(id: number, userId: number): Task | null {
  const stmt = db.prepare(`
    SELECT id, user_id, title, description, due_date, priority, category, status, created_at
    FROM tasks
    WHERE id = ? AND user_id = ?
  `);
  const row = stmt.get(id, userId) as unknown as Task | undefined;
  return row ?? null;
}

export function createTaskForUser(userId: number, input: CreateTaskInput): Task {
  const insertStmt = db.prepare(`
    INSERT INTO tasks (user_id, title, description, due_date, priority, category, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending')
  `);
  const result = insertStmt.run(
    userId,
    input.title,
    input.description ?? '',
    input.due_date ?? null,
    input.priority,
    input.category
  );
  const insertedId = Number(result.lastInsertRowid);
  const created = getTaskByIdForUser(insertedId, userId);
  if (!created) {
    throw new Error('Failed to retrieve newly created task.');
  }
  return created;
}

export function updateTaskForUser(id: number, userId: number, input: UpdateTaskInput): Task | null {
  const existing = getTaskByIdForUser(id, userId);
  if (!existing) {
    return null;
  }

  const nextTitle = input.title !== undefined ? input.title : existing.title;
  const nextDescription = input.description !== undefined ? input.description : existing.description;
  const nextDueDate = input.due_date !== undefined ? input.due_date : existing.due_date;
  const nextPriority = input.priority !== undefined ? input.priority : existing.priority;
  const nextCategory = input.category !== undefined ? input.category : existing.category;
  const nextStatus = input.status !== undefined ? input.status : existing.status;

  const updateStmt = db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, due_date = ?, priority = ?, category = ?, status = ?
    WHERE id = ? AND user_id = ?
  `);
  updateStmt.run(
    nextTitle,
    nextDescription,
    nextDueDate,
    nextPriority,
    nextCategory,
    nextStatus,
    id,
    userId
  );

  return getTaskByIdForUser(id, userId);
}

export function deleteTaskForUser(id: number, userId: number): boolean {
  const deleteStmt = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
  const result = deleteStmt.run(id, userId);
  return result.changes > 0;
}
