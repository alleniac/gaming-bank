import db from '../data/db'
import { runMigrations } from '../data/migrations'

runMigrations(db)
console.log('Migrations applied')
