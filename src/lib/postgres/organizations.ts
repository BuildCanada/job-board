import { db } from './client'
import type { Database } from './schema'

export type Organization = Database['job_board_organizations']['Insert']['id'] extends `${infer R}`
  ? Omit<Database['job_board_organizations']['Insert'], 'id'>
  : never

export async function createOrganization(data: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> {
  const result = await db
    .insertInto('job_board_organizations')
    .values({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return result as unknown as Organization
}

export async function getOrganizationByWebsite(website: string): Promise<Organization | null> {
  const result = await db
    .selectFrom('job_board_organizations')
    .selectAll()
    .where('website', '=', website)
    .executeTakeFirst()

  return result as unknown as Organization | null
}