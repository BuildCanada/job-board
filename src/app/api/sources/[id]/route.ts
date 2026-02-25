import { NextRequest, NextResponse } from 'next/server'
import { getSourceById, deleteSource } from '@/lib/postgres/sources'

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function GET(
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

    return NextResponse.json({ source })
  } catch (error: unknown) {
    console.error('Failed to get source:', error)
    return NextResponse.json({ error: 'Failed to get source' }, { status: 500 })
  }
}

export async function DELETE(
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

    await deleteSource(id)
    return new NextResponse(null, { status: 204 })
  } catch (error: unknown) {
    console.error('Failed to delete source:', error)
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
  }
}