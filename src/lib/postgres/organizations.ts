import { supabase, supabaseService } from './client'

export type Organization = {
  id: string
  name: string
  city: string | null
  province: string | null
  country: string | null
  address: string | null
  description: string | null
  website: string | null
  careers_page: string | null
  canadian_status: 'unscanned' | 'canadian' | 'not_canadian' | 'no_address'
  created_at: string
  updated_at: string
}

export type OrgInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'>

export async function createOrganization(data: OrgInsert): Promise<Organization> {
  const { data: org, error } = await supabaseService
    .from('job_board.organizations')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return org
}

export async function getOrganizationByWebsite(website: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('job_board.organizations')
    .select()
    .eq('website', website)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return data
}