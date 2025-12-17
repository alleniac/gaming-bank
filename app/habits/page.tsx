import { redirect } from 'next/navigation'
import HabitsClient from './HabitsClient'
import { isAuthenticated } from '@/services/authService'
import { getCurrentWeekCheckins } from '@/services/habitsService'

export const dynamic = 'force-dynamic'

export default async function HabitsPage() {
  if (!(await isAuthenticated())) redirect('/login')
  const { habits, checkins, startKey, endKey } = getCurrentWeekCheckins()
  return (
    <main>
      <HabitsClient habits={habits} checkins={checkins} startKey={startKey} endKey={endKey} />
    </main>
  )
}
