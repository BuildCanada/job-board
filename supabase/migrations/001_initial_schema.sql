-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS job_board;
CREATE SCHEMA IF NOT EXISTS job_board_private;

-- Grant permissions on schemas
GRANT ALL ON SCHEMA job_board TO project_job_board;
GRANT ALL ON SCHEMA job_board_private TO project_job_board;

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

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sources table (job_board schema)
CREATE TABLE IF NOT EXISTS job_board.sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    website text,
    portfolio_url text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create organizations table (job_board schema)
CREATE TABLE IF NOT EXISTS job_board.organizations (
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

-- Create jobs table (job_board schema)
CREATE TABLE IF NOT EXISTS job_board.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES job_board.organizations(id) ON DELETE SET NULL,
    title text NOT NULL,
    city text,
    province text,
    remote_ok boolean DEFAULT false,
    salary_min integer,
    salary_max integer,
    description text,
    posting_url text NOT NULL UNIQUE,
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
    status task_status NOT NULL DEFAULT 'pending',
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_canadian_status ON job_board.organizations(canadian_status);
CREATE INDEX IF NOT EXISTS idx_organizations_updated_at ON job_board.organizations(updated_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_board.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON job_board.jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON job_board.jobs(updated_at);
CREATE INDEX IF NOT EXISTS idx_scan_tasks_status ON job_board_private.scan_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scan_tasks_scheduled_at ON job_board_private.scan_tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scan_tasks_updated_at ON job_board_private.scan_tasks(updated_at);