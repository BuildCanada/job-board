import { supabaseService } from './client'

export type TaskType = 'source_portfolio' | 'organization_scan' | 'job_heartbeat'
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Task {
  id: string
  task_type: TaskType
  target_id: string | null
  payload: any
  status: TaskStatus
  scheduled_at: string
}

interface UpdateTaskData {
  status: TaskStatus
  updated_at: string
  error?: string
}

export async function queuePortfolioScan(sourceId: string, portfolioUrl: string): Promise<void> {
  const { error } = await supabaseService
    .from('job_board_private.scan_tasks')
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
    .from('job_board_private.scan_tasks')
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
    .from('job_board_private.scan_tasks')
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
    .from('job_board_private.scan_tasks')
    .select()
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function updateTaskStatus(taskId: string, status: 'processing' | 'completed' | 'failed', error?: string): Promise<void> {
  const updateData: UpdateTaskData = { status, updated_at: new Date().toISOString() }
  if (error) updateData.error = error

  const { error: err } = await supabaseService
    .from('job_board_private.scan_tasks')
    .update(updateData)
    .eq('id', taskId)

  if (err) throw new Error(`Failed to update task status: ${err.message}`)
}