// mkchallenges.mjs — extrae el array CHALLENGES de challenges.ts (ES, fuente única)
// y lo escribe como challenges.es.json para el pipeline de traducción.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '..')
const src = fs.readFileSync(path.join(repo, 'website', 'src', 'lib', 'challenges.ts'), 'utf8')

const start = src.indexOf('export const CHALLENGES')
const end = src.indexOf(']\n', start)
if (start < 0 || end < 0) { console.error('no se encontró CHALLENGES'); process.exit(1) }

const body = src
  .slice(start, end + 1)
  .replace(/export const CHALLENGES: Challenge\[\] =/, '')
  .replace(/\btrue\b/g, 'true')
  .replace(/\bfalse\b/g, 'false')

const arr = eval(`(${body})`)
const out = path.join(repo, 'website', 'src', 'data', 'challenges.es.json')
fs.writeFileSync(out, JSON.stringify(arr, null, 1) + '\n')
console.log(`✔ ${arr.length} retos → ${path.relative(repo, out)}`)
