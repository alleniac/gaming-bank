import { LedgerEntryType, SettlementStatus, TimeBlockType } from '../domain/types'

export type DbTimeBlock = {
  id: string
  title: string
  type: TimeBlockType
  start_ts: number
  end_ts: number
  duration_minutes: number
  counts_for_focus: number
  tags: string | null
  note: string | null
  processed_effect_minutes: number
  processed_snapshot: string | null
  created_at: number
  updated_at: number
  deleted: number
}

export type DbLedgerEntry = {
  id: string
  created_at: number
  type: LedgerEntryType
  amount_minutes: number
  block_id: string | null
  note: string | null
  metadata: unknown | null
}

export type DbHabit = {
  id: string
  name: string
  reward_minutes: number
  active: number
  created_at: number
  updated_at: number
}

export type DbHabitCheckin = {
  id: string
  habit_id: string
  local_date: string
  checked: number
  created_at: number
}

export type DbSettlement = {
  id: string
  week_start_ts: number
  penalty_minutes: number
  penalty_usd: number
  status: SettlementStatus
  created_at: number
  settled_at: number | null
  note: string | null
}
