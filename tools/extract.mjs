// extract.mjs — convierte los .html originales del cheatsheet a topics.json + search-index.json
// Uso: node extract.mjs  (desde esta carpeta; tooling requiere: npm i node-html-parser en website)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')
// resolver node-html-parser desde website/node_modules
const require2 = createRequire(path.join(repoRoot, 'website', 'package.json'))
const { parse } = require2('node-html-parser')
const outData = path.join(repoRoot, 'website', 'src', 'data')
fs.mkdirSync(outData, { recursive: true })

// categoría por fichero (misma taxonomía del sidebar original)
const CATEGORY = (file) => {
  const agg = ['count', 'avg', 'sum', 'max', 'min']
  const win = ['window-function-basic', 'lag', 'lead', 'first-value', 'last-value']
  const str = ['concat', 'len', 'upper', 'lower']
  const num = ['rand', 'round', 'floor', 'ceil', 'abs', 'power', 'sqrt']
  const date = ['current_timestamp', 'year', 'month', 'day']
  const tables = ['datatypes', 'create-table', 'drop-table', 'alter-table', 'constraint', 'not-null', 'unique', 'primary-key', 'foreign-key', 'check', 'default', 'auto-increment', 'index-sql']
  const filter = ['operators', 'order-by', 'like', 'in', 'between', 'join', 'union', 'group-by', 'having', 'case', 'distinct', 'exists', 'any-all', 'ifnull', 'null-values', 'aliases']
  const base = file.replace('.html', '')
  if (agg.includes(base)) return { cat: 'Funciones', sub: 'Agregación' }
  if (win.includes(base)) return { cat: 'Funciones', sub: 'Window' }
  if (str.includes(base)) return { cat: 'Funciones', sub: 'Cadena' }
  if (num.includes(base)) return { cat: 'Funciones', sub: 'Numéricas' }
  if (date.includes(base)) return { cat: 'Funciones', sub: 'Fecha' }
  if (tables.includes(base)) return { cat: 'Tablas', sub: 'DDL & Constraints' }
  if (filter.includes(base)) return { cat: 'Filtrado', sub: 'Cláusulas' }
  return { cat: 'Básicas', sub: 'Statements' }
}

// título legible por fichero
const TITLES = {
  start: 'Introducción a SQL',
  select: 'SELECT', insert: 'INSERT', update: 'UPDATE', delete: 'DELETE', where: 'WHERE',
  operators: 'Operadores', 'order-by': 'ORDER BY', like: 'LIKE', in: 'IN', between: 'BETWEEN',
  join: 'JOIN', union: 'UNION', 'group-by': 'GROUP BY', having: 'HAVING', case: 'CASE',
  distinct: 'DISTINCT', exists: 'EXISTS', 'any-all': 'ANY / ALL', ifnull: 'IFNULL()',
  'null-values': 'Valores NULL', aliases: 'Aliases (AS)',
  count: 'COUNT()', avg: 'AVG()', sum: 'SUM()', max: 'MAX()', min: 'MIN()',
  'window-function-basic': 'Window Functions', lag: 'LAG()', lead: 'LEAD()',
  'first-value': 'FIRST_VALUE()', 'last-value': 'LAST_VALUE()',
  concat: 'CONCAT()', len: 'LEN()', upper: 'UPPER()', lower: 'LOWER()',
  rand: 'RAND()', round: 'ROUND()', floor: 'FLOOR()', ceil: 'CEIL()',
  abs: 'ABS()', power: 'POWER()', sqrt: 'SQRT()',
  'current-timestamp': 'CURRENT_TIMESTAMP', year: 'YEAR()', month: 'MONTH()', day: 'DAY()',
  datatypes: 'Tipos de datos', 'create-table': 'CREATE TABLE', 'drop-table': 'DROP TABLE',
  'alter-table': 'ALTER TABLE', constraint: 'CONSTRAINTS', 'not-null': 'NOT NULL',
  unique: 'UNIQUE', 'primary-key': 'PRIMARY KEY', 'foreign-key': 'FOREIGN KEY',
  check: 'CHECK', default: 'DEFAULT', 'auto-increment': 'AUTO INCREMENT', 'index-sql': 'INDEX'
}

