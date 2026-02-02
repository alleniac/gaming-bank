import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'
import { mergeSettings } from '../domain/settings'
import { weekCutoffFor } from '../domain/time'
import { Settings } from '../domain/types'
import { getSetting, getSettings as loadSettings, setSettings } from '../data/settingsRepo'
import { ensureDatabase } from '../lib/bootstrap'
import { setState } from '../data/systemStateRepo'

export function getSettings(): Settings {
  ensureDatabase()
  const stored = loadSettings()
  return mergeSettings(stored as Partial<Settings>)
}

export function updateSettings(partial: Partial<Settings>) {
  ensureDatabase()
  const current = getSettings()
  const nextTimezone = partial.timezone?.trim()
  const timezoneChanged = nextTimezone && nextTimezone !== current.timezone
  setSettings(partial)
  if (timezoneChanged) {
    const now = Date.now()
    const cutoff = weekCutoffFor(now, nextTimezone).getTime()
    const baseline = DateTime.fromMillis(cutoff, { zone: nextTimezone }).minus({ weeks: 1 }).toMillis()
    setState('last_weekly_cutoff_ts', baseline)
  }
}

export function ensureAuthSecret(): string {
  ensureDatabase()
  const existing = getSetting<string>('auth_secret')
  if (existing) return existing
  const secret = randomBytes(32).toString('hex')
  setSettings({ auth_secret: secret })
  return secret
}

export function getPasscodeHash(): string | null {
  ensureDatabase()
  return (getSetting<string>('auth_passcode_hash') as string | null) ?? null
}

export function savePasscodeHash(hash: string) {
  ensureDatabase()
  setSettings({ auth_passcode_hash: hash })
}

export function ensureTimezone(timezone?: string) {
  ensureDatabase()
  if (!timezone) return
  const stored = getSetting<string>('timezone')
  if (!stored) {
    setSettings({ timezone })
  }
}
