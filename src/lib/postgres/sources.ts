import { db } from './client'
import type { Database } from './schema'
import type { Insertable } from 'kysely'

export type Source = Database['job_board']
export type SourceInsert = Insertable<Database['job_board']>

export async function createSource(data: Omit<SourceInsert, 'created_at' | 'updated_at'>): Promise<Source> {
  const result = await db
    .insertInto('job_board')
    .values({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return result
}

export async function getSources(limit: number = 50, offset: number = 0): Promise<Source[]> {
  const result = await db
    .selectFrom('job_board')
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute()

  return result
}

export async function getSourceById(id: string): Promise<Source | null> {
  const result = await db
    .selectFrom('job_board')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  return result ?? null
}

export async function deleteSource(id: string): Promise<void> {
  await db
    .deleteFrom('job_board')
    .where('id', '=', id)
    .execute()
}