import { supabaseService } from './client'

export type TaskType = 'source_portfolio' | 'organization_scan' | 'job_heartbeat'

export async function queuePortfolioScan(sourceId: string, portfolioUrl: string): Promise<void> {
  try {
    const { error } = await supabaseService
      .from('scan_tasks')
      .insert({
        task_type: 'source_portfolio',
        target_id: sourceId,
        payload: { portfolio_url: portfolioUrl },
        status: 'pending',
      })

    if (error) {
      throw new Error(`Failed to queue portfolio scan: ${error.message}`)
    }
  } catch (err) {
    throw err
  }
}