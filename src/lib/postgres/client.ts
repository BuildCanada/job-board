import { Pool } from "pg"
import { Kysely, PostgresDialect } from "kysely"
import type { Database } from "./schema"

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// kysely instance
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
})

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  await pool.end()
}