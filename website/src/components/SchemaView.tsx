import { useEffect, useState } from 'react'
import { Database, ExternalLink, Play, RotateCcw } from 'lucide-react'
import { getSchema, initEngine, isReady, resetDatabase, runQuery, type TableInfo } from '../lib/sqlEngine'
import { setPendingSql } from '../lib/store'
import { navigate } from '../lib/store'
import { Reveal, ResultTable } from './ui'

export function SchemaView() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [ready, setReady] = useState(isReady())

  useEffect(() => {
    initEngine().then(() => {
      setReady(true)
      setTables(getSchema())
    })
  }, [])

  const doReset = () => {
    resetDatabase()
    setTables(getSchema())
  }

  const quick = (sql: string) => {
    setPendingSql(sql)
    navigate({ view: 'playground' })
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="section-tag mb-2">// playground › referencia</p>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Esquema de la DB<span className="text-accent">_</span>
            </h1>
            <p className="text-grey mt-2 text-sm">
              Base ficticia <span className="font-mono text-ink">hospital_lab.db</span> — 5 tablas relacionadas, cargada en SQLite (WASM) en tu navegador.
            </p>
          </div>
          <button onClick={doReset} className="inline-flex items-center gap-1.5 font-mono text-xs px-4 py-2 rounded-md border border-edge text-grey hover:text-accent hover:border-accent/50 transition-colors self-start">
            <RotateCcw className="w-3.5 h-3.5" /> restaurar DB
          </button>
        </div>
      </Reveal>

      {!ready && <div className="font-mono text-xs text-grey/60">cargando motor SQLite…</div>}

      <div className="grid md:grid-cols-2 gap-5">
        {tables.map((t, i) => (
          <Reveal key={t.name} delay={Math.min(i * 0.07, 0.35)}>
            <div className="card !bg-panel/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
                    <Database className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-mono text-sm text-white font-bold">{t.name}</div>
                    <div className="font-mono text-[10px] text-grey">{t.rowCount} filas · {t.columns.length} columnas</div>
                  </div>
                </div>
                <button
                  onClick={() => quick(`SELECT * FROM ${t.name};`)}
                  title="Hacer SELECT * en el playground"
                  className="p-2 rounded-md border border-edge text-grey hover:text-green-400 hover:border-green-400/50 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 font-mono text-xs mb-4">
                  {t.columns.map(c => (
                    <div key={c.name} className="contents">
                      <span className="flex items-center gap-2">
                        <span className={c.pk ? 'text-accent font-bold' : 'text-ink'}>{c.name}</span>
                        {c.pk && <span className="text-[9px] bg-accent/20 text-accent px-1 rounded">PK</span>}
                        {c.notnull && !c.pk && <span className="text-[9px] text-grey/50">NN</span>}
                      </span>
                      <span className="text-grey/60">{c.type}</span>
                    </div>
                  ))}
                </div>
                <div className="font-mono text-[10px] text-grey/60 mb-1.5 uppercase tracking-widest">muestra (5)</div>
                <ResultTable columns={t.sample.columns} rows={t.sample.rows} maxH="max-h-48" />
                <button
                  onClick={() => quick(`SELECT * FROM ${t.name};`)}
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-accent hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> consultar en el playground
                </button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* diagrama rápido de relaciones */}
      <Reveal delay={0.1}>
        <div className="card !bg-panel/60 p-6 mt-8">
          <h3 className="text-white font-bold mb-3">Relaciones (FK)</h3>
          <div className="font-mono text-xs text-grey space-y-1.5">
            <div><span className="text-ink">admissions.patient_id</span> <span className="text-accent">→</span> <span className="text-ink">patients.patient_id</span></div>
            <div><span className="text-ink">admissions.doctor_id</span> <span className="text-accent">→</span> <span className="text-ink">doctors.doctor_id</span></div>
            <div><span className="text-ink">admissions.department_id</span> <span className="text-accent">→</span> <span className="text-ink">departments.department_id</span></div>
            <div><span className="text-ink">lab_results.patient_id</span> <span className="text-accent">→</span> <span className="text-ink">patients.patient_id</span></div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
