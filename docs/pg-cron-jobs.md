# pg_cron Job Setup

## Introduction

pg_cron is a cron-based job scheduler for PostgreSQL that allows you to run periodic tasks within the database. This document describes the two scheduled jobs used by the Job Board application:
- `heartbeat_check` - Weekly job to create heartbeat scan tasks for active jobs
- `queue_processor` - Per-minute job to process pending scan tasks

## Prerequisites

Before setting up the cron jobs, ensure pg_cron extension is installed and enabled:
```sql
CREATE EXTENSION IF NOT EXISTS cron;
```

## Schema Context

The cron jobs interact with these tables:
- `job_board_private.scan_tasks` - Stores pending/processing tasks for background workers
- `public.jobs` - Contains job listings with status and tracking fields

## Required Cron Jobs

### 1. heartbeat_check (Weekly)
Creates heartbeat scan tasks for all active jobs that haven't been checked in 7+ days.
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
Moves pending scan tasks to processing state (consumed by background worker).
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

## Applying Changes

Run the cron job SQL commands in your database shell or migration tool:
```bash
# Using psql
psql -U postgres -d job_board -f setup_cron_jobs.sql

# Using a migration tool (e.g., Directus)
# Add to your migration file and apply it
```

## Verification

After scheduling jobs, verify they're active:
```sql
-- List all scheduled jobs
SELECT jobid, schedule, command, nodename, nodeport, database, username, active, jobname
FROM cron.job;

-- Check job run history
SELECT jobid, start_time, run_status, return_message, duration
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

Expected results:
- Two jobs should appear (jobid 1 and 2)
- `active` column should be `true`
- `run_status` values: `succeeded`, `failed`, or `running`

## Monitoring

Monitor job execution via the `cron.job_run_details` table:
```sql
-- Check for recent failures
SELECT * FROM cron.job_run_details
WHERE run_status = 'failed'
ORDER BY start_time DESC
LIMIT 20;

-- View job statistics
SELECT jobname, run_status, COUNT(*)
FROM cron.job_run_details
WHERE start_time > now() - interval '24 hours'
GROUP BY jobname, run_status
ORDER BY jobname, run_status;
```

## Troubleshooting

### Jobs not running
- Verify pg_cron extension is enabled: `\dx cron` (in psql)
- Check PostgreSQL logs for pg_cron errors
- Confirm `cron.job` shows `active = true`

### Jobs failing
- Query `cron.job_run_details` for error messages in `return_message`
- Ensure tables referenced exist: `job_board_private.scan_tasks`, `public.jobs`
- Check permissions: scheduler role must have SELECT/INSERT/UPDATE on target tables

### Jobs not visible
- Query `cron.job` directly: should show all scheduled jobs
- Check pg_cron is configured in `postgresql.conf`:
  ```conf
  shared_preload_libraries = 'pg_cron'
  cron.database_name = 'your_database_name'
  ```

## Unschedule (if needed)

Remove jobs using:
```sql
SELECT cron.unschedule('heartbeat_check');
SELECT cron.unschedule('queue_processor');
```