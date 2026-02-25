# Migration Todo List

## Overview

Migrate from CanadianStartupJobs (prototype) to job-board (production-ready, hooked into live systems).

## Todo Items

### High Priority

1. **Explore CanadianStartupJobs codebase to understand existing implementation**
   - Status: completed
   - Understand data models, workers, scraping logic, API routes

2. **Explore job-board codebase structure**
   - Status: completed
   - Understand existing Supabase setup, API routes, components, theme system

3. **Create Supabase schemas (public: job_board, private: job_board_private)**
   - Status: design completed
   - Design: docs/plans/2026-02-25-supabase-schema-design.md
   - Plan: docs/plans/2026-02-25-supabase-schema-plan.md
   - Convert from Drizzle to Supabase
   - Public data: Source, Organization, Job entries
   - Private data: heartbeat tasks, scanning tasks in queue

4. **Migrate Sources feature (capital sources - VC, Family Offices, Accelerators)**
   - Status: design completed
   - Design: docs/plans/2026-02-25-sources-feature-design.md
   - Sources are explicitly sources of capital
   - Queue scan jobs for sources (portfolio companies)
   - Discovered portfolio entries create organization scan jobs

5. **Migrate Organizations feature with 4-state Canadian validation**
   - Status: design completed
   - Design: docs/plans/2026-02-25-organizations-feature-design.md
   - Add explicit Canadian address validation
   - 4 states: Unscanned, Canadian, Not Canadian, No Address
   - Search navs for careers link when Canadian

6. **Migrate Jobs feature with heartbeat weekly check**
   - Status: design completed
   - Design: docs/plans/2026-02-25-jobs-feature-design.md
   - Pull details from job post into data model
   - Weekly heartbeat: check if URL redirects or 404s
   - Mark as "Archived" and hide from display if dead

### Medium Priority

7. **Set up Cloudflare Workers backend for cron activities**
   - Status: design completed
   - Design: docs/plans/2026-02-25-cf-workers-backend-design.md
   - Backend is NextJS API routes / Cloudflare Workers for cron
   - Use Vercel SDK on Cloudflare Workers

8. **Configure client-side with NextJS, TailwindCSS, Zustand**
   - Status: design completed
   - Design: docs/plans/2026-02-25-client-side-config-design.md
   - Same across projects (NextJS)
   - Use Zustand for state management

9. **Use existing theme from job-board/src/styles/themes/main.css and design tokens**
   - Status: pending (defer to UI phase)
   - NOTE: User will configure separate frontend agent environment for this
   - Theme already imported to globals.css
   - Use custom colours from src/styles/colours
   - NEVER create one-off colours or fonts - ALWAYS use design tokens

## Notes

- **ASK** for the remote Supabase URL when working on schemas
- Store in `.env.local` **ONLY**
- Use Cloudflare Workers AI SDK: https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/
