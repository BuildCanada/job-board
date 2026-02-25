# Supabase Schema Design

**Date:** 2026-02-25  
**Status:** Approved

## Overview

Create PostgreSQL schemas (public, job_board_private) to replace Drizzle ORM with Supabase-native database.

## Schemas

- **public** - Source, Organization, Job tables
- **job_board_private** - Queue tasks, heartbeat tracking

## Tables

### 1. sources (public schema)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| description | text | |
| website | text | |
| portfolio_url | text | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### 2. organizations (public schema)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| city | text | |
| province | text | |
| country | text | DEFAULT 'Canada' |
| address | text | |
| description | text | |
| website | text | |
| careers_page | text | |
| canadian_status | canadian_status | DEFAULT 'unscanned' |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Enum:** `canadian_status` ('unscanned', 'canadian', 'not_canadian', 'no_address')

### 3. jobs (public schema)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() |
| organization_id | uuid | REFERENCES organizations(id) |
| title | text | NOT NULL |
| city | text | |
| province | text | |
| remote_ok | boolean | DEFAULT false |
| salary_min | integer | |
| salary_max | integer | |
| description | text | |
| posting_url | text | NOT NULL |
| last_checked_at | timestamptz | |
| status | job_status | DEFAULT 'active' |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Enum:** `job_status` ('active', 'archived')

### 4. scan_tasks (job_board_private schema)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() |
| task_type | task_type | NOT NULL |
| target_id | uuid | |
| payload | jsonb | |
| status | text | DEFAULT 'pending' |
| retry_count | integer | DEFAULT 0 |
| max_retries | integer | DEFAULT 3 |
| scheduled_at | timestamptz | DEFAULT now() |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Enum:** `task_type` ('source_portfolio', 'organization_scan', 'job_heartbeat')

## Indexes

- `idx_organizations_canadian_status` on organizations(canadian_status)
- `idx_jobs_status` on jobs(status)
- `idx_jobs_organization_id` on jobs(organization_id)
- `idx_scan_tasks_status` on scan_tasks(status)
- `idx_scan_tasks_scheduled_at` on scan_tasks(scheduled_at)

## pg_cron Jobs

1. **heartbeat_check** - Run weekly, query jobs where last_checked_at < now() - interval '7 days', insert job_heartbeat tasks
2. **queue_processor** - Run every minute, pick up pending tasks, process and mark complete
