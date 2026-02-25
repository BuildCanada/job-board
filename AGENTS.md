# AGENTS.md - Build Canada Job Board

## Project Overview

Next.js 16 job board for tracking Canadian startup jobs. Sources → Organizations → Jobs pipeline with automated scanning and validation.

## Features

**Sources**: Capital sources (VCs, accelerators) with portfolio tracking and organization discovery.

**Organizations**: Canadian validation with careers page discovery and scan queueing.

**Jobs**: Job posting tracking with weekly heartbeat checks and auto-archival.

**Backend**: Cloudflare Workers cron jobs with task queue processing and type-safe PostgreSQL queries.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + kysely (type-safe queries)
- **Deployment**: Cloudflare Pages (OpenNext adapter)
- **Runtime**: Cloudflare Workers

## Essential Commands

```bash
# Development
bun run dev                    # Start Next.js dev server (http://localhost:3000)
bun run lint                   # Run ESLint
bun test                       # Run tests (*.test.ts/*.test.tsx files)

# Build & Deploy
bun run build                  # Production build
bun run preview                # Preview on Cloudflare runtime locally
bun run deploy                 # Build and deploy to Cloudflare

# Types
bun run cf-typegen            # Generate Cloudflare binding types

# Single test file
bun test path/to/file.test.ts
```

## Testing

- **Framework**: Bun test runner (built into Bun)
- **Pattern**: `*.test.ts` or `*.test.tsx`
- **Run all**: `bun test`
- **Run single**: `bun test <path>`

**Status**: Tests pending - to be added after API routes finalized.

## Code Style

- **TypeScript**: Strict mode enabled (`tsconfig.json:7`)
- **Path aliases**: Use `@/*` for imports (e.g., `import { foo } from "@/lib/foo"`)
- **Components**: Use functional components with TypeScript interfaces
- **Server Components**: Default - add `"use client"` directive only when needed
- **No semicolons** at end of statements
- **Double quotes** for imports, single quotes in JSX/TSX
- **Tailwind v4**: Uses `@import "tailwindcss"` and `@theme inline` for custom properties
- **Tailwind classes**: Prefer utility classes over custom CSS

## File Structure

```
job-board/
├── docs/
│   ├── plans/              # Implementation plans and designs
│   │   ├── 2026-02-25-supabase-schema-design.md
│   │   └── ...
│   └── issues/             # Issue tracking
├── src/
│   ├── app/
│   │   ├── route.tsx       # Home page
│   │   ├── layout.tsx      # Root layout
│   │   ├── globals.css     # Global styles + Tailwind
│   │   └── api/
│   │       └── sources/    # Sources CRUD API
│   │           ├── route.ts  # List/create sources
│   │           └── [id]/
│   │               ├── route.ts  # Get/delete by ID
│   │               └── scan/route.ts  # Trigger portfolio scan
│   ├── lib/
│   │   ├── postgres/      # PostgreSQL operations
│   │   │   ├── schema.ts  # Type-safe DB definitions (kysely)
│   │   │   ├── client.ts  # Database client
│   │   │   ├── sources.ts  # Sources CRUD
│   │   │   ├── organizations.ts  # Organizations DB ops
│   │   │   └── tasks.ts   # Task queue operations
│   │   └── workers/       # Background workers
│   │       ├── portfolio-scanner.ts  # Portfolio page scanner
│   │       └── task-processor.ts    # Task queue consumer
│   └── styles/             # Design tokens/themes
├── supabase/migrations/  # Database migrations (legacy folder name)
├── custom-worker.ts       # Cloudflare worker entrypoint
└── wrangler.jsonc       # Cloudflare Workers config
```

## Key Conventions

1. **Metadata**: Use Next.js `Metadata` type for page metadata
2. **Fonts**: Use `next/font/google` for Google Fonts
3. **Images**: Use `next/image` for optimized images
4. **Environment**: Cloudflare bindings available via `@opennextjs/cloudflare`

## Database

- **Schema**: PostgreSQL (job_board for public, job_board_private for private)
- **ORM**: kysely (type-safe SQL queries)
- **Migration**: SQL scripts in `supabase/migrations/`

**Tables:**
- `job_board_sources` - Capital sources (VC, accelerators)
- `job_board_organizations` - Companies with Canadian validation
- `job_board_jobs` - Job postings with heartbeat tracking
- `job_board_private_scan_tasks` - Task queue for async operations

**kysely Queries:**
- Type-safe schema definitions in `src/lib/postgres/schema.ts`
- All queries use `.selectFrom()`, `.insertInto()`, `.updateTable()`, `.deleteFrom()`
- Results are TypeScript-typed from schema

**Example:**
```typescript
import { db } from './client'
import type { Database } from './schema'

const sources = await db
  .selectFrom('job_board_sources')
  .selectAll()
  .where('created_at', '>', new Date('2025-01-01'))
  .execute()
```

```typescript
// Page component (Server Component by default)
export default function Page() {
  return <div>...</div>;
}

// Client component when needed
"use client";

export default function ClientComponent() {
  return <div>...</div>;
}
```
