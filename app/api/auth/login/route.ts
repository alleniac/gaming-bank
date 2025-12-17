import { NextResponse } from 'next/server'
import { login } from '@/services/authService'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const passcode = (body.passcode as string | undefined)?.trim()
  if (!passcode) {
    return NextResponse.json({ error: 'Passcode required' }, { status: 400 })
  }
  try {
    const result = await login(passcode)
    return NextResponse.json({ ok: true, firstLogin: result.firstLogin })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 })
  }
}
