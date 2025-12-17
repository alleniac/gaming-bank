import { NextResponse } from 'next/server'
import { z } from 'zod'
import { toggleHabitCheckin } from '@/services/habitsService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

const schema = z.object({
  dateKey: z.string().optional(),
  checked: z.boolean().optional()
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  toggleHabitCheckin(resolvedParams.id, parsed.data.dateKey, parsed.data.checked ?? true)
  return NextResponse.json({ ok: true })
}
