// translate-all.mjs — genera las versiones EN/FR/DE/PT de:
//   1) dict UI        → website/src/i18n/dict.<lang>.json
//   2) topics.json    → website/src/data/topics.<lang>.json
//   3) challenges     → website/src/data/challenges.<lang>.json
//   4) search.json    → website/src/data/search.<lang>.json
// con la API pública de Google Translate, protegiendo TODO lo que no debe
// traducirse (SQL, código, tags HTML, identificadores, keywords) con tokens ⟨i⟩.
// Uso: node translate-all.mjs [en,fr,de,pt]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '..')
const DATA = path.join(repo, 'website', 'src', 'data')
const I18N = path.join(repo, 'website', 'src', 'i18n')
const LANGS = (process.argv[2] || 'en,fr,de,pt').split(',').map(s => s.trim())

/* ---------------- protect / restore ---------------- */
// Kw: SQL keywords que NUNCA deben traducirse aunque estén en frases ES
const SQL_KW = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|AS|AND|OR|NOT|NULL|IN|BETWEEN|LIKE|EXISTS|UNION|ALL|ANY|SOME|CASE|WHEN|THEN|ELSE|END|DISTINCT|WITH|OVER|PARTITION|CREATE|TABLE|DROP|ALTER|CONSTRAINT|PRIMARY KEY|FOREIGN KEY|REFERENCES|UNIQUE|CHECK|DEFAULT|INDEX|ASC|DESC|IS|COUNT|AVG|SUM|MAX|MIN|ROUND|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE|CONCAT|COALESCE|IFNULL|SUBSTR|STRFTIME|CURRENT_TIMESTAMP|ABS|POWER|SQRT|FLOOR|CEIL|RAND|VALUES|INTO|SET|BY|USING|NATURAL|CROSS|ROLLUP|FILTER|WINDOW|AUTOINCREMENT|TIMESTAMP|INTEGER|VARCHAR|BOOLEAN|FLOAT|DOUBLE|DECIMAL|DATETIME|DATE|TIME|TEXT|BLOB|PRAGMA|EXPLAIN|VACUUM|BEGIN|COMMIT|ROLLBACK|TRANSACTION)\b/g
// funciones con paréntesis: UPPER(), LOWER(), IFNULL()… nunca se traducen
const FUNC_PARENS = /\b[A-Z][A-Z0-9_]{1,24}\(\)/g

