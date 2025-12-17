import { randomUUID } from 'crypto'
import { SettlementStatus } from '../domain/types'
import db from './db'
import { DbSettlement } from './types'

export function createPenalty(params: {
  week_start_ts: number
  penalty_minutes: number
  penalty_usd: number
}): DbSettlement {
  const id = randomUUID()
  const now = Date.now()
  db.prepare(
    `INSERT INTO settlements (id, week_start_ts, penalty_minutes, penalty_usd, status, created_at, settled_at, note)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`
  ).run(id, params.week_start_ts, params.penalty_minutes, params.penalty_usd, SettlementStatus.PENDING, now)
  return getSettlement(id)!
}

export function getPenaltyForWeek(weekStartTs: number): DbSettlement | undefined {
  return db
    .prepare('SELECT * FROM settlements WHERE week_start_ts = ? LIMIT 1')
    .get(weekStartTs) as DbSettlement | undefined
}

export function listSettlements(): DbSettlement[] {
  return db.prepare('SELECT * FROM settlements ORDER BY created_at DESC').all() as DbSettlement[]
}

export function getSettlement(id: string): DbSettlement | undefined {
  return db.prepare('SELECT * FROM settlements WHERE id = ?').get(id) as DbSettlement | undefined
}

export function settlePenalty(id: string, note?: string) {
  const now = Date.now()
  db.prepare('UPDATE settlements SET status = ?, settled_at = ?, note = ? WHERE id = ?').run(
    SettlementStatus.SETTLED,
    now,
    note ?? null,
    id
  )
}
