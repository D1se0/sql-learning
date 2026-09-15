import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, Database, Play, RotateCcw, Table2, Terminal } from 'lucide-react'
import { getSchema, initEngine, isReady, resetDatabase, runQuery, type QueryResult, type TableInfo } from '../lib/sqlEngine'
import { useI18n } from '../i18n/i18n'
import { ResultTable, Reveal } from './ui'

export function Playground({ onOpenTopic }: { onOpenTopic: (id: string) => void }) {
  const { t } = useI18n()
  const [sql, setSql] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [ready, setReady] = useState(isReady())
  const [tables, setTables] = useState<TableInfo[]>([])
  const [openTable, setOpenTable] = useState<string | null>(null)

  // muestras: etiquetas traducidas, SQL intacto (el CASE sale del dict sin traducir)
  const samples: { label: string; sql: string }[] = [
    { label: t('pg.sample.1'), sql: 'SELECT first_name, last_name, city\nFROM patients\nLIMIT 5;' },
    { label: t('pg.sample.2'), sql: `SELECT p.first_name, p.last_name, d.name AS department, a.diagnosis\nFROM admissions a\nJOIN patients p ON p.patient_id = a.patient_id\nJOIN departments d ON d.department_id = a.department_id\nWHERE a.discharge_date IS NULL;` },
    { label: t('pg.sample.3'), sql: `SELECT d.name, COUNT(*) AS ingresos\nFROM admissions a\nJOIN departments d ON d.department_id = a.department_id\nGROUP BY d.name\nHAVING COUNT(*) > 3\nORDER BY ingresos DESC;` },
    { label: t('pg.sample.4'), sql: `SELECT first_name, weight,\n  ROW_NUMBER() OVER (ORDER BY weight DESC) AS rn\nFROM patients\nLIMIT 8;` },
    { label: t('pg.sample.5'), sql: `SELECT first_name, weight\nFROM patients\nWHERE weight > (SELECT AVG(weight) FROM patients)\nORDER BY weight DESC;` },
    { label: t('pg.sample.6'), sql: t('pg.sample.6.sql') }
  ]

  useEffect(() => {
    // SQL inicial solo si está vacío (no pisa lo que el usuario trae del cheatsheet)
    setSql(current => current || samples[0].sql)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                  title={t('pg.reset.title')}
                  className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-md border border-edge text-grey hover:text-accent hover:border-accent/50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t('pg.reset')}
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
              {samples.map(s => (
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
                  <span>{result.rows.length} {t('pg.rows')} · {result.columns.length} {t('pg.columns')}</span>
                  <span className="text-green-400">{t('pg.executed')}</span>
                </div>
                <ResultTable columns={result.columns} rows={result.rows} />
              </div>
            ) : (
              <div className="rounded-lg border border-edge bg-panel/60 p-4 font-mono text-sm text-green-400">
                ✓ {result.rowsAffected ?? 0} {t('pg.rowsAffected')}
              </div>
            )}
          </motion.div>
        )}

        {/* guía rápida */}
        <Reveal delay={0.1}>
          <div className="card !bg-panel/60 p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Table2 className="w-4 h-4 text-accent" /> {t('pg.guide.title')}
            </h3>
            <ul className="space-y-2 text-sm text-grey">
              {[t('pg.guide.1'), t('pg.guide.2'), t('pg.guide.3'), t('pg.guide.4'), t('pg.guide.5')].map((g, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: g }} />
              ))}
            </ul>
            <button
              onClick={() => onOpenTopic('join')}
              className="mt-4 font-mono text-xs text-accent hover:underline"
            >
              {t('pg.guide.link')}
            </button>
          </div>
        </Reveal>
      </div>

      {/* panel de esquema */}
      <Reveal delay={0.05}>
        <div className="card !bg-panel/80 p-4 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 font-mono text-xs text-grey mb-3">
            <Database className="w-4 h-4 text-accent" /> {t('pg.schema.title')}
          </div>
          {!ready && <div className="font-mono text-xs text-grey/60">{t('pg.loading')}</div>}
          {ready && (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {tables.map(tb => (
                <div key={tb.name} className="border border-edge rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenTable(o => (o === tb.name ? null : tb.name))}
                    className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-accent/10 transition-colors"
                  >
                    <span className="font-mono text-xs text-ink font-bold">{tb.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-grey">{tb.rowCount} {t('pg.rows')}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-grey transition-transform ${openTable === tb.name ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {openTable === tb.name && (
                    <div className="p-3 bg-panel/60 border-t border-edge">
                      <div className="space-y-1 mb-3">
                        {tb.columns.map(c => (
                          <div key={c.name} className="flex items-center gap-2 font-mono text-[11px]">
                            <span className={c.pk ? 'text-accent font-bold' : 'text-ink'}>{c.name}</span>
                            <span className="text-grey/60">{c.type}</span>
                            {c.pk && <span className="text-[9px] bg-accent/20 text-accent px-1 rounded">PK</span>}
                            {c.notnull && !c.pk && <span className="text-[9px] text-grey/50">NN</span>}
                          </div>
                        ))}
                      </div>
                      <div className="font-mono text-[10px] text-grey/60 mb-1.5">{t('pg.sample.label')}</div>
                      <ResultTable columns={tb.sample.columns} rows={tb.sample.rows} maxH="max-h-44" />
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
