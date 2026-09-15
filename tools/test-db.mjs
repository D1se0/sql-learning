// test-db.mjs — smoke test del seed y de las soluciones de retos con sql.js real
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = path.dirname(fileURLToPath(import.meta.url))
const website = path.resolve(here, '..', 'website')
const require2 = createRequire(path.join(website, 'package.json'))

// extraer las constantes SQL del TS sin transpilar (son template literals)
const src = fs.readFileSync(path.join(website, 'src', 'lib', 'dbSeed.ts'), 'utf8')
const grab = (name) => {
  const m = src.match(new RegExp(`export const ${name} = \`([\\s\\S]*?)\``, 'm'))
  if (!m) throw new Error(`no se encontró ${name}`)
  return m[1]
}
const SCHEMA_SQL = grab('SCHEMA_SQL')
const SEED_SQL = grab('SEED_SQL')

// extraer soluciones de challenges.ts
const chSrc = fs.readFileSync(path.join(website, 'src', 'lib', 'challenges.ts'), 'utf8')
const solutions = [...chSrc.matchAll(/solution:\s*[`']([\s\S]*?)[`'],?\n/g)].map(m => m[1].trim())
console.log(`soluciones encontradas: ${solutions.length}`)

const initSqlJs = require2('sql.js')
const SQL = await initSqlJs({
  locateFile: f => path.join(website, 'node_modules', 'sql.js', 'dist', f)
})

const db = new SQL.Database()
db.run('PRAGMA foreign_keys = ON;')

// 1) esquema
try {
  db.run(SCHEMA_SQL)
  console.log('✓ SCHEMA OK')
} catch (e) {
  console.error('✗ SCHEMA ERROR:', e.message)
  process.exit(1)
}

// 2) seed
try {
  db.run(SEED_SQL)
  console.log('✓ SEED OK')
} catch (e) {
  console.error('✗ SEED ERROR:', e.message)
  process.exit(1)
}

// 3) conteos esperados
const count = (q) => { const r = db.exec(q); return r[0].values[0][0] }
const counts = {
  patients: count('SELECT COUNT(*) FROM patients'),
  doctors: count('SELECT COUNT(*) FROM doctors'),
  departments: count('SELECT COUNT(*) FROM departments'),
  admissions: count('SELECT COUNT(*) FROM admissions'),
  lab_results: count('SELECT COUNT(*) FROM lab_results')
}
console.log('conteos:', counts)
const okCounts = counts.patients === 20 && counts.doctors === 8 && counts.departments === 5 && counts.admissions === 25 && counts.lab_results === 30
console.log(okCounts ? '✓ CONTEOS OK (20/8/5/25/30)' : '✗ CONTEOS INESPERADOS')

// 4) ejecutar cada solución de reto
let fails = 0
solutions.forEach((sql, i) => {
  try {
    const r = db.exec(sql)
    const rows = r[0]?.values.length ?? 0
    console.log(`  ✓ reto ${i + 1}: ${rows} filas`)
    if (rows === 0) { console.warn(`    ⚠ reto ${i + 1} devuelve 0 filas`); fails++ }
  } catch (e) {
    console.error(`  ✗ reto ${i + 1} ERROR: ${e.message}\n    SQL: ${sql.split('\n')[0]}…`)
    fails++
  }
})

// 5) queries típicas de usuario no deben fallar
const userQueries = [
  'SELECT * FROM patients LIMIT 3',
  'SELECT city, COUNT(*) FROM patients GROUP BY city',
  'SELECT p.first_name, a.diagnosis FROM patients p JOIN admissions a ON a.patient_id = p.patient_id',
  "UPDATE patients SET city='Madrid' WHERE patient_id=1",
  'DELETE FROM lab_results WHERE result_id=999'
]
for (const q of userQueries) {
  try { db.exec(q); console.log(`  ✓ user query: ${q.slice(0, 50)}…`) }
  catch (e) { console.error(`  ✗ user query FALLA: ${q}\n    ${e.message}`); fails++ }
}

console.log(fails === 0 && okCounts ? '\n✔ TODO OK — seed y retos validados' : `\n✗ ${fails} problemas`)
process.exit(fails === 0 ? 0 : 1)
