import { randomUUID } from 'crypto'
import { applyFocusToDebtAndEarnings } from '../domain/debt'
import { canEarn } from '../domain/decay'
import { daysBetween } from '../domain/time'
import { LedgerEntryType, TimeBlockType } from '../domain/types'
import { insertLedger } from '../data/ledgerRepo'
import { getTimeBlock, insertTimeBlock, listTimeBlocks, removeTimeBlock, updateTimeBlock } from '../data/timeBlocksRepo'
import { getSettings } from './settingsService'
import { computeLedgerState } from './ledgerState'
import { ensureDatabase } from '../lib/bootstrap'
import { runMaintenance } from './maintenanceService'

type BlockInput = {
  title: string
  type: TimeBlockType
  start: string
  end: string
  countsForFocus?: boolean
  tags?: string
  note?: string
}

type SnapshotEntry = {
  type: LedgerEntryType
  amount: number
  note?: string
  metadata?: Record<string, unknown>
}

function durationMinutes(start: number, end: number): number {
  const diff = end - start
  return Math.max(0, Math.floor(diff / 60000))
}

function parseSnapshot(snapshot: string | null): SnapshotEntry[] {
  if (!snapshot) return []
  try {
    const parsed = JSON.parse(snapshot) as { entries: SnapshotEntry[] }
    return parsed.entries ?? []
  } catch {
    return []
  }
}

function serializeSnapshot(entries: SnapshotEntry[]): string {
  return JSON.stringify({ entries })
}

function summarizeSnapshot(entries: SnapshotEntry[]): Record<LedgerEntryType, number> {
  return entries.reduce<Record<LedgerEntryType, number>>((acc, entry) => {
    acc[entry.type] = (acc[entry.type] ?? 0) + entry.amount
    return acc
  }, {} as Record<LedgerEntryType, number>)
}

export function getBlocks(limit = 200) {
  ensureDatabase()
  runMaintenance()
  return listTimeBlocks(limit)
}

function processBlockEffect(params: {
  type: TimeBlockType
  duration: number
  countsForFocus: boolean
  endTs: number
  currentBalance: number
  debtEpisodeStart: number | null
  timezone: string
}) {
  const settings = getSettings()
  const entries: SnapshotEntry[] = []
  let balance = params.currentBalance
  if (params.type === TimeBlockType.GAME) {
    const amount = -params.duration
    if (amount !== 0) {
      entries.push({
        type: LedgerEntryType.GAME_SPEND,
        amount,
        note: 'Game spend'
      })
      balance += amount
    }
  } else if (params.type === TimeBlockType.FOCUS && params.countsForFocus) {
    const debtMinutes = Math.max(0, -balance)
    const debtDay =
      debtMinutes > 0 && params.debtEpisodeStart
        ? daysBetween(params.debtEpisodeStart, params.endTs, params.timezone) + 1
        : 0
    const { debtPayment, earned, remainingFocus, effectiveRate } = applyFocusToDebtAndEarnings({
      focusMinutes: params.duration,
      debtMinutes,
      settings,
      debtDay
    })
    if (debtPayment > 0) {
      entries.push({
        type: LedgerEntryType.DEBT_PAYMENT,
        amount: debtPayment,
        note: `Debt repayment at ${effectiveRate}:1`,
        metadata: { effectiveRate }
      })
      balance += debtPayment
    }
    if (earned > 0 && canEarn(balance, settings)) {
      const capacity = Math.max(0, settings.hardCapMinutes - balance)
      const capped = Math.min(earned, capacity)
      if (capped > 0) {
        entries.push({
          type: LedgerEntryType.FOCUS_EARN,
          amount: capped,
          note: `Focus earn at ${settings.baseRateFocusPerGaming}:1`,
          metadata: {
            effectiveRate,
            remainingFocus,
            debtPayment
          }
        })
        balance += capped
      }
    }
  } else if (params.type === TimeBlockType.MILESTONE) {
    entries.push({
      type: LedgerEntryType.MILESTONE,
      amount: 0,
      note: 'Milestone logged (tracking only)'
    })
  }
  const net = entries.reduce((sum, e) => sum + e.amount, 0)
  return { entries, net }
}

