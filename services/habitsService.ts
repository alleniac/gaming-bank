import { localDateKey, weekWindow } from '../domain/time'
import { createHabit, getHabitCheckinsForRange, listHabits, removeHabit, setHabitCheckin, updateHabit } from '../data/habitsRepo'
import { ensureDatabase } from '../lib/bootstrap'
import { runMaintenance } from './maintenanceService'
import { getSettings } from './settingsService'

export function getHabits() {
  ensureDatabase()
  runMaintenance()
  return listHabits()
}

export function addHabit(name: string, rewardMinutes: number) {
  ensureDatabase()
  runMaintenance()
  return createHabit({ name, reward_minutes: rewardMinutes })
}

export function editHabit(id: string, updates: { name?: string; reward_minutes?: number; active?: boolean }) {
  ensureDatabase()
  runMaintenance()
  updateHabit(id, {
    name: updates.name,
    reward_minutes: updates.reward_minutes,
    active: updates.active !== undefined ? (updates.active ? 1 : 0) : undefined
  })
}

export function deleteHabit(id: string) {
  ensureDatabase()
  runMaintenance()
  removeHabit(id)
}

export function toggleHabitCheckin(id: string, dateKey?: string, checked = true) {
  ensureDatabase()
  runMaintenance()
  const settings = getSettings()
  const timezone = settings.timezone || 'UTC'
  const dayKey = dateKey ?? localDateKey(new Date(), timezone)
  setHabitCheckin(id, dayKey, checked)
}

export function getCurrentWeekCheckins(now = new Date()) {
  ensureDatabase()
  runMaintenance()
  const settings = getSettings()
  const timezone = settings.timezone || 'UTC'
  const { start, end } = weekWindow(now, timezone)
  const startKey = localDateKey(start, timezone)
  const endKey = localDateKey(end, timezone)
  const habits = listHabits()
  const checkins = getHabitCheckinsForRange(startKey, endKey)
  return { habits, checkins, startKey, endKey }
}
