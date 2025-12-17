import { TimeBlockType } from '../domain/types'
import db from './db'
import { DbTimeBlock } from './types'

export type TimeBlockInsert = {
  id: string
  title: string
  type: TimeBlockType
  start_ts: number
  end_ts: number
  duration_minutes: number
  counts_for_focus: number
  tags?: string | null
  note?: string | null
  processed_effect_minutes?: number
  processed_snapshot?: string | null
  created_at: number
  updated_at: number
  deleted?: number
}

export function insertTimeBlock(block: TimeBlockInsert) {
  db.prepare(
    `INSERT INTO time_blocks
    (id, title, type, start_ts, end_ts, duration_minutes, counts_for_focus, tags, note, processed_effect_minutes, processed_snapshot, created_at, updated_at, deleted)
    VALUES (@id, @title, @type, @start_ts, @end_ts, @duration_minutes, @counts_for_focus, @tags, @note, @processed_effect_minutes, @processed_snapshot, @created_at, @updated_at, @deleted)`
  ).run({
    ...block,
    tags: block.tags ?? null,
    note: block.note ?? null,
    processed_effect_minutes: block.processed_effect_minutes ?? 0,
    processed_snapshot: block.processed_snapshot ?? null,
    deleted: block.deleted ?? 0
  })
}

export function updateTimeBlock(id: string, updates: Partial<Omit<DbTimeBlock, 'id'>>) {
  const fields = Object.keys(updates)
  if (fields.length === 0) return
  const setClause = fields.map((f) => `${f} = @${f}`).join(', ')
  const stmt = db.prepare(`UPDATE time_blocks SET ${setClause} WHERE id = @id`)
  stmt.run({ ...updates, id })
}

export function getTimeBlock(id: string): DbTimeBlock | undefined {
  const row = db.prepare('SELECT * FROM time_blocks WHERE id = ?').get(id)
  return row as DbTimeBlock | undefined
}

export function listTimeBlocks(limit = 200): DbTimeBlock[] {
  const rows = db
    .prepare('SELECT * FROM time_blocks WHERE deleted = 0 ORDER BY start_ts DESC LIMIT ?')
    .all(limit) as DbTimeBlock[]
  return rows
}

export function removeTimeBlock(id: string) {
  db.prepare('UPDATE time_blocks SET deleted = 1 WHERE id = ?').run(id)
}
