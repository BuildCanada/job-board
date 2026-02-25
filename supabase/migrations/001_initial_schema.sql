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