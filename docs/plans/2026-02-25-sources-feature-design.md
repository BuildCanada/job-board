# Sources Feature Design

**Date:** 2026-02-25  
**Status:** Approved

## Overview

Migrate Sources feature from CanadianStartupJobs to job-board. Sources are capital sources (VC, Family Offices, Accelerators) whose portfolio companies become organizations to scan for jobs.

## Core Flow

1. **Add Source** - Insert source record with name, website, portfolio_url
2. **Trigger Scan** - API call queues `source_portfolio` task
3. **Process Task** - Fetch portfolio page via base HTTP, extract company links via AI
4. **Create Organizations** - For each discovered company, create org record + queue `organization_scan` task

## API Endpoints

```
POST   /api/sources              - Create new source
GET    /api/sources              - List all sources
GET    /api/sources/:id          - Get source by ID
POST   /api/ssources/:id/scan     - Trigger portfolio scan
DELETE /api/sources/:id          - Delete source
```

## Task Payload (scan_tasks)

```json
{
  "task_type": "source_portfolio",
  "target_id": "<source-uuid>",
  "payload": {
    "portfolio_url": "https://..."
  }
}
```

## Organization Creation

When portfolio companies are discovered:
1. Create organization with basic info (name, website from link)
2. Set `canadian_status = 'unscanned'`
3. Queue `organization_scan` task for each new org

## Sub-Tasks

1. **Find alternative scraper** - Determine, test, and use base fetch for data access (replace Firecrawl)
2. **Integrate Vercel AI Gateway** - Use Opencode Zen with AI Gateway instead of Google AI SDK

## Files to Create

- `src/app/api/sources/route.ts` - CRUD endpoints
- `src/lib/supabase/sources.ts` - DB operations
- `src/app/api/sources/[id]/scan/route.ts` - Trigger scan
- `src/lib/workers/portfolio-scanner.ts` - Scraping logic

## Dependencies

- Base `fetch` for scraping (replace Firecrawl)
- Vercel AI Gateway via Opencode Zen (replace Google AI SDK)
- Existing design tokens from `@/styles/colours`
