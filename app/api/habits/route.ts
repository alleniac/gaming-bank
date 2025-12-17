import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addHabit, getHabits } from '@/services/habitsService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

const habitSchema = z.object({
  name: z.string().min(1),
  rewardMinutes: z.number().int().nonnegative()
})

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const habits = getHabits()
  return NextResponse.json({ habits })
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const parsed = habitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  const habit = addHabit(parsed.data.name, parsed.data.rewardMinutes)
  return NextResponse.json({ habit })
}