// keywords para búsqueda y "comandos"
const KEYWORDS = (base) => {
  const map = {
    select: ['SELECT', 'FROM', 'result-set', 'consultar'],
    insert: ['INSERT INTO', 'VALUES', 'añadir filas'],
    update: ['UPDATE', 'SET', 'modificar'],
    delete: ['DELETE FROM', 'borrar filas'],
    where: ['WHERE', 'filtro', 'condición'],
    'order-by': ['ORDER BY', 'ASC', 'DESC', 'ordenar'],
    like: ['LIKE', '%', '_', 'patrón'],
    in: ['IN', 'lista valores'],
    between: ['BETWEEN', 'rango'],
    join: ['JOIN', 'INNER', 'LEFT', 'ON', 'unir tablas'],
    union: ['UNION', 'UNION ALL', 'combinar'],
    'group-by': ['GROUP BY', 'agrupar'],
    having: ['HAVING', 'filtro grupos'],
    case: ['CASE', 'WHEN', 'THEN', 'ELSE', 'condicional'],
    distinct: ['DISTINCT', 'únicos'],
    exists: ['EXISTS', 'subconsulta'],
    'any-all': ['ANY', 'ALL', 'subconsulta'],
    'group-by2': [],
    count: ['COUNT', 'contar'],
    avg: ['AVG', 'media'],
    sum: ['SUM', 'suma'],
    max: ['MAX', 'máximo'],
    min: ['MIN', 'mínimo'],
    lag: ['LAG', 'fila anterior'],
    lead: ['LEAD', 'fila siguiente'],
    'first-value': ['FIRST_VALUE', 'primer valor'],
    'last-value': ['LAST_VALUE', 'último valor'],
    concat: ['CONCAT', 'concatenar'],
    'create-table': ['CREATE TABLE', 'crear tabla'],
    'drop-table': ['DROP TABLE', 'borrar tabla'],
    'alter-table': ['ALTER TABLE', 'modificar tabla'],
    'primary-key': ['PRIMARY KEY', 'clave primaria'],
    'foreign-key': ['FOREIGN KEY', 'clave foránea'],
    'index-sql': ['INDEX', 'índice', 'rendimiento'],
    'auto-increment': ['AUTO_INCREMENT', 'AUTOINCREMENT', 'id automático']
  }
  return map[base] || []
}

const root = repoRoot
const files = fs.readdirSync(root).filter(f => f.endsWith('.html') && f !== 'index.html')
const topics = []
const search = []

for (const file of files.sort()) {
  const base = file.replace('.html', '')
  const html = fs.readFileSync(path.join(root, file), 'utf8')
  const doc = parse(html)

  // imágenes referenciadas → copiar a website/public/img
  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src')
    if (src && fs.existsSync(path.join(root, src))) {
      const dest = path.join(repoRoot, 'website', 'public', 'img')
      fs.mkdirSync(dest, { recursive: true })
      fs.copyFileSync(path.join(root, src), path.join(dest, src))
      img.setAttribute('src', `img/${src}`)
    }
  })

  const contentRoot = doc.querySelector('.inner') ?? doc

  // recorrer hijos directos en orden; si no hay bloques (DOM anidado), fallback a todos los descendientes
  let children = (contentRoot.childNodes ?? []).filter(n => n.nodeType === 1)
  const blocksFrom = (els) => {
    const out = []
    for (const el of els) {
      const tag = (el.tagName || '').toLowerCase()
      if (tag === 'h1') out.push({ t: 'h1', text: el.text.trim() })
      else if (tag === 'h2') out.push({ t: 'h2', text: el.text.trim() })
      else if (tag === 'h3') out.push({ t: 'h3', text: el.text.trim() })
      else if (tag === 'p') {
        const h = el.innerHTML.replace(/\r?\n\s+/g, ' ').trim()
        if (h) out.push({ t: 'p', html: h })
      } else if (tag === 'ul') {
        const items = el.querySelectorAll('li').map(li => li.innerHTML.replace(/\r?\n\s+/g, ' ').trim())
        if (items.length) out.push({ t: 'ul', items })
      } else if (tag === 'pre') {
        const code = el.text.replace(/^\r?\n/, '').replace(/\s+$/, '')
        if (code) out.push({ t: 'code', lang: 'sql', text: code })
      } else if (tag === 'img') {
        out.push({ t: 'img', src: el.getAttribute('src'), alt: el.getAttribute('alt') || '' })
      }
    }
    return out
  }
  let blocks = blocksFrom(children)
  if (blocks.length === 0) blocks = blocksFrom(contentRoot.querySelectorAll('h1,h2,h3,p,ul,pre,img'))

  const { cat, sub } = CATEGORY(file)
  const title = TITLES[base] || base
  const kws = KEYWORDS(base)

  topics.push({ id: base, title, cat, sub, blocks })
  search.push({ id: base, title, cat, sub, kws })
}

fs.writeFileSync(path.join(outData, 'topics.json'), JSON.stringify(topics, null, 1))
fs.writeFileSync(path.join(outData, 'search.json'), JSON.stringify(search, null, 1))

// resumen
const byCat = {}
for (const t of topics) byCat[t.cat] = (byCat[t.cat] || 0) + 1
console.log(`✔ ${topics.length} topics extraídos`)
console.table(byCat)
const bad = topics.filter(t => t.blocks.filter(b => b.t === 'code').length === 0)
console.log(`topics sin bloques de código: ${bad.length ? bad.map(b => b.id).join(', ') : 'ninguno ✓'}`)
