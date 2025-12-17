import { NextResponse } from 'next/server'
import { z } from 'zod'
import { deleteHabit, editHabit } from '@/services/habitsService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

const updateSchema = z.object({
  name: z.string().optional(),
  rewardMinutes: z.number().int().nonnegative().optional(),
  active: z.boolean().optional()
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  editHabit(resolvedParams.id, {
    name: parsed.data.name,
    reward_minutes: parsed.data.rewardMinutes,
    active: parsed.data.active
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  deleteHabit(resolvedParams.id)
  return NextResponse.json({ ok: true })
}
