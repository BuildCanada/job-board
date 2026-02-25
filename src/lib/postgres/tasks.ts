import { db } from './client'
import type { Database } from './schema'

export type TaskType = 'source_portfolio' | 'organization_scan' | 'job_heartbeat'
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Task {
  id: string
  task_type: TaskType
  target_id: string | null
  payload: any
  status: TaskStatus
  scheduled_at: Date
}

export async function queuePortfolioScan(sourceId: string, portfolioUrl: string): Promise<void> {
  await db
    .insertInto('job_board_private_scan_tasks')
    .values({
      task_type: 'source_portfolio',
      target_id: sourceId,
      payload: { portfolio_url: portfolioUrl },
      status: 'pending',
      scheduled_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .execute()
}

export async function queueOrganizationScan(organizationId: string, website: string): Promise<void> {
  await db
    .insertInto('job_board_private_scan_tasks')
    .values({
      task_type: 'organization_scan',
      target_id: organizationId,
      payload: { website },
      status: 'pending',
      scheduled_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .execute()
}

export async function queueJobHeartbeat(jobId: string, postingUrl: string): Promise<void> {
  await db
    .insertInto('job_board_private_scan_tasks')
    .values({
      task_type: 'job_heartbeat',
      target_id: jobId,
      payload: { posting_url: postingUrl },
      status: 'pending',
      scheduled_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .execute()
}

export async function getPendingTasks(limit: number = 10): Promise<Task[]> {
  const result = await db
    .selectFrom('job_board_private_scan_tasks')
    .selectAll()
    .where('status', '=', 'pending')
    .where('scheduled_at', '<=', new Date())
    .orderBy('scheduled_at', 'asc')
    .limit(limit)
    .execute()

  return result.rows as unknown as Task[]
}

export async function updateTaskStatus(taskId: string, status: 'processing' | 'completed' | 'failed', error?: string): Promise<void> {
  const updateData: any = { status, updated_at: new Date() }
  if (error) updateData.error = error

  await db
    .updateTable('job_board_private_scan_tasks')
    .set(updateData)
    .where('id', '=', taskId)
    .execute()
}