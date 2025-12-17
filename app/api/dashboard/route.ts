import { NextResponse } from 'next/server'
import { getDashboard } from '@/services/dashboardService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = getDashboard()
  return NextResponse.json({ data })
}
