import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Copy } from 'lucide-react'
import { runQuery } from '../lib/sqlEngine'

/* ---------- Reveal on scroll ---------- */
export function Reveal({ children, delay = 0, y = 24, className = '' }: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- SQL highlighter ---------- */
const KEYWORDS = 'SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP|BY|HAVING|ORDER|LIMIT|OFFSET|AS|AND|OR|NOT|NULL|IN|BETWEEN|LIKE|EXISTS|UNION|ALL|ANY|CASE|WHEN|THEN|ELSE|END|DISTINCT|WITH|OVER|PARTITION|CREATE|TABLE|DROP|ALTER|ADD|COLUMN|CONSTRAINT|PRIMARY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|AUTOINCREMENT|INDEX|IS|ASC|DESC|PRAGMA'
const FUNCS = 'COUNT|SUM|AVG|MIN|MAX|ROUND|UPPER|LOWER|LENGTH|CONCAT|IFNULL|COALESCE|SUBSTR|REPLACE|CAST|ROW_NUMBER|RANK|DENSE_RANK|NTILE|LAG|LEAD|FIRST_VALUE|LAST_VALUE|STRFTIME|TYPEOF|ABS|POWER|SQRT|FLOOR|CEIL|RANDOM|CURRENT_TIMESTAMP|TRIM|INSTR|PRINTF|DATE'

function highlightSql(code: string): string {
  const stash: string[] = []
  const stashIt = (m: string) => {
    stash.push(m)
    return `\u0000${stash.length - 1}\u0000`
  }
  let html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/'[^']*'/g, stashIt)
  html = html.replace(/--[^\n]*/g, stashIt)
  html = html.replace(new RegExp(`\\b(${KEYWORDS})\\b`, 'gi'), '<span class="kw">$1</span>')
  html = html.replace(new RegExp(`\\b(${FUNCS})\\s*\\(`, 'gi'), '<span class="fn">$1</span>(')
  html = html.replace(/(?<![\w>])(\d+(?:\.\d+)?)(?![\w<])/g, '<span class="num">$1</span>')
  html = html.replace(/\u0000(\d+)\u0000/g, (_m, i) => {
    const s = stash[Number(i)]
    return s.startsWith('--') ? `<span class="com">${s}</span>` : `<span class="str">${s}</span>`
  })
  return html
}

export function SqlCode({ code, onRun }: { code: string; onRun?: (sql: string) => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* noop */ }
  }
  return (
    <div className="sql-code group">
      {onRun && (
        <button
          onClick={() => onRun(code)}
          title="Ejecutar en el playground"
          className="absolute top-2 right-11 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md border border-edge bg-base/80 text-green-400 hover:border-green-400/50"
        >
          ▶
        </button>
      )}
      <button
        onClick={copy}
        title="Copiar"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md border border-edge bg-base/80 text-grey hover:text-accent hover:border-accent/50"
      >
        {copied ? '✓' : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="whitespace-pre overflow-x-auto" dangerouslySetInnerHTML={{ __html: highlightSql(code) }} />
    </div>
  )
}

/* ---------- Result table ---------- */
export function ResultTable({ columns, rows, maxH = 'max-h-96' }: {
  columns: string[]
  rows: (string | number | null)[][]
  maxH?: string
}) {
  const isNum = (v: string | number | null) =>
    typeof v === 'number' || (typeof v === 'string' && v !== '' && !isNaN(Number(v)))
  return (
    <div className={`overflow-auto rounded-lg border border-edge ${maxH}`}>
      <table className="w-full text-[12.5px] font-mono border-collapse">
        <thead>
          <tr className="bg-panel border-b border-edge sticky top-0">
            <th className="px-3 py-2 text-left text-accent font-bold">#</th>
            {columns.map((c, i) => (
              <th key={i} className="px-3 py-2 text-left text-accent font-bold whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-edge/50 hover:bg-accent/5 transition-colors">
              <td className="px-3 py-1.5 text-grey/50">{i + 1}</td>
              {r.map((v, j) => (
                <td
                  key={j}
                  className={`px-3 py-1.5 whitespace-nowrap ${v === null ? 'text-grey/40 italic' : isNum(v) ? 'text-orange-300' : 'text-ink'}`}
                >
                  {v === null ? 'NULL' : String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- small inline html renderer (cheatsheet <p>) ---------- */
export function P({ html }: { html: string }) {
  return <p className="text-grey leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
}

/* ---------- terminal-style prompt chip ---------- */
export function PromptChip({ phrases }: { phrases: string[] }) {
  return (
    <span className="font-mono text-xs text-grey">
      sql@learning:~$ <span className="text-ink">{phrases[0]}</span>
      <span className="text-accent animate-blink">▊</span>
    </span>
  )
}

export { runQuery }
