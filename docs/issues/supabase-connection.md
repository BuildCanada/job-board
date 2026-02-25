# Supabase Connection Issue

## Problem

The migration SQL at `supabase/migrations/001_initial_schema.sql` cannot be executed due to insufficient database permissions.

## Connection Details

**Connection String:**
```
postgresql://project_job_board:<password>@db.jtaljzyogrumfcdqhfcr.supabase.co:5432/postgres
```

**Role:** `project_job_board`

### What We DO Have (Current Access)
- ✅ Extension creation (`pg_cron` was already installed)
- ✅ Connection authentication
- ✅ Role exists in database
- ✅ Data query access (SELECT, INSERT, UPDATE, DELETE on existing tables)

### What We DON'T Have (Missing Permissions)
- ❌ `CREATE TABLE` on schemas `public` and `job_board_private`
- ❌ `CREATE TYPE` (for ENUM types)
- ❌ `CREATE INDEX`
- ❌ `CREATE SCHEMA`
- ❌ DDL operations (ALTER, DROP, schema modification)

### Root Cause
The `project_job_board` role has **data-level permissions** (CRUD operations) but **no schema-level permissions** (CREATE, ALTER, DROP). This is a "restricted" role configuration typical for application data access rather than schema management.

## Solutions

### Option 1: Grant Schema Permissions (Recommended)

Ask the Supabase org operator to run these SQL commands:

```sql
-- Grant CREATE privilege on schemas
GRANT CREATE ON SCHEMA public TO project_job_board;
GRANT CREATE ON SCHEMA job_board_private TO project_job_board;

-- Grant full schema access
GRANT ALL ON SCHEMA public TO project_job_board;
GRANT ALL ON SCHEMA job_board_private TO project_job_board;
```

### Option 2: Use Service Role Key

Instead of the restricted connection string, provide the `SUPABASE_SERVICE_ROLE_KEY` from:
Supabase Dashboard → Settings → API → auth.service_role

This key has elevated permissions for schema operations.

### Option 3: Run via Supabase Dashboard

Execute the migration manually via:
Supabase Dashboard → SQL Editor → Paste `supabase/migrations/001_initial_schema.sql` content → Run

## Files Affected

- `supabase/migrations/001_initial_schema.sql` - SQL is correct, needs execution
- `.env.local` - May need `SUPABASE_SERVICE_KEY` added

## Status

**BLOCKED:** Waiting for schema permissions to complete migration.