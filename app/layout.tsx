import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import Link from 'next/link'
import { isAuthenticated } from '@/services/authService'
import { getSettings } from '@/services/settingsService'
import TimezoneUpdater from './TimezoneUpdater'
import './globals.css'

const font = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Gaming Bank',
  description: 'Track focus-for-gaming economy with habits, debt, and decay.'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated()
  const settings = getSettings()
  return (
    <html lang="en">
      <body className={font.className}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 shadow-lg" />
              <div>
                <div className="text-xl font-semibold">Gaming Bank</div>
              </div>
            </div>
            {authed ? (
              <nav className="flex gap-2 text-sm font-medium text-slate-700" style={{ columnGap: '8px' }}>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-lg hover:bg-sky-100 hover:text-slate-900 transition-colors shadow-sm bg-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/time-blocks"
                  className="px-4 py-2 rounded-lg hover:bg-sky-100 hover:text-slate-900 transition-colors shadow-sm bg-white"
                >
                  Time Blocks
                </Link>
                <Link
                  href="/habits"
                  className="px-4 py-2 rounded-lg hover:bg-sky-100 hover:text-slate-900 transition-colors shadow-sm bg-white"
                >
                  Habits
                </Link>
                <Link
                  href="/ledger"
                  className="px-4 py-2 rounded-lg hover:bg-sky-100 hover:text-slate-900 transition-colors shadow-sm bg-white"
                >
                  Ledger
                </Link>
                <Link
                  href="/settlements"
                  className="px-4 py-2 rounded-lg hover:bg-sky-100 hover:text-slate-900 transition-colors shadow-sm bg-white"
                >
                  Settlements
                </Link>
                <Link
                  href="/settings"
                  className="px-4 py-2 rounded-lg hover:bg-sky-100 hover:text-slate-900 transition-colors shadow-sm bg-white"
                >
                  Settings
                </Link>
              </nav>
            ) : null}
          </header>
          {authed ? <TimezoneUpdater timezone={settings.timezone} /> : null}
          {children}
        </div>
      </body>
    </html>
  )
}
