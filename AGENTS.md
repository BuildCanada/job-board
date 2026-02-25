# AGENTS.md - Build Canada Job Board

## Project Overview

Next.js 16 job board application deployed to Cloudflare Pages via OpenNext. Uses App Router, TypeScript, and Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Deployment**: Cloudflare Pages (OpenNext adapter)
- **Linting**: ESLint with Next.js + TypeScript config
- **Runtime**: Node.js 20.19.0 (via mise)

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
├── src/app/               # Next.js App Router pages
│   ├── layout.tsx        # Root layout with fonts
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles + Tailwind config
├── public/               # Static assets
├── cloudflare-env.d.ts  # Cloudflare bindings types
├── next.config.ts       # Next.js configuration
├── tsconfig.json        # TypeScript config
└── eslint.config.mjs   # ESLint configuration
```

## Key Conventions

1. **Metadata**: Use Next.js `Metadata` type for page metadata
2. **Fonts**: Use `next/font/google` for Google Fonts
3. **Images**: Use `next/image` for optimized images
4. **Environment**: Cloudflare bindings available via `@opennextjs/cloudflare`

## Common Patterns

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
