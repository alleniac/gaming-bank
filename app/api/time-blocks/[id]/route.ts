import { NextResponse } from 'next/server'
import { z } from 'zod'
import { TimeBlockType } from '@/domain/types'
import { deleteBlock, editBlock } from '@/services/timeBlockService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

const blockSchema = z.object({
  title: z.string().min(1),
  type: z.nativeEnum(TimeBlockType),
  start: z.string(),
  end: z.string(),
  clientTimezone: z.string().optional(),
  countsForFocus: z.boolean().optional(),
  tags: z.string().optional(),
  note: z.string().optional()
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json().catch(() => ({}))
  const parsed = blockSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }
  const block = editBlock(resolvedParams.id, parsed.data)
  return NextResponse.json({ block })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  deleteBlock(resolvedParams.id)
  return NextResponse.json({ ok: true })
}
