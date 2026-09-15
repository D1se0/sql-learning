import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, Database, Play, RotateCcw, Table2, Terminal } from 'lucide-react'
import { getSchema, initEngine, isReady, resetDatabase, runQuery, type QueryResult, type TableInfo } from '../lib/sqlEngine'
import { ResultTable, Reveal } from './ui'

const SAMPLES: { label: string; sql: string }[] = [
  { label: 'SELECT básico', sql: 'SELECT first_name, last_name, city\nFROM patients\nLIMIT 5;' },
  { label: 'JOIN + filtro', sql: `SELECT p.first_name, p.last_name, d.name AS department, a.diagnosis\nFROM admissions a\nJOIN patients p ON p.patient_id = a.patient_id\nJOIN departments d ON d.department_id = a.department_id\nWHERE a.discharge_date IS NULL;` },
  { label: 'GROUP BY + HAVING', sql: `SELECT d.name, COUNT(*) AS ingresos\nFROM admissions a\nJOIN departments d ON d.department_id = a.department_id\nGROUP BY d.name\nHAVING COUNT(*) > 3\nORDER BY ingresos DESC;` },
  { label: 'Window function', sql: `SELECT first_name, weight,\n  ROW_NUMBER() OVER (ORDER BY weight DESC) AS rn\nFROM patients\nLIMIT 8;` },
  { label: 'Subconsulta', sql: `SELECT first_name, weight\nFROM patients\nWHERE weight > (SELECT AVG(weight) FROM patients)\nORDER BY weight DESC;` },
  { label: 'CASE', sql: `SELECT first_name,\n  CASE\n    WHEN weight < 60 THEN 'ligero'\n    WHEN weight < 80 THEN 'normal'\n    ELSE 'pesado'\n  END AS categoria\nFROM patients;` }
]

export function Playground({ onOpenTopic }: { onOpenTopic: (id: string) => void }) {
  const [sql, setSql] = useState(SAMPLES[0].sql)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [ready, setReady] = useState(isReady())
  const [tables, setTables] = useState<TableInfo[]>([])
  const [openTable, setOpenTable] = useState<string | null>(null)

  useEffect(() => {
    initEngine().then(() => {
      setReady(true)
      setTables(getSchema())
    })
  }, [])

  const exec = (q?: string) => {
    const query = q ?? sql
    if (q) setSql(q)
    setResult(runQuery(query))
  }

  const doReset = () => {
    resetDatabase()
    setTables(getSchema())
    setResult(null)
  }

  const runtimeMs = useMemo(() => 0, []) // placeholder para futuras métricas

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      {/* columna principal */}
      <div className="space-y-4">
        <Reveal>
          <div className="card !bg-panel/80 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-grey">
                <Terminal className="w-4 h-4 text-accent" />
                sql@learning:~/playground$
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={doReset}
                  title="Restaurar la DB de práctica"
                  className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-md border border-edge text-grey hover:text-accent hover:border-accent/50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> reset db
                </button>
                <button
                  onClick={() => exec()}
                  disabled={!ready}
                  className="inline-flex items-center gap-1.5 font-mono text-xs px-4 py-1.5 rounded-md bg-accent text-base font-bold hover:shadow-glow transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> RUN <kbd className="kbd !bg-transparent !border-accent/40 !text-base ml-1">⌘↵</kbd>
                </button>
              </div>
            </div>
            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  exec()
                }
              }}
              spellCheck={false}
              rows={9}
              className="w-full bg-[#1b1f2a] border border-edge rounded-lg p-4 font-mono text-[13.5px] text-ink outline-none focus:border-accent/60 focus:shadow-glow transition-all resize-y"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLES.map(s => (
                <button
                  key={s.label}
                  onClick={() => exec(s.sql)}
                  className="chip hover:border-accent/50 hover:text-ink transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* resultado */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {result.error ? (
              <div className="rounded-lg border border-accent/50 bg-accent/10 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono text-sm text-accent font-bold">SQL Error</div>
                  <div className="font-mono text-xs text-grey mt-1">{result.error}</div>
                </div>
              </div>
            ) : result.rows.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2 font-mono text-xs text-grey">
                  <span>{result.rows.length} filas · {result.columns.length} columnas</span>
                  <span className="text-green-400">✓ ejecutada con SQLite (WASM)</span>
                </div>
              <ResultTable columns={result.columns} rows={result.rows} />
              </div>
            ) : (
              <div className="rounded-lg border border-edge bg-panel/60 p-4 font-mono text-sm text-green-400">
                ✓ {result.rowsAffected ?? 0} filas afectadas — query DDL/DML ejecutada
              </div>
            )}
          </motion.div>
        )}

        {/* guía rápida */}
        <Reveal delay={0.1}>
          <div className="card !bg-panel/60 p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Table2 className="w-4 h-4 text-accent" /> ¿Qué puedes probar?
            </h3>
            <ul className="space-y-2 text-sm text-grey">
              <li>• Consultas <span className="font-mono text-ink">SELECT</span> sobre las 5 tablas del esquema (panel derecho)</li>
              <li>• <span className="font-mono text-ink">JOIN</span> entre patients, admissions, doctors y departments</li>
              <li>• Agregaciones <span className="font-mono text-ink">GROUP BY / HAVING</span> y funciones <span className="font-mono text-ink">COUNT/AVG/SUM</span></li>
              <li>• Window functions <span className="font-mono text-ink">ROW_NUMBER / LAG / LEAD</span> con OVER()</li>
              <li>• DDL/DML real: <span className="font-mono text-ink">CREATE/INSERT/UPDATE/DELETE</span> (usa reset db para volver)</li>
            </ul>
            <button
              onClick={() => onOpenTopic('join')}
              className="mt-4 font-mono text-xs text-accent hover:underline"
            >
              → ¿No sabes por dónde empezar? Abre el tema JOIN en el cheatsheet
            </button>
          </div>
        </Reveal>
      </div>

      {/* panel de esquema */}
      <Reveal delay={0.05}>
        <div className="card !bg-panel/80 p-4 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 font-mono text-xs text-grey mb-3">
            <Database className="w-4 h-4 text-accent" /> hospital_lab.db — esquema
          </div>
          {!ready && <div className="font-mono text-xs text-grey/60">cargando motor SQLite…</div>}
          {ready && (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {tables.map(t => (
                <div key={t.name} className="border border-edge rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenTable(o => (o === t.name ? null : t.name))}
                    className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-accent/10 transition-colors"
                  >
                    <span className="font-mono text-xs text-ink font-bold">{t.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-grey">{t.rowCount} filas</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-grey transition-transform ${openTable === t.name ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {openTable === t.name && (
                    <div className="p-3 bg-panel/60 border-t border-edge">
                      <div className="space-y-1 mb-3">
                        {t.columns.map(c => (
                          <div key={c.name} className="flex items-center gap-2 font-mono text-[11px]">
                            <span className={c.pk ? 'text-accent font-bold' : 'text-ink'}>{c.name}</span>
                            <span className="text-grey/60">{c.type}</span>
                            {c.pk && <span className="text-[9px] bg-accent/20 text-accent px-1 rounded">PK</span>}
                            {c.notnull && !c.pk && <span className="text-[9px] text-grey/50">NN</span>}
                          </div>
                        ))}
                      </div>
                      <div className="font-mono text-[10px] text-grey/60 mb-1.5">muestra:</div>
                      <ResultTable columns={t.sample.columns} rows={t.sample.rows} maxH="max-h-44" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  )
}
