import { NextResponse } from 'next/server'
import { changePasscode, verifyPasscode } from '@/services/authService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const current = (body.current as string | undefined)?.trim() || ''
  const next = (body.next as string | undefined)?.trim() || ''
  if (!current || !next) return NextResponse.json({ error: 'Current and new passcode required' }, { status: 400 })
  const valid = await verifyPasscode(current)
  if (!valid) return NextResponse.json({ error: 'Invalid current passcode' }, { status: 401 })
  await changePasscode(current, next)
  return NextResponse.json({ ok: true })
}
