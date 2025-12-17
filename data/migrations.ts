import Database from 'better-sqlite3'
import { defaultSettings } from '../domain/settings'

export type Migration = {
  id: number
  name: string
  up: (db: Database.Database) => void
}

const migrations: Migration[] = [
  {
    id: 1,
    name: 'initial-schema',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS time_blocks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          start_ts INTEGER NOT NULL,
          end_ts INTEGER NOT NULL,
          duration_minutes INTEGER NOT NULL,
          counts_for_focus INTEGER NOT NULL DEFAULT 0,
          tags TEXT,
          note TEXT,
          processed_effect_minutes INTEGER NOT NULL DEFAULT 0,
          processed_snapshot TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS ledger_entries (
          id TEXT PRIMARY KEY,
          created_at INTEGER NOT NULL,
          type TEXT NOT NULL,
          amount_minutes INTEGER NOT NULL,
          block_id TEXT,
          note TEXT,
          metadata TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger_entries(created_at);
        CREATE INDEX IF NOT EXISTS idx_ledger_block ON ledger_entries(block_id);

        CREATE TABLE IF NOT EXISTS habits (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          reward_minutes INTEGER NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS habit_checkins (
          id TEXT PRIMARY KEY,
          habit_id TEXT NOT NULL,
          local_date TEXT NOT NULL,
          checked INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          UNIQUE(habit_id, local_date),
          FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settlements (
          id TEXT PRIMARY KEY,
          week_start_ts INTEGER NOT NULL,
          penalty_minutes INTEGER NOT NULL,
          penalty_usd INTEGER NOT NULL,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          settled_at INTEGER,
          note TEXT
        );
      `)

      const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
      Object.entries(defaultSettings).forEach(([key, value]) => {
        insertSetting.run(key, JSON.stringify(value))
      })
    }
  }
]

function ensureMigrationsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `)
}

export function runMigrations(db: Database.Database) {
  ensureMigrationsTable(db)
  const appliedRows = db.prepare('SELECT id FROM schema_migrations').all() as { id: number }[]
  const appliedIds = new Set(appliedRows.map((r) => r.id))

  const applyStmt = db.prepare('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)')

  migrations
    .sort((a, b) => a.id - b.id)
    .forEach((migration) => {
      if (appliedIds.has(migration.id)) {
        return
      }
      db.transaction(() => {
        migration.up(db)
        applyStmt.run(migration.id, migration.name, Date.now())
      })()
    })
}
