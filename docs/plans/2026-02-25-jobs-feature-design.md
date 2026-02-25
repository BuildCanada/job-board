# Jobs Feature Design

**Date:** 2026-02-25  
**Status:** Approved

## Overview

Migrate Jobs feature with weekly heartbeat check. Jobs come from organization careers pages. Heartbeat verifies URLs are still valid and archives dead postings.

## Core Flow

1. **Create Job** - From organization scan (careers page found) or manual entry
2. **Job Status** - `active` (default) or `archived`
3. **Weekly Heartbeat** - pg_cron job checks if job URLs are still valid
4. **Archive Dead Jobs** - If URL returns 404, 410, or too many redirects → mark `archived`

## Heartbeat Logic

```typescript
// For each active job where last_checked_at > 7 days ago
const response = await fetch(postingUrl, { 
  method: "HEAD",
  redirect: "follow" 
});

if (response.status === 404 || response.status === 410) {
  // Job posting is dead - archive it
  status = "archived";
} else if (response.redirected && response.url !== postingUrl) {
  // URL redirect - might be dead, archive it
  status = "archived";
} else {
  // Still alive, update last_checked_at
  last_checked_at = now();
}
```

## API Endpoints

```
POST   /api/jobs                  - Create job
GET    /api/jobs                  - List jobs (filter by status, org, province)
GET    /api/jobs/:id              - Get job by ID
PATCH  /api/jobs/:id              - Update job
DELETE /api/jobs/:id              - Delete job
```

## pg_cron Job (Weekly)

```sql
-- Run every Sunday at midnight
INSERT INTO job_board_private.scan_tasks (task_type, target_id, scheduled_at)
SELECT 'job_heartbeat', id, now()
FROM public.jobs
WHERE status = 'active'
AND (last_checked_at IS NULL OR last_checked_at < now() - interval '7 days')
LIMIT 100;
```

## Files to Create

- `src/app/api/jobs/route.ts` - CRUD endpoints
- `src/lib/supabase/jobs.ts` - DB operations
- `src/lib/workers/job-heartbeat.ts` - Heartbeat check logic