export function createBlock(input: BlockInput) {
  ensureDatabase()
  runMaintenance()
  const settings = getSettings()
  const timezone = settings.timezone || 'UTC'
  const startTs = new Date(input.start).getTime()
  const endTs = new Date(input.end).getTime()
  const duration = durationMinutes(startTs, endTs)
  const state = computeLedgerState()
  const processed = processBlockEffect({
    type: input.type,
    duration,
    countsForFocus: input.countsForFocus ?? false,
    endTs,
    currentBalance: state.balance,
    debtEpisodeStart: state.debtEpisodeStart,
    timezone
  })
  const now = Date.now()
  const blockId = randomUUID()
  insertTimeBlock({
    id: blockId,
    title: input.title,
    type: input.type,
    start_ts: startTs,
    end_ts: endTs,
    duration_minutes: duration,
    counts_for_focus: input.countsForFocus ? 1 : 0,
    tags: input.tags ?? null,
    note: input.note ?? null,
    processed_effect_minutes: processed.net,
    processed_snapshot: serializeSnapshot(processed.entries),
    created_at: now,
    updated_at: now,
    deleted: 0
  })

  if (processed.entries.length > 0) {
    insertLedger(
      processed.entries.map((entry) => ({
        id: randomUUID(),
        created_at: endTs,
        type: entry.type,
        amount_minutes: entry.amount,
        block_id: blockId,
        note: entry.note,
        metadata: entry.metadata ?? null
      }))
    )
  }
  return getTimeBlock(blockId)
}

export function editBlock(id: string, input: BlockInput) {
  ensureDatabase()
  runMaintenance()
  const existing = getTimeBlock(id)
  if (!existing) {
    throw new Error('Block not found')
  }
  const settings = getSettings()
  const timezone = settings.timezone || 'UTC'
  const startTs = new Date(input.start).getTime()
  const endTs = new Date(input.end).getTime()
  const duration = durationMinutes(startTs, endTs)
  const state = computeLedgerState()
  const processed = processBlockEffect({
    type: input.type,
    duration,
    countsForFocus: input.countsForFocus ?? false,
    endTs,
    currentBalance: state.balance,
    debtEpisodeStart: state.debtEpisodeStart,
    timezone
  })

  const oldSnapshot = parseSnapshot(existing.processed_snapshot)
  const oldSummary = summarizeSnapshot(oldSnapshot)
  const newSummary = summarizeSnapshot(processed.entries)
  const deltaNet = processed.net - (existing.processed_effect_minutes ?? 0)
  const focusEarnDelta = (newSummary[LedgerEntryType.FOCUS_EARN] ?? 0) - (oldSummary[LedgerEntryType.FOCUS_EARN] ?? 0)

  updateTimeBlock(id, {
    title: input.title,
    type: input.type,
    start_ts: startTs,
    end_ts: endTs,
    duration_minutes: duration,
    counts_for_focus: input.countsForFocus ? 1 : 0,
    tags: input.tags ?? null,
    note: input.note ?? null,
    processed_effect_minutes: processed.net,
    processed_snapshot: serializeSnapshot(processed.entries),
    updated_at: Date.now()
  })

  const perTypeDelta = Array.from(
    new Set([
      ...Object.keys(newSummary),
      ...Object.keys(oldSummary)
    ])
  ).reduce<Record<string, number>>((acc, key) => {
    const typed = key as LedgerEntryType
    acc[typed] = (newSummary[typed] ?? 0) - (oldSummary[typed] ?? 0)
    return acc
  }, {})

  if (deltaNet !== 0 || focusEarnDelta !== 0) {
    insertLedger({
      id: randomUUID(),
      created_at: endTs,
      type: LedgerEntryType.ADJUSTMENT,
      amount_minutes: deltaNet,
      block_id: id,
      note: 'Block edit adjustment',
      metadata: {
        focusEarnDelta,
        perTypeDelta
      }
    })
  }
  return getTimeBlock(id)
}

export function deleteBlock(id: string) {
  ensureDatabase()
  runMaintenance()
  const existing = getTimeBlock(id)
  if (!existing) {
    throw new Error('Block not found')
  }
  const snapshot = parseSnapshot(existing.processed_snapshot)
  const summary = summarizeSnapshot(snapshot)
  const focusEarnDelta = -(summary[LedgerEntryType.FOCUS_EARN] ?? 0)
  const net = existing.processed_effect_minutes ?? 0
  removeTimeBlock(id)
  if (net !== 0) {
    insertLedger({
      id: randomUUID(),
      created_at: Date.now(),
      type: LedgerEntryType.ADJUSTMENT,
      amount_minutes: -net,
      block_id: id,
      note: 'Block deletion adjustment',
      metadata: {
        focusEarnDelta,
        reason: 'delete'
      }
    })
  }
}
