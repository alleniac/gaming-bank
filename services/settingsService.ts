import { randomBytes } from 'crypto'
import { mergeSettings } from '../domain/settings'
import { Settings } from '../domain/types'
import { getSetting, getSettings as loadSettings, setSettings } from '../data/settingsRepo'
import { ensureDatabase } from '../lib/bootstrap'

export function getSettings(): Settings {
  ensureDatabase()
  const stored = loadSettings()
  return mergeSettings(stored as Partial<Settings>)
}

export function updateSettings(partial: Partial<Settings>) {
  ensureDatabase()
  setSettings(partial)
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
