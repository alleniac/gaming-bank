import { randomUUID } from 'crypto'
import db from './db'
import { DbHabit, DbHabitCheckin } from './types'

export function listHabits(): DbHabit[] {
  return db.prepare('SELECT * FROM habits ORDER BY created_at DESC').all() as DbHabit[]
}

export function createHabit(params: { name: string; reward_minutes: number }): DbHabit {
  const id = randomUUID()
  const now = Date.now()
  db.prepare(
    `INSERT INTO habits (id, name, reward_minutes, active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)`
  ).run(id, params.name, params.reward_minutes, now, now)
  return getHabit(id)!
}

export function getHabit(id: string): DbHabit | undefined {
  return db.prepare('SELECT * FROM habits WHERE id = ?').get(id) as DbHabit | undefined
}

export function updateHabit(id: string, updates: Partial<Pick<DbHabit, 'name' | 'reward_minutes' | 'active'>>) {
  const now = Date.now()
  const fields: string[] = []
  const payload: Record<string, unknown> = { id }
  if (updates.name !== undefined) {
    fields.push('name = @name')
    payload.name = updates.name
  }
  if (updates.reward_minutes !== undefined) {
    fields.push('reward_minutes = @reward_minutes')
    payload.reward_minutes = updates.reward_minutes
  }
  if (updates.active !== undefined) {
    fields.push('active = @active')
    payload.active = updates.active
  }
  fields.push('updated_at = @updated_at')
  payload.updated_at = now
  const sql = `UPDATE habits SET ${fields.join(', ')} WHERE id = @id`
  db.prepare(sql).run(payload)
}

export function removeHabit(id: string) {
  db.prepare('DELETE FROM habits WHERE id = ?').run(id)
  db.prepare('DELETE FROM habit_checkins WHERE habit_id = ?').run(id)
}

export function setHabitCheckin(habitId: string, localDate: string, checked: boolean) {
  const existing = db
    .prepare('SELECT id FROM habit_checkins WHERE habit_id = ? AND local_date = ?')
    .get(habitId, localDate) as { id: string } | undefined
  const now = Date.now()
  if (existing) {
    db.prepare('UPDATE habit_checkins SET checked = ?, created_at = ? WHERE id = ?').run(
      checked ? 1 : 0,
      now,
      existing.id
    )
  } else {
    const id = randomUUID()
    db.prepare(
      `INSERT INTO habit_checkins (id, habit_id, local_date, checked, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, habitId, localDate, checked ? 1 : 0, now)
  }
}

export function getHabitCheckinsForRange(startDate: string, endDate: string): DbHabitCheckin[] {
  return db
    .prepare(
      'SELECT * FROM habit_checkins WHERE local_date >= ? AND local_date <= ? ORDER BY local_date ASC'
    )
    .all(startDate, endDate) as DbHabitCheckin[]
}
