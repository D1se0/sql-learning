// sqlEngine.ts — SQLite real en el navegador vía sql.js (WASM)
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import { SCHEMA_SQL, SEED_SQL } from './dbSeed'

let SQL: SqlJsStatic | null = null
let db: Database | null = null

export type QueryResult = {
  columns: string[]
  rows: (string | number | null)[][]
  rowsAffected?: number
  error?: string
}

// WASM auto-hospedado (public/sqljs/) — sin depender de CDNs externos
const WASM_BASE = `${import.meta.env.BASE_URL}sqljs/`

export async function initEngine(): Promise<void> {
  if (db) return
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: (f: string) => WASM_BASE + f })
  }
  resetDatabase()
}

export function isReady(): boolean {
  return db !== null
}

export function resetDatabase(): void {
  if (!SQL) return
  db?.close()
  db = new SQL.Database()
  db.run('PRAGMA foreign_keys = ON;')
  db.run(SCHEMA_SQL)
  db.run(SEED_SQL)
}

export function runQuery(sql: string): QueryResult {
  if (!db) return { columns: [], rows: [], error: 'Motor no inicializado todavía…' }
  const trimmed = sql.trim().replace(/;\s*$/, '')
  if (!trimmed) return { columns: [], rows: [] }

  try {
    const isSelect = /^\s*(select|with|pragma|explain)/i.test(trimmed)
    if (isSelect) {
      const stmt = db.prepare(trimmed)
      const columns = stmt.getColumnNames()
      const rows: (string | number | null)[][] = []
      while (stmt.step()) rows.push(stmt.get() as (string | number | null)[])
      stmt.free()
      return { columns, rows }
    }
    db.run(trimmed)
    const changes = db.getRowsModified()
    return { columns: [], rows: [], rowsAffected: changes }
  } catch (e) {
    return { columns: [], rows: [], error: e instanceof Error ? e.message : String(e) }
  }
}

export type TableInfo = {
  name: string
  rowCount: number
  columns: { name: string; type: string; notnull: boolean; pk: boolean }[]
  sample: { columns: string[]; rows: (string | number | null)[][] }
}

export function getSchema(): TableInfo[] {
  if (!db) return []
  const tables: TableInfo[] = []
  const res = runQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  for (const [name] of res.rows as string[][]) {
    const cols = runQuery(`PRAGMA table_info(${name})`)
    const columns = (cols.rows as (string | number | null)[][]).map(r => ({
      name: String(r[1]),
      type: String(r[2] ?? ''),
      notnull: Number(r[3]) === 1,
      pk: Number(r[5]) > 0
    }))
    const count = runQuery(`SELECT COUNT(*) FROM ${name}`)
    const sample = runQuery(`SELECT * FROM ${name} LIMIT 5`)
    tables.push({
      name,
      rowCount: Number(count.rows[0]?.[0] ?? 0),
      columns,
      sample: { columns: sample.columns, rows: sample.rows }
    })
  }
  return tables
}
