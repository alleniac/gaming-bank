import { NextResponse } from 'next/server'
import { login } from '@/services/authService'
import { getSettings, updateSettings } from '@/services/settingsService'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const passcode = (body.passcode as string | undefined)?.trim()
  const timezone = (body.timezone as string | undefined)?.trim()
  if (!passcode) {
    return NextResponse.json({ error: 'Passcode required' }, { status: 400 })
  }
  try {
    const result = await login(passcode)
    // Persist browser timezone only when server has none set, and a client timezone is provided
    if (timezone) {
      const current = getSettings()
      if (!current.timezone) {
        updateSettings({ timezone })
      }
    }
    return NextResponse.json({ ok: true, firstLogin: result.firstLogin })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 })
  }
}
