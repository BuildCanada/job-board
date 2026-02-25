# Sources Feature - Missing Pieces Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Sources feature by adding task processing worker, organizations module, and integration.

**Architecture:** Task processor worker consumes scan_tasks, portfolio scanner creates orgs and queues follow-up scans.

**Tech Stack:** Next.js, Supabase, Cheerio

---

### Task 9: Create Organizations DB Module

**File:** `src/lib/supabase/organizations.ts`

Create DB operations for organizations table (similar to sources):

```typescript
import { supabase, supabaseService } from './client'

export type Organization = {
  id: string
  name: string
  city: string | null
  province: string | null
  country: string | null
  address: string | null
  description: string | null
  website: string | null
  careers_page: string | null
  canadian_status: 'unscanned' | 'canadian' | 'not_canadian' | 'no_address'
  created_at: string
  updated_at: string
}

export type OrgInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'>

export async function createOrganization(data: OrgInsert): Promise<Organization> {
  const { data: org, error } = await supabaseService
    .from('organizations')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return org
}

export async function getOrganizationByWebsite(website: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select()
    .eq('website', website)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return data
}
```

---

### Task 10: Complete Task Queue Module

**File:** `src/lib/supabase/tasks.ts`

Add queue functions for organization and job heartbeat tasks:

```typescript
import { supabaseService } from './client'

export type TaskType = 'source_portfolio' | 'organization_scan' | 'job_heartbeat'

export async function queuePortfolioScan(sourceId: string, portfolioUrl: string): Promise<void> {
  const { error } = await supabaseService
    .from('scan_tasks')
    .insert({
      task_type: 'source_portfolio',
      target_id: sourceId,
      payload: { portfolio_url: portfolioUrl },
      status: 'pending',
    })

  if (error) throw new Error(`Failed to queue portfolio scan: ${error.message}`)
}

export async function queueOrganizationScan(organizationId: string, website: string): Promise<void> {
  const { error } = await supabaseService
    .from('scan_tasks')
    .insert({
      task_type: 'organization_scan',
      target_id: organizationId,
      payload: { website },
      status: 'pending',
    })

  if (error) throw new Error(`Failed to queue organization scan: ${error.message}`)
}

export async function queueJobHeartbeat(jobId: string, postingUrl: string): Promise<void> {
  const { error } = await supabaseService
    .from('scan_tasks')
    .insert({
      task_type: 'job_heartbeat',
      target_id: jobId,
      payload: { posting_url: postingUrl },
      status: 'pending',
    })

  if (error) throw new Error(`Failed to queue job heartbeat: ${error.message}`)
}

export async function getPendingTasks(limit: number = 10): Promise<Task[]> {
  const { data, error } = await supabaseService
    .from('scan_tasks')
    .select()
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function updateTaskStatus(taskId: string, status: 'processing' | 'completed' | 'failed', error?: string): Promise<void> {
  const updateData: any = { status, updated_at: new Date().toISOString() }
  if (error) updateData.error = error

  const { error: err } = await supabaseService
    .from('scan_tasks')
    .update(updateData)
    .eq('id', taskId)

  if (err) throw new Error(`Failed to update task status: ${err.message}`)
}

export type Task = {
  id: string
  task_type: TaskType
  target_id: string | null
  payload: any
  status: string
  scheduled_at: string
}
```

---

### Task 11: Create Portfolio Scanner Worker (Enhanced)

**File:** `src/lib/workers/portfolio-scanner.ts`

Enhance to create organizations and queue follow-up tasks:

