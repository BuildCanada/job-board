# Organizations Feature Design

**Date:** 2026-02-25  
**Status:** Approved

## Overview

Migrate Organizations feature with 4-state Canadian validation. Organizations come from source portfolio scans. Scan determines if company is Canadian and finds careers page for job scraping.

## Core Flow

1. **Create Organization** - From source portfolio scan or manual entry
2. **Queue Organization Scan** - Task added to scan_tasks
3. **Scan Process**:
   - Fetch organization website
   - Extract JSON-LD data (check for location/address)
   - If no JSON-LD, use AI to determine location
   - Set `canadian_status`: `canadian`, `not_canadian`, or `no_address`
4. **If Canadian**:
   - Search page for careers link in nav elements
   - Update `careers_page` field
   - Queue `job_heartbeat` task (future - for job scraping)
5. **If Not Canadian/No Address**:
   - Mark status, no further processing

## API Endpoints

```
POST   /api/organizations              - Create organization
GET    /api/organizations              - List organizations (filter by canadian_status)
GET    /api/organizations/:id          - Get organization by ID
POST   /api/organizations/:id/scan     - Trigger Canadian validation scan
PATCH  /api/organizations/:id          - Update organization
DELETE /api/organizations/:id          - Delete organization
```

## Task Payload (scan_tasks)

```json
{
  "task_type": "organization_scan",
  "target_id": "<organization-uuid>",
  "payload": {
    "website": "https://..."
  }
}
```

## Canadian Validation Logic

1. **Fetch website** via base HTTP
2. **Parse HTML** with Cheerio for JSON-LD `@type: Organization` or `@type: LocalBusiness`
3. **Extract address** from JSON-LD `address` or `areaServed` fields
4. **If found**: Check if Canadian (province code, country "Canada")
5. **If not found**: Use AI to extract location from page content
6. **Set status**: `canadian`, `not_canadian`, or `no_address`

## Careers Page Discovery

When status is `canadian`:
1. Parse HTML for `<nav>`, `<header>`, footer links
2. Look for patterns: `/careers`, `/jobs`, `/work-with-us`, `careers`
3. Validate link is internal to same domain
4. Update `careers_page` if found

## Files to Create

- `src/app/api/organizations/route.ts` - CRUD endpoints
- `src/lib/supabase/organizations.ts` - DB operations
- `src/app/api/organizations/[id]/scan/route.ts` - Trigger scan
- `src/lib/workers/organization-scanner.ts` - Canadian validation + careers discovery

## Dependencies

- Cheerio for HTML parsing
- Base `fetch` for HTTP
- Vercel AI Gateway (from earlier decision)
