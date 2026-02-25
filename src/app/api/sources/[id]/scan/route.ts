import { NextRequest, NextResponse } from 'next/server'
import { getSourceById } from '@/lib/postgres/sources'
import { queuePortfolioScan } from '@/lib/postgres/tasks'

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
  }

  try {
    const source = await getSourceById(id)

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    if (!source.portfolio_url) {
      return NextResponse.json({ error: 'Source has no portfolio_url' }, { status: 400 })
    }

    await queuePortfolioScan(id, source.portfolio_url)
    return NextResponse.json({ message: 'Portfolio scan queued' })
  } catch (error: unknown) {
    console.error('Failed to queue scan:', error)
    return NextResponse.json({ error: 'Failed to queue scan' }, { status: 500 })
  }
}