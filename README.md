# TaskFlow – Smart To-Do List Application

TaskFlow is a responsive, full-stack To-Do List application built with React, TypeScript, Tailwind CSS, Express, and SQLite (with optional **Supabase** Auth + PostgreSQL support). It includes account authentication, complete CRUD operations, real-time task statistics, progress tracking, search, filtering, sorting, and overdue task highlighting.

## Features

- **User Authentication**: Sign up and sign in with email and password (`scrypt`-hashed passwords in SQLite or Supabase Auth when configured).
- **Create Tasks**: Add tasks with mandatory title validation, optional description, due date, priority (`High`, `Medium`, `Low`), and category (`Personal`, `Academic`, `Work`, `Other`).
- **View & Organize**: Dedicated views for All Tasks, Pending Tasks, Completed Tasks, and Today's Tasks, plus live category counts and completion progress.
- **Update & Complete**: Edit any task's details or status (`Pending` / `Completed`) in a modal dialog, or toggle completion directly from the task card.
- **Delete with Confirmation**: Remove tasks with an explicit confirmation prompt to prevent accidental deletion.
- **Search, Filter & Sort**: Search by title, filter by priority or category, sort by due date, priority, or creation order, and clear all active filters in one click.
- **Overdue Highlighting**: Automatically flags pending tasks whose due date has passed.

## Project Structure

```text
├── server.ts                  # Express REST API server, auth middleware & Vite integration
├── server/
│   ├── db.ts                  # SQLite database schema, scrypt hashing, validation & queries
│   └── supabase.ts            # Supabase Auth & PostgREST integration (when env vars are set)
├── supabase_schema.sql        # SQL script to create public.tasks & RLS policies in Supabase
├── src/
│   ├── api/
│   │   └── tasks.ts           # Frontend REST API client & date helpers
│   ├── components/
│   │   ├── AuthScreen.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── EditTaskModal.tsx
│   │   ├── FilterBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatsBar.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskForm.tsx
│   │   └── ToastContainer.tsx
│   ├── types/
│   │   └── task.ts            # Shared TypeScript interfaces & constants
│   ├── App.tsx                # Main application & authenticated dashboard
│   ├── index.css              # Tailwind CSS v4 & typography setup
│   └── main.tsx               # React entry point
├── .env.example
├── index.html
├── package.json
└── taskflow.db                # Local SQLite database file (used when Supabase is not configured)
```

## Connecting Supabase (Optional)

1. Open your Supabase Dashboard **SQL Editor** and run the contents of `supabase_schema.sql` to create `public.tasks` and its Row Level Security (RLS) policies.
2. In AI Studio **Settings → Secrets** (or your local `.env` file), add:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_PUBLISHABLE_KEY` — your Supabase publishable / anon key
3. Restart the server. TaskFlow will automatically route authentication and task CRUD operations through Supabase.

## REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user account and return a signed Bearer token.
- `POST /api/auth/login` — Authenticate with email/password and return a signed Bearer token.
- `GET /api/auth/me` — Verify Bearer token and return current user profile.

### Tasks (Requires `Authorization: Bearer <token>`)
- `GET /api/tasks` — Retrieve all tasks for the signed-in user (supports `?status=`, `?priority=`, `?category=`, `?search=`, `?today=true`).
- `GET /api/tasks/:id` — Retrieve a single task by ID.
- `POST /api/tasks` — Create a new task.
- `PUT /api/tasks/:id` — Update an existing task's details or status.
- `DELETE /api/tasks/:id` — Delete a task by ID.

## Installation & Execution

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server** (runs Express API + Vite frontend on port `3000`):
   ```bash
   npm run dev
   ```

3. **Build for production & run**:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```
