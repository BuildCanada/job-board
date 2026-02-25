import { supabase, supabaseService } from './client'

export type Source = {
  id: string
  name: string
  description: string | null
  website: string | null
  portfolio_url: string | null
  created_at: string
  updated_at: string
}

export type SourceInsert = Omit<Source, 'id' | 'created_at' | 'updated_at'>

export async function createSource(data: SourceInsert): Promise<Source> {
  const { data: source, error } = await supabaseService
    .from('job_board.sources')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return source
}

export async function getSources(limit: number = 50, offset: number = 0): Promise<Source[]> {
  const { data, error } = await supabase
    .from('job_board.sources')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data || []
}

export async function getSourceById(id: string): Promise<Source | null> {
  const { data, error } = await supabase
    .from('job_board.sources')
    .select()
    .eq('id', id)
    .single()

  if (error?.code === 'PGRST116') return null // Not found
  if (error) throw error
  return data
}

export async function deleteSource(id: string): Promise<void> {
  const { error } = await supabaseService
    .from('job_board.sources')
    .delete()
    .eq('id', id)

  if (error) throw error
}