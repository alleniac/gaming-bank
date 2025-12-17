import { listSettlements, settlePenalty as settlePenaltyRepo } from '../data/settlementsRepo'
import { ensureDatabase } from '../lib/bootstrap'
import { runMaintenance } from './maintenanceService'

export function getSettlements() {
  ensureDatabase()
  runMaintenance()
  return listSettlements()
}

export function settlePenalty(id: string, note?: string) {
  ensureDatabase()
  runMaintenance()
  settlePenaltyRepo(id, note)
}
