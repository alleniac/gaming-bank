import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSettings, updateSettings } from '@/services/settingsService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

const settingsSchema = z.object({
  baseRateFocusPerGaming: z.number().int().positive().optional(),
  surchargeDay1: z.number().int().nonnegative().optional(),
  surchargeDailyIncrease: z.number().int().nonnegative().optional(),
  surchargeCap: z.number().int().nonnegative().optional(),
  softCapMinutes: z.number().int().nonnegative().optional(),
  hardCapMinutes: z.number().int().nonnegative().optional(),
  dailyDecayRate: z.number().min(0).max(1).optional(),
  habitBonusCapPercent: z.number().min(0).max(1).optional(),
  penaltyRateUsdPerDebtMinute: z.number().nonnegative().optional(),
  timezone: z.string().optional()
})

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = getSettings()
  return NextResponse.json({ settings })
}

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  updateSettings(parsed.data)
  const settings = getSettings()
  return NextResponse.json({ settings })
}
