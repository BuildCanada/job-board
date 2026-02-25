import { getPendingTasks, updateTaskStatus, TaskType, Task } from '@/lib/supabase/tasks'
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
        default:
          throw new Error(`Unknown task type: ${task.task_type}`)
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
  console.log(`Portfolio scan for source ${task.target_id}: ${result.found} links found, ${result.created} orgs created`)
}