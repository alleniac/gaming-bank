import db from './db'

export function getSettings(): Record<string, unknown> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  return rows.reduce<Record<string, unknown>>((acc, row) => {
    try {
      acc[row.key] = JSON.parse(row.value)
    } catch {
      acc[row.key] = row.value
    }
    return acc
  }, {})
}

export function setSettings(partial: Record<string, unknown>) {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
  const now = Date.now()
  const tx = db.transaction((entries: [string, unknown][]) => {
    entries.forEach(([key, value]) => {
      const toStore = JSON.stringify(value)
      stmt.run(key, toStore)
    })
    const lastSeen = db.prepare('INSERT INTO system_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    lastSeen.run('last_settings_update', JSON.stringify(now))
  })
  tx(Object.entries(partial))
}

export function getSetting<T>(key: string): T | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  if (!row) return null
  try {
    return JSON.parse(row.value) as T
  } catch {
    return row.value as unknown as T
  }
}
