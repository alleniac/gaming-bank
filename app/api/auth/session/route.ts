import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/services/authService'
import { getPasscodeHash } from '@/services/settingsService'

export const runtime = 'nodejs'

export async function GET() {
  const authed = await isAuthenticated()
  const passcodeSet = Boolean(getPasscodeHash())
  return NextResponse.json({ authenticated: authed, passcodeSet })
}