const makeProt = () => {
  const items = []
  let n = 0
  const token = () => ` \u27E8${n++}\u27E9 `
  const add = (s) => {
    if (s === undefined || s === null || s === '') { items.push(s); return token() }
    items.push(s)
    return token()
  }
  return {
    token,
    // proteger una string HTML/ES y devolver la version con tokens
    protect: (s) => {
      let out = s
      // 1) tags HTML completos: <a href="...">, </code>, <span class="x">
      out = out.replace(/<\/?[a-zA-Z][^>]*>/g, m => add(m))
      // 2) entidades
      out = out.replace(/&[a-z#0-9]+;/gi, m => add(m))
      // 3) identificadores y terminología: word_con_guion_bajo / camelCase / table.ref
      out = out.replace(/\b[a-z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)+\b/g, m => add(m))
      out = out.replace(/\b[a-z]+(?:[A-Z][a-zA-Z0-9]+)+\b/g, m => add(m))
      // 4) nombres de fichero .db/.json/.png/.html/.wasm y rutas
      out = out.replace(/\b[\w./-]+\.(?:db|json|png|gif|jpe?g|html?|wasm|sql|ts|tsx)\b/g, m => add(m))
      // 5) funciones con () y SQL keywords (tras extraer código, para no tocar lo ya protegido)
      out = out.replace(FUNC_PARENS, m => add(m))
      out = out.replace(SQL_KW, m => add(m))
      // 6) palabras sueltas SQL/Ctrl
      out = out.replace(/\b(SQL|Ctrl(?:\+\w+)?|WASM|React|SQLite|DDL|DML|PK|NN|FK|id|slug)\b/g, m => add(m))
      // colapsar espacios dobles generados
      out = out.replace(/ {2,}/g, ' ')
      return out
    },
    restore: (s) => {
      let out = s.replace(/\u27E8(\d+)\u27E9/g, (_m, i) => {
        const v = items[Number(i)]
        return v === undefined || v === null ? '' : v
      })
      // limpiar: espacios de ancho cero de Google, espacios dobles, espacios finales
      out = out.replace(/[\u200b\u200c\u200d\ufeff]/g, '')
      out = out.replace(/ {2,}/g, ' ')
      // Google mete espacios dentro de comillas alrededor de tokens: " first_name " → "first_name"
      // (normaliza primero comillas curvas que Google introduce, luego colapsa espacios internos)
      out = out.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
      out = out.replace(/(["'])\s+([^"']*?)\s+\1/g, '$1$2$1')
      return out.trim()
    }
  }
}

/* ---------------- llamadas a Google (batch, con reintento) ---------------- */
async function googleBatch(texts, sl, tl, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const url = new URL('https://translate.googleapis.com/translate_a/t')
      url.searchParams.set('client', 'gtx')
      url.searchParams.set('sl', sl)
      url.searchParams.set('tl', tl)
      url.searchParams.set('format', 'text')
      const body = texts.map(t => `q=${encodeURIComponent(t)}`).join('&')
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      })
      if (res.status === 429 || res.status === 503) throw new Error(`rate ${res.status}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const out = Array.isArray(json) ? json.map(x => (Array.isArray(x) ? x[0] : x)) : [String(json)]
      if (out.length !== texts.length) throw new Error(`lote: ${out.length}/${texts.length}`)
      return out
    } catch (e) {
      const wait = 800 * (i + 1) * (i + 1)
      if (i === tries - 1) throw e
      await new Promise(r => setTimeout(r, wait))
    }
  }
}

// traduce strings con protección, en lotes
async function translateBatch(items, sl, tl, label = '') {
  const prots = items.map(it => makeProt())
  const masked = items.map((s, i) => (s == null || s === '' ? '' : prots[i].protect(s)))
  const OUT = 40
  const results = new Array(items.length)
  for (let i = 0; i < masked.length; i += OUT) {
    const chunk = masked.slice(i, i + OUT)
    const idxs = chunk.map((_, j) => i + j)
    const translated = await googleBatch(chunk, sl, tl)
    translated.forEach((t, j) => {
      const k = idxs[j]
      const orig = items[k]
      results[k] = orig == null || orig === '' ? orig : prots[k].restore(t)
    })
    process.stdout.write(`\r  ${label} ${Math.min(i + OUT, masked.length)}/${masked.length}`)
    await new Promise(r => setTimeout(r, 350))
  }
  process.stdout.write('\n')
  return results
}

// traduce un array de strings SQL-seguras pero en lote directo
async function translateRaw(items, sl, tl, label = '') {
  return translateBatch(items, sl, tl, label)
}

/* ---------------- carga de fuentes ---------------- */
const dictEs = JSON.parse(fs.readFileSync(path.join(I18N, 'dict.es.json'), 'utf8'))
const topicsEs = JSON.parse(fs.readFileSync(path.join(DATA, 'topics.json'), 'utf8'))
const searchEs = JSON.parse(fs.readFileSync(path.join(DATA, 'search.json'), 'utf8'))
const chEs = JSON.parse(fs.readFileSync(path.join(DATA, 'challenges.es.json'), 'utf8'))

// muestra de sql de pg.sample.6: el dict ES lleva el SQL de la muestra CASE,
// que NO debe traducirse → marcar claves skip (se copian tal cual)
const DICT_SKIP = new Set(['pg.sample.6.sql', 'meta.langName', 'meta.langFlag', 'meta.langShort'])

// identidad de cada idioma (no se traduce: cada diccionario se presenta a sí mismo)
const LANG_META = {
  en: { 'meta.langName': 'English', 'meta.langFlag': '🇬🇧', 'meta.langShort': 'EN' },
  fr: { 'meta.langName': 'Français', 'meta.langFlag': '🇫🇷', 'meta.langShort': 'FR' },
  de: { 'meta.langName': 'Deutsch', 'meta.langFlag': '🇩🇪', 'meta.langShort': 'DE' },
  pt: { 'meta.langName': 'Português', 'meta.langFlag': '🇧🇷', 'meta.langShort': 'PT' },
  es: { 'meta.langName': 'Español', 'meta.langFlag': '🇪🇸', 'meta.langShort': 'ES' }
}

/* ---------------- MAIN ---------------- */
for (const tl of LANGS) {
  console.log(`\n═══ ${tl.toUpperCase()} ═══`)
  const sl = 'es'

  /* 1) dict UI */
  {
    const keys = Object.keys(dictEs).filter(k => !DICT_SKIP.has(k))
    const vals = keys.map(k => dictEs[k])
    const out = await translateBatch(vals, sl, tl, 'dict')
    const dict = {}
    for (const k of Object.keys(dictEs)) dict[k] = DICT_SKIP.has(k) ? dictEs[k] : out[keys.indexOf(k)]
    Object.assign(dict, LANG_META[tl] || {})
    fs.writeFileSync(path.join(I18N, `dict.${tl}.json`), JSON.stringify(dict, null, 1) + '\n')
    console.log(`  ✔ dict.${tl}.json (${Object.keys(dict).length} claves)`)
  }

  /* 2) topics: título por topic + bloques */
  {
    // recolectar strings
    const titles = topicsEs.map(t => t.title)
    const tTitles = await translateBatch(titles, sl, tl, 'títulos')
    const tBlocks = []
    for (const t of topicsEs) {
      for (const b of t.blocks) {
        if (b.t === 'h1' || b.t === 'h2' || b.t === 'h3') tBlocks.push(b.text)
        else if (b.t === 'p') tBlocks.push(b.html)
        else if (b.t === 'ul') tBlocks.push(...b.items)
        // code / img: no se traducen
      }
    }
    const xBlocks = await translateBatch(tBlocks, sl, tl, 'bloques')
    let bi = 0
    const topics = topicsEs.map((t, i) => ({
      ...t,
      title: tTitles[i],
      blocks: t.blocks.map(b => {
        if (b.t === 'h1' || b.t === 'h2' || b.t === 'h3') return { ...b, text: xBlocks[bi++] }
        if (b.t === 'p') return { ...b, html: xBlocks[bi++] }
        if (b.t === 'ul') {
          const items = b.items.map(() => xBlocks[bi++])
          return { ...b, items }
        }
        return b
      })
    }))
    if (bi !== xBlocks.length) throw new Error(`bloques: consumidos ${bi} de ${xBlocks.length}`)
    fs.writeFileSync(path.join(DATA, `topics.${tl}.json`), JSON.stringify(topics, null, 1) + '\n')
    console.log(`  ✔ topics.${tl}.json (${topics.length} topics)`)

    // 4) search (títulos y keywords propios — search.json NO comparte orden con topics)
    const sTitles = await translateBatch(searchEs.map(s => s.title), sl, tl, 'search-t')
    const kwsFlat = []
    for (const s of searchEs) kwsFlat.push(...s.kws)
    const xKws = await translateRaw(kwsFlat, sl, tl, 'keywords')
    let ki = 0
    const search = searchEs.map((s, i) => ({
      ...s,
      title: sTitles[i],
      kws: s.kws.map(() => xKws[ki++])
    }))
    if (ki !== xKws.length) throw new Error(`kws: ${ki}/${xKws.length}`)
    fs.writeFileSync(path.join(DATA, `search.${tl}.json`), JSON.stringify(search, null, 1) + '\n')
    console.log(`  ✔ search.${tl}.json (${search.length} entradas)`)
  }

  /* 3) challenges (título/brief/hint; hint a menudo es SQL → el protect lo deja) */
  {
    const vals = []
    const what = []
    for (const c of chEs) {
      vals.push(c.title); what.push(['title', c])
      vals.push(c.brief); what.push(['brief', c])
      vals.push(c.hint); what.push(['hint', c])
    }
    const out = await translateBatch(vals, sl, tl, 'retos')
    const byId = Object.fromEntries(chEs.map(c => [c.id, { ...c }]))
    out.forEach((v, i) => { byId[what[i][1].id][what[i][0]] = v })
    const arr = chEs.map(c => byId[c.id])
    fs.writeFileSync(path.join(DATA, `challenges.${tl}.json`), JSON.stringify(arr, null, 1) + '\n')
    console.log(`  ✔ challenges.${tl}.json (${arr.length} retos)`)
  }
}

console.log('\n✔ traducción completa')
