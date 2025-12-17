export enum TimeBlockType {
  FOCUS = 'FOCUS',
  GAME = 'GAME',
  HABIT = 'HABIT',
  MILESTONE = 'MILESTONE',
  OTHER = 'OTHER'
}

export enum LedgerEntryType {
  FOCUS_EARN = 'FOCUS_EARN',
  GAME_SPEND = 'GAME_SPEND',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  DECAY = 'DECAY',
  HABIT_VEST = 'HABIT_VEST',
  HABIT_EXCESS_EXPIRED = 'HABIT_EXCESS_EXPIRED',
  ADJUSTMENT = 'ADJUSTMENT',
  PENALTY_PENDING = 'PENALTY_PENDING',
  PENALTY_SETTLED = 'PENALTY_SETTLED',
  MILESTONE = 'MILESTONE',
  OTHER = 'OTHER'
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED'
}

export type Settings = {
  baseRateFocusPerGaming: number
  surchargeDay1: number
  surchargeDailyIncrease: number
  surchargeCap: number
  softCapMinutes: number
  hardCapMinutes: number
  dailyDecayRate: number
  habitBonusCapPercent: number
  penaltyRateUsdPerDebtMinute: number
  timezone: string
}

export type Clock = {
  now: () => Date
}

export const systemClock: Clock = {
  now: () => new Date()
}
