import db from '../data/db'
import { runMigrations } from '../data/migrations'

let initialized = false

export function ensureDatabase() {
  if (initialized) return
  runMigrations(db)
  initialized = true
}
