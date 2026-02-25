import { sql } from 'kysely'

export type UUID = string

export interface Database {
  job_board_sources: {
    id: UUID
    name: string
    description: string | null
    website: string | null
    portfolio_url: string | null
    created_at: Date
    updated_at: Date
  }
  job_board_organizations: {
    id: UUID
    name: string
    city: string | null
    province: string | null
    country: string | null
    address: string | null
    description: string | null
    website: string | null
    careers_page: string | null
    canadian_status: 'unscanned' | 'canadian' | 'not_canadian' | 'no_address'
    created_at: Date
    updated_at: Date
  }
  job_board_jobs: {
    id: UUID
    organization_id: string | null
    title: string
    city: string | null
    province: string | null
    remote_ok: boolean
    salary_min: number | null
    salary_max: number | null
    description: string | null
    posting_url: string
    last_checked_at: Date | null
    status: 'active' | 'archived'
    created_at: Date
    updated_at: Date
  }
  job_board_private_scan_tasks: {
    id: UUID
    task_type: 'source_portfolio' | 'organization_scan' | 'job_heartbeat'
    target_id: string | null
    payload: any
    status: 'pending' | 'processing' | 'completed' | 'failed'
    retry_count: number
    max_retries: number
    scheduled_at: Date
    created_at: Date
    updated_at: Date
  }
}