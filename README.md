# Build Canada Job Board

Canadian startup jobs directory - job listings from Canadian-owned companies.

## Overview

Track sources of capital (VCs, accelerators, family offices) → scan their portfolio companies → validate Canadian companies → discover job postings.

## Features

### Sources
- CRUD API for capital sources
- Portfolio scanning triggers
- Organizations discovered from portfolio pages

### Organizations
- Canadian address validation (4 states: unscanned, canadian, not_canadian, no_address)
- Careers page discovery
- Organization scan triggers

### Jobs
- Job posting tracking
- Weekly heartbeat to verify posting URLs are live
- Auto-archive dead listings

### Backend
- Cloudflare Workers cron jobs for task processing
- Type-safe PostgreSQL queries with kysely
- Task queue system for async operations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL with kysely (type-safe queries)
- **Deployment**: Cloudflare Pages via OpenNext
- **Runtime**: Cloudflare Workers

## Getting Started

### Prerequisites

```bash
# Install dependencies
bun install
```

### Environment Variables

Create `.env.local`:
```
DATABASE_URL=postgresql://...
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=postgresql://...
```

### Development

```bash
bun run dev    # Start dev server (http://localhost:3000)
bun run test    # Run tests
bun run lint    # Run ESLint
bun run build  # Production build
```

### Deployment

```bash
bun run deploy  # Build and deploy to Cloudflare Pages
```

## Project Structure

```
src/
├── app/
│   └── api/
│       └── sources/         # CRUD API
│           ├── route.ts      # List/create sources
│           └── [id]/
│               ├── route.ts   # Get/delete by ID
│               └── scan/route.ts  # Trigger portfolio scan
├── lib/
│   ├── postgres/           # PostgreSQL operations
│   │   ├── schema.ts       # Type-safe DB definitions
│   │   ├── client.ts       # kysely database client
│   │   ├── sources.ts      # Sources CRUD
│   │   ├── organizations.ts # Organizations DB ops
│   │   └── tasks.ts        # Task queue operations
│   └── workers/            # Background workers
│       ├── portfolio-scanner.ts  # Portfolio page scanner
│       └── task-processor.ts     # Task queue consumer
└── styles/                   # Design tokens/themes
```

## Development

See [AGENTS.md](./AGENTS.md) for detailed conventions and commands.
