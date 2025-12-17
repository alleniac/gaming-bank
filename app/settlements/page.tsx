import { redirect } from 'next/navigation'
import SettlementsClient from './SettlementsClient'
import { isAuthenticated } from '@/services/authService'
import { getSettlements } from '@/services/settlementService'

export const dynamic = 'force-dynamic'

export default async function SettlementsPage() {
  if (!(await isAuthenticated())) redirect('/login')
  const settlements = getSettlements()
  return (
    <main>
      <SettlementsClient settlements={settlements} />
    </main>
  )
}
