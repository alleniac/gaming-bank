import { listLedger, ledgerChronological } from '../data/ledgerRepo'
import { ensureDatabase } from '../lib/bootstrap'
import { runMaintenance } from './maintenanceService'

export function ledgerWithRunningBalance(limit = 200) {
  ensureDatabase()
  runMaintenance()
  const chronological = ledgerChronological()
  let balance = 0
  const balanceById = new Map<string, number>()
  chronological.forEach((entry) => {
    balance += entry.amount_minutes
    balanceById.set(entry.id, balance)
  })
  const latest = listLedger(limit, 0)
  return latest.map((entry) => ({
    ...entry,
    runningBalance: balanceById.get(entry.id) ?? null
  }))
}