```typescript
import * as cheerio from 'cheerio'
import { createOrganization, getOrganizationByWebsite } from '@/lib/supabase/organizations'
import { queueOrganizationScan } from '@/lib/supabase/tasks'

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function normalizeUrl(url: string): string {
  const urlObj = new URL(url)
  if (urlObj.pathname === '/') {
    urlObj.pathname = '/'
  } else {
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '')
  }
  urlObj.search = ''
  urlObj.hash = ''
  return urlObj.toString()
}

export async function scanPortfolio(portfolioUrl: string, sourceId: string): Promise<{ found: number; created: number }> {
  if (!isValidUrl(portfolioUrl)) {
    throw new Error(`Invalid portfolio URL: ${portfolioUrl}`)
  }

  const response = await fetch(portfolioUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BuildCanada/1.0)' }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${portfolioUrl}: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const seen = new Set<string>()
  let createdCount = 0

  for (const link of $('a[href]').toArray()) {
    const href = $(link).attr('href')
    if (!href) continue

    if (!isValidUrl(href)) continue

    const normalizedHref = normalizeUrl(href)

    if (seen.has(normalizedHref)) continue
    seen.add(normalizedHref)

    const skipPatterns = [/twitter\.com/, /linkedin\.com/, /facebook\.com/, /youtube\.com/, /github\.com/]
    if (skipPatterns.some(pattern => pattern.test(normalizedHref))) continue

    // Check if org already exists
    const existing = await getOrganizationByWebsite(normalizedHref)
    if (existing) continue

    // Create organization
    await createOrganization({
      name: normalizedHref, // Will be updated during org scan
      website: normalizedHref,
      canadian_status: 'unscanned',
    })

    // Queue organization scan
    await queueOrganizationScan(normalizedHref, normalizedHref)
    createdCount++
  }

  return { found: seen.size, created: createdCount }
}
```

---

### Task 12: Create Task Processing Worker

**File:** `src/lib/workers/task-processor.ts`

Process queued scan_tasks:

```typescript
import { getPendingTasks, updateTaskStatus, TaskType } from '@/lib/supabase/tasks'
import { scanPortfolio } from './portfolio-scanner'

export async function processTasks(limit: number = 10): Promise<number> {
  const tasks = await getPendingTasks(limit)
  
  for (const task of tasks) {
    await updateTaskStatus(task.id, 'processing')

    try {
      switch (task.task_type) {
        case 'source_portfolio':
          await processSourcePortfolio(task)
          break
        case 'organization_scan':
          // TODO: Implement org scanner
          throw new Error('Organization scanner not yet implemented')
        case 'job_heartbeat':
          // TODO: Implement heartbeat worker
          throw new Error('Job heartbeat not yet implemented')
      }

      await updateTaskStatus(task.id, 'completed')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await updateTaskStatus(task.id, 'failed', message)
    }
  }

  return tasks.length
}

async function processSourcePortfolio(task: Task): Promise<void> {
  const { portfolio_url } = task.payload
  
  if (!portfolio_url) {
    throw new Error('Missing portfolio_url in payload')
  }

  if (!task.target_id) {
    throw new Error('Missing target_id')
  }

  const result = await scanPortfolio(portfolio_url, task.target_id)
  console.log(`Portfolio scan: ${result.found} links found, ${result.created} orgs created`)
}
```

---

### Task 13: Integrate Task Processor into Cloudflare Worker

**File:** `custom-worker.ts`

Add task processing to scheduled cron trigger:

```typescript
export default {
  fetch: handler.fetch,

  async queue(
    batch: MessageBatch<unknown>,
    env: CloudflareEnv,
    ctx: ExecutionContext
  ) {
    for (const message of batch.messages) {
      console.log(`Processing message ${message.id}:`, JSON.stringify(message.body))
      message.ack()
    }
  },

  async scheduled(
    controller: ScheduledController,
    env: CloudflareEnv,
    ctx: ExecutionContext
  ) {
    switch (controller.cron) {
      case "0 * * * *":
        console.log(`Hourly task processor triggered at ${new Date(controller.scheduledTime).toISOString()}`)
        
        // Process pending tasks
        const processed = await processTasks(10)
        console.log(`Processed ${processed} tasks`)
        
        break
      default:
        console.log(`Unrecognized cron pattern: ${controller.cron}`)
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
```

---

**Plan ready. Execute?**