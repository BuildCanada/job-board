# Sources Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create CRUD API for Sources with portfolio scanning that discovers organizations.

**Architecture:** Next.js App Router API routes + Supabase client for DB + Worker for portfolio scanning.

**Tech Stack:** Next.js 16, Supabase, Cheerio (HTML parsing), Vercel AI SDK

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install required packages**

```bash
bun add @supabase/supabase-js cheerio
bun add -d @types/cheerio
```

**Step 2: Verify installation**

Run: `bun pm ls | grep -E "supabase|cheerio"`
Expected: Both packages listed

**Step 3: Update package.json if needed** (already done by bun add)

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install Supabase and Cheerio dependencies"
```

---

### Task 2: Configure Supabase Client

**Files:**
- Create: `src/lib/supabase/client.ts`

**Step 1: Create Supabase client utility**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For privileged operations (use in server components/API routes only)
export const supabaseService = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
```

**Step 2: Create env.example**

Create: `.env.local.example` with:
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

**Step 3: Commit**

```bash
git add src/lib/supabase/client.ts .env.local.example
git commit -m "feat: add Supabase client utility"
```

---

### Task 3: Create Sources DB Operations Layer

**Files:**
- Create: `src/lib/supabase/sources.ts`

**Step 1: Write the sources DB module**

```typescript
import { supabase, supabaseService } from './client'

export type Source = {
  id: string
  name: string
  description: string | null
  website: string | null
  portfolio_url: string | null
  created_at: string
  updated_at: string
}

export type SourceInsert = Omit<Source, 'id' | 'created_at' | 'updated_at'>

export async function createSource(data: SourceInsert): Promise<Source> {
  const { data: source, error } = await supabaseService
    .from('sources')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return source
}

export async function getSources(limit: number = 50, offset: number = 0): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data || []
}

export async function getSourceById(id: string): Promise<Source | null> {
  const { data, error } = await supabase
    .from('sources')
    .select()
    .eq('id', id)
    .single()

  if (error?.code === 'PGRST116') return null // Not found
  if (error) throw error
  return data
}

export async function deleteSource(id: string): Promise<void> {
  const { error } = await supabaseService
    .from('sources')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

**Step 2: Commit**

```bash
git add src/lib/supabase/sources.ts
git commit -m "feat: add sources DB operations"
```

---

### Task 4: Create CRUD API Route for Sources

**Files:**
- Create: `src/app/api/sources/route.ts`

**Step 1: Write the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSource, getSources } from '@/lib/supabase/sources'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const sources = await getSources(limit, offset)
    return NextResponse.json({ sources })
  } catch (error) {
    console.error('Failed to get sources:', error)
    return NextResponse.json({ error: 'Failed to get sources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, website, portfolio_url } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const source = await createSource({ name, description, website, portfolio_url })
    return NextResponse.json({ source }, { status: 201 })
  } catch (error) {
    console.error('Failed to create source:', error)
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/sources/route.ts
git commit -m "feat: add sources CRUD API"
```

---

### Task 5: Create Source by ID API Route

**Files:**
- Create: `src/app/api/sources/[id]/route.ts`

**Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSourceById, deleteSource } from '@/lib/supabase/sources'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const source = await getSourceById(params.id)

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    return NextResponse.json({ source })
  } catch (error) {
    console.error('Failed to get source:', error)
    return NextResponse.json({ error: 'Failed to get source' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteSource(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete source:', error)
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/sources/[id]/route.ts
git commit -m "feat: add sources by ID API"
```

---

### Task 6: Create Scan Trigger Endpoint

**Files:**
- Create: `src/app/api/sources/[id]/scan/route.ts`

**Step 1: Write the scan trigger**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSourceById } from '@/lib/supabase/sources'
import { queuePortfolioScan } from '@/lib/supabase/tasks'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const source = await getSourceById(params.id)

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    if (!source.portfolio_url) {
      return NextResponse.json({ error: 'Source has no portfolio_url' }, { status: 400 })
    }

    await queuePortfolioScan(params.id, source.portfolio_url)
    return NextResponse.json({ message: 'Portfolio scan queued' })
  } catch (error) {
    console.error('Failed to queue scan:', error)
    return NextResponse.json({ error: 'Failed to queue scan' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/sources/[id]/scan/route.ts
git commit -m "feat: add source scan trigger endpoint"
```

---

### Task 7: Create Task Queue DB Operations

**Files:**
- Create: `src/lib/supabase/tasks.ts`

**Step 1: Write the task operations**

```typescript
import { supabaseService } from './client'

exporttype TaskType = 'source_portfolio' | 'organization_scan' | 'job_heartbeat'

export async function queuePortfolioScan(sourceId: string, portfolioUrl: string): Promise<void> {
  await supabaseService
    .from('scan_tasks')
    .insert({
      task_type: 'source_portfolio',
      target_id: sourceId,
      payload: { portfolio_url: portfolioUrl },
      status: 'pending',
    })
}
```

**Step 2: Commit**

```bash
git add src/lib/supabase/tasks.ts
git commit -m "feat: add task queue operations"
```

---

### Task 8: Create Portfolio Scanner Worker

**Files:**
- Create: `src/lib/workers/portfolio-scanner.ts`

**Step 1: Write the portfolio scanner**

```typescript
import * as cheerio from 'cheerio'

export async function scanPortfolio(portfolioUrl: string): Promise<string[]> {
  // 1. Fetch the portfolio page
  const response = await fetch(portfolioUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BuildCanada/1.0)' }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${portfolioUrl}: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // 2. Extract company links
  const companyLinks: string[] = []
  const seen = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return

    // Skip non-HTTP(S) links, hashes, and internal anchors
    if (!href.startsWith('http')) return
    if (href.includes('#')) return

    // Skip common non-company links
    const skipPatterns = [/twitter\.com/, /linkedin\.com/, /facebook\.com/, /youtube\.com/]
    if (skipPatterns.some(pattern => pattern.test(href))) return

    // Deduplicate
    if (seen.has(href)) return
    seen.add(href)

    companyLinks.push(href)
  })

  return companyLinks
}
```

**Step 2: Commit**

```bash
git add src/lib/workers/portfolio-scanner.ts
git commit -m "feat: add portfolio scanner worker"
```

---

**Plan complete and saved to `docs/plans/2026-02-25-sources-feature-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?