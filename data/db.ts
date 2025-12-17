import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'gaming-bank.sqlite')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export type SqliteDatabase = Database.Database
export default db
