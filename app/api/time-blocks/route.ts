import { NextResponse } from 'next/server'
import { z } from 'zod'
import { TimeBlockType } from '@/domain/types'
import { createBlock, getBlocks } from '@/services/timeBlockService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

const blockSchema = z.object({
  title: z.string().min(1),
  type: z.nativeEnum(TimeBlockType),
  start: z.string(),
  end: z.string(),
  countsForFocus: z.boolean().optional(),
  tags: z.string().optional(),
  note: z.string().optional()
})

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const blocks = getBlocks()
  return NextResponse.json({ blocks })
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json().catch(() => ({}))
  const parsed = blockSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }
  const block = createBlock(parsed.data)
  return NextResponse.json({ block })
}
