import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'
import { isAuthenticated } from '@/services/authService'
import { getSettings } from '@/services/settingsService'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  if (!(await isAuthenticated())) redirect('/login')
  const settings = getSettings()
  return (
    <main>
      <SettingsClient settings={settings} />
    </main>
  )
}
