# Supabase Schema Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create PostgreSQL schemas (public, job_board_private) with tables for sources, organizations, jobs, and scan_tasks.

**Architecture:** Create SQL migration file with all tables, enums, and indexes. Use Supabase pg_cron for scheduled tasks.

**Tech Stack:** PostgreSQL (Supabase), pg_cron extension

---

### Task 1: Create SQL Migration File

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Write the migration file**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS job_board_private;

-- Create enums
DO $$ BEGIN
    CREATE TYPE canadian_status AS ENUM ('unscanned', 'canadian', 'not_canadian', 'no_address');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('active', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_type AS ENUM ('source_portfolio', 'organization_scan', 'job_heartbeat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sources table (public schema)
CREATE TABLE IF NOT EXISTS public.sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    website text,
    portfolio_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create organizations table (public schema)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    city text,
    province text,
    country text DEFAULT 'Canada',
    address text,
    description text,
    website text,
    careers_page text,
    canadian_status canadian_status DEFAULT 'unscanned',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create jobs table (public schema)
CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    title text NOT NULL,
    city text,
    province text,
    remote_ok boolean DEFAULT false,
    salary_min integer,
    salary_max integer,
    description text,
    posting_url text NOT NULL,
    last_checked_at timestamptz,
    status job_status DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create scan_tasks table (job_board_private schema)
CREATE TABLE IF NOT EXISTS job_board_private.scan_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type task_type NOT NULL,
    target_id uuid,
    payload jsonb,
    status text DEFAULT 'pending',
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_canadian_status ON public.organizations(canadian_status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON public.jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_scan_tasks_status ON job_board_private.scan_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scan_tasks_scheduled_at ON job_board_private.scan_tasks(scheduled_at);

-- Set up RLS (optional - enable if needed later)
-- ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_board_private.scan_tasks ENABLE ROW LEVEL SECURITY;
```

**Step 2: Commit the migration**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add Supabase schema migration"
```

---

### Task 2: Document pg_cron Job Setup

**Files:**
- Create: `docs/pg-cron-jobs.md`

**Step 1: Write documentation**

```markdown
# pg_cron Job Setup

## Required Cron Jobs

### 1. heartbeat_check (Weekly)
```sql
SELECT cron.schedule(
    'heartbeat_check',
    '0 0 * * 0',  -- Every Sunday at midnight
    $$INSERT INTO job_board_private.scan_tasks (task_type, target_id, scheduled_at)
      SELECT 'job_heartbeat', id, now()
      FROM public.jobs
      WHERE status = 'active'
      AND (last_checked_at IS NULL OR last_checked_at < now() - interval '7 days')
      LIMIT 100$$
);
```

### 2. queue_processor (Every Minute)
```sql
SELECT cron.schedule(
    'queue_processor',
    '* * * * *',  -- Every minute
    $$UPDATE job_board_private.scan_tasks
      SET status = 'processing', updated_at = now()
      WHERE id IN (
        SELECT id FROM job_board_private.scan_tasks
        WHERE status = 'pending'
        AND scheduled_at <= now()
        ORDER BY scheduled_at ASC
        LIMIT 10
      )$$
);
```

## Unschedule (if needed)
```sql
SELECT cron.unschedule('heartbeat_check');
SELECT cron.unschedule('queue_processor');
```
```

**Step 2: Commit**

```bash
git add docs/pg-cron-jobs.md
git commit -m "docs: add pg_cron job setup guide"
```

---

**Plan complete and saved to `docs/plans/2026-02-25-supabase-schema-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
