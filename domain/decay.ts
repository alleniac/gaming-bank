import { Settings } from './types'

export function computeDecay(balanceMinutes: number, settings: Settings): number {
  if (balanceMinutes <= settings.softCapMinutes) return 0
  const decayBase = balanceMinutes - settings.softCapMinutes
  const decayed = Math.floor(decayBase * settings.dailyDecayRate)
  return Math.max(decayed, 0)
}

export function canEarn(balanceMinutes: number, settings: Settings): boolean {
  return balanceMinutes < settings.hardCapMinutes
}
