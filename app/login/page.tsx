import { redirect } from 'next/navigation'
import LoginClient from './LoginClient'
import { isAuthenticated } from '@/services/authService'
import { getPasscodeHash } from '@/services/settingsService'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  if (await isAuthenticated()) redirect('/')
  const firstRun = !getPasscodeHash()
  return (
    <main className="min-h-[60vh] flex items-center">
      <LoginClient firstRun={firstRun} />
    </main>
  )
}
