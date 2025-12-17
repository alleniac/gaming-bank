import db from './db'

export function getState<T>(key: string): T | null {
  const row = db.prepare('SELECT value FROM system_state WHERE key = ?').get(key) as { value: string } | undefined
  if (!row) return null
  try {
    return JSON.parse(row.value) as T
  } catch {
    return row.value as unknown as T
  }
}

export function setState(key: string, value: unknown) {
  const stmt = db.prepare('INSERT INTO system_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
  stmt.run(key, JSON.stringify(value))
}
