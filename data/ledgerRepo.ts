import db from './db'
import { DbLedgerEntry } from './types'
import { LedgerEntryType } from '../domain/types'

export type LedgerInsert = {
  id: string
  created_at: number
  type: LedgerEntryType
  amount_minutes: number
  block_id?: string | null
  note?: string | null
  metadata?: Record<string, unknown> | null
}

function normalizeMetadata(metadata?: Record<string, unknown> | null): string | null {
  if (!metadata) return null
  return JSON.stringify(metadata)
}

export function insertLedger(entries: LedgerInsert | LedgerInsert[]) {
  const list = Array.isArray(entries) ? entries : [entries]
  const stmt = db.prepare(
    `INSERT INTO ledger_entries (id, created_at, type, amount_minutes, block_id, note, metadata)
     VALUES (@id, @created_at, @type, @amount_minutes, @block_id, @note, @metadata)`
  )
  const tx = db.transaction((payload: LedgerInsert[]) => {
    payload.forEach((entry) => {
      stmt.run({
        ...entry,
        block_id: entry.block_id ?? null,
        note: entry.note ?? null,
        metadata: normalizeMetadata(entry.metadata)
      })
    })
  })
  tx(list)
}

export function listLedger(limit = 200, offset = 0): DbLedgerEntry[] {
  const rows = db
    .prepare(
      `SELECT * FROM ledger_entries ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as (DbLedgerEntry & { metadata: string | null })[]
  return rows.map((row) => ({
    ...row,
    metadata: row.metadata ? safeParse(row.metadata) : null
  }))
}

export function ledgerChronological(): DbLedgerEntry[] {
  const rows = db
    .prepare('SELECT * FROM ledger_entries ORDER BY created_at ASC, rowid ASC')
    .all() as (DbLedgerEntry & { metadata: string | null })[]
  return rows.map((row) => ({
    ...row,
    metadata: row.metadata ? safeParse(row.metadata) : null
  }))
}

export function balance(): number {
  const row = db.prepare('SELECT COALESCE(SUM(amount_minutes), 0) as total FROM ledger_entries').get() as {
    total: number
  }
  return row.total ?? 0
}

export function latestLedgerTimestamp(): number | null {
  const row = db
    .prepare('SELECT created_at FROM ledger_entries ORDER BY created_at DESC LIMIT 1')
    .get() as { created_at: number } | undefined
  return row?.created_at ?? null
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
