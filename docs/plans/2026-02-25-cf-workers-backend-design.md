# Cloudflare Workers Backend Design

**Date:** 2026-02-25  
**Status:** Approved

## Overview

All backend functions run on Cloudflare Workers, except database queries (Supabase). Worker handles cron triggers, task processing, and AI integration.

## Architecture

All backend logic runs in Cloudflare Workers, except database queries (Supabase). Worker communicates with:
- **Supabase** - For data storage and task queue
- **Vercel AI Gateway** - For AI operations
- **External websites** - For scraping/fetching

## Worker Structure

```
custom-worker.ts
├── scheduled handler    - Cron triggers
├── queue handler       - Queue message processing  
└── API routes          - Optional: internal API for task triggering
```

## Cron Jobs (via wrangler.jsonc)

```json
{
  "triggers": {
    "crons": [
      "0 * * * *",        // Hourly: process pending scan_tasks
      "0 0 * * 0",        // Weekly: queue job heartbeat tasks
      "0 0 * * *"         // Daily: process any stuck tasks
    ]
  }
}
```

## Task Processing Flow

1. **Cron fires** → Worker wakes up
2. **Query Supabase** → Fetch pending `scan_tasks`
3. **Process each task**:
   - If `source_portfolio` → call portfolio scanner
   - If `organization_scan` → call org scanner
   - If `job_heartbeat` → call heartbeat worker
4. **Update Supabase** → Mark task complete/failed
5. **Queue next task** → Insert new tasks as needed

## Vercel AI SDK Integration

```typescript
import { generateText } from "ai";
import { createVercelAI } from "@opennextjs/cloudflare/ai";

// In worker:
const ai = createVercelAI(env.AI);
const result = await generateText({
  model: ai("gpt-4o"),
  prompt: "..."
});
```

## Files to Modify

- `custom-worker.ts` - Add task processing logic
- `wrangler.jsonc` - Configure cron schedules
- New: `src/lib/workers/` - Worker task modules

## Environment Variables

- `SUPABASE_URL` - Already configured
- `SUPABASE_SERVICE_KEY` - For worker DB access
- `AI_GATEWAY_URL` - Vercel AI Gateway endpoint
- `AI_GATEWAY_API_KEY` - For AI requests
