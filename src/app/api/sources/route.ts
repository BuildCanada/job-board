import { NextRequest, NextResponse } from 'next/server'
import { createSource, getSources } from '@/lib/supabase/sources'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  portfolio_url: z.string().url().optional().or(z.literal(''))
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1),
      100
    )
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    const sources = await getSources(limit, offset)
    return NextResponse.json({ sources })
  } catch (error: unknown) {
    console.error('Failed to get sources:', error)
    return NextResponse.json({ error: 'Failed to get sources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = schema.parse(body)

    const source = await createSource({
      name: validated.name,
      description: validated.description ?? null,
      website: validated.website ?? null,
      portfolio_url: validated.portfolio_url ?? null
    })
    return NextResponse.json({ source }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Failed to create source:', error)
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 })
  }
}