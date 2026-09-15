import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, CheckCircle2, Eye, EyeOff, Lightbulb, Play, RotateCcw, XCircle } from 'lucide-react'
import { CHALLENGES, checkChallenge, type Challenge } from '../lib/challenges'
import { initEngine, isReady, resetDatabase, runQuery } from '../lib/sqlEngine'
import { getSolved, markSolved } from '../lib/store'
import type { QueryResult } from '../lib/sqlEngine'
import { ResultTable, Reveal, SqlCode } from './ui'

function ChallengeCard({ ch, index, solved, onSolved }: {
  ch: Challenge
  index: number
  solved: boolean
  onSolved: (id: string) => void
}) {
  const [sql, setSql] = useState('')
  const [res, setRes] = useState<QueryResult | null>(null)
  const [verdict, setVerdict] = useState<{ pass: boolean; reason: string } | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showSol, setShowSol] = useState(false)

  const exec = () => {
    if (!sql.trim()) return
    const user = runQuery(sql)
    const sol = runQuery(ch.solution)
    const v = checkChallenge(ch, user, sol)
    setRes(user)
    setVerdict(v)
    if (v.pass) onSolved(ch.id)
  }

  return (
    <Reveal delay={Math.min(index * 0.06, 0.3)}>
      <div className="card !bg-panel/80 overflow-hidden">
        {/* header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                ch.level === 'fácil' ? 'text-green-400 border-green-400/40 bg-green-400/10' :
                ch.level === 'medio' ? 'text-orange-300 border-orange-300/40 bg-orange-300/10' :
                'text-accent border-accent/40 bg-accent/10'
              }`}>
                {ch.level}
              </span>
              {solved && (
                <span className="font-mono text-[10px] text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> resuelto
                </span>
              )}
            </div>
            <h3 className="text-white font-bold">{ch.title}</h3>
            <p className="text-grey text-sm mt-1">{ch.brief}</p>
          </div>
          <span className="font-mono text-[10px] text-grey/50 shrink-0">#{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="px-5 pb-5 space-y-3">
          <div className="relative">
            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); exec() }
              }}
              spellCheck={false}
              rows={4}
              placeholder="-- escribe aquí tu query y pulsa RUN (o Ctrl+Enter)"
              className="w-full bg-[#1b1f2a] border border-edge rounded-lg p-3 font-mono text-[13px] text-ink outline-none focus:border-accent/60 transition-all resize-y"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exec}
              className="inline-flex items-center gap-1.5 font-mono text-xs px-4 py-1.5 rounded-md bg-accent text-base font-bold hover:shadow-glow transition-all"
            >
              <Play className="w-3.5 h-3.5" /> RUN
            </button>
            <button
              onClick={() => setShowHint(h => !h)}
              className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-md border border-edge text-grey hover:text-accent hover:border-accent/50 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" /> pista
            </button>
            <button
              onClick={() => setShowSol(s => !s)}
              className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-md border border-edge text-grey hover:text-accent hover:border-accent/50 transition-colors"
            >
              {showSol ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              solución
            </button>
            <button
              onClick={() => { setSql(''); setRes(null); setVerdict(null) }}
              className="ml-auto font-mono text-xs text-grey/60 hover:text-grey transition-colors"
            >
              limpiar
            </button>
            {showHint && (
              <div className="rounded-lg border border-orange-300/30 bg-orange-300/5 px-3 py-2 font-mono text-xs text-orange-300">
                💡 {ch.hint}
              </div>
            )}
          </div>
          <AnimatePresence>
            {showSol && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <SqlCode code={ch.solution} onRun={setSql} />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {verdict && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-lg border p-3 flex items-start gap-2.5 ${
                  verdict.pass ? 'border-green-400/40 bg-green-400/10' : 'border-accent/40 bg-accent/10'
                }`}
              >
                {verdict.pass ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-accent shrink-0" />}
                <div>
                  <div className={`font-mono text-xs font-bold ${verdict.pass ? 'text-green-400' : 'text-accent'}`}>
                    {verdict.pass ? '✓ PASS' : '✗ FAIL'}
                  </div>
                  <div className="text-xs text-grey mt-0.5">{verdict.reason}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {res && !res.error && res.rows.length > 0 && (
            <ResultTable columns={res.columns} rows={res.rows.slice(0, 10)} maxH="max-h-56" />
          )}
        </div>
      </div>
    </Reveal>
  )
}

export function Challenges() {
  const [solved, setSolved] = useState<Set<string>>(getSolved())
  const [level, setLevel] = useState<'all' | Challenge['level']>('all')
  // esperar al motor (importante en deep-link directo a #/challenges)
  const [ready, setReady] = useState(isReady())
  useEffect(() => {
    let alive = true
    initEngine().then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  const list = useMemo(
    () => CHALLENGES.filter(c => level === 'all' || c.level === level),
    [level]
  )
  const pct = Math.round((solved.size / CHALLENGES.length) * 100)

  const mark = (id: string) => {
    markSolved(id)
    setSolved(getSolved())
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="card !bg-panel/80 p-5 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-accent" />
              <span className="font-mono text-xs text-grey">
                progreso: {solved.size}/{CHALLENGES.length} retos
              </span>
            </div>
            <div className="w-56 h-2 rounded-full bg-card overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-dark via-accent to-accent-soft"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'fácil', 'medio', 'difícil'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`font-mono text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  level === l ? 'bg-accent/15 border-accent/50 text-accent' : 'border-edge text-grey hover:text-ink'
                }`}
              >
                {l === 'all' ? 'todos' : l}
              </button>
            ))}
          </div>
      </div>
      </Reveal>

      {!ready && (
        <div className="font-mono text-xs text-grey/60">cargando motor SQL…</div>
      )}
      {ready && (
        <div className="grid md:grid-cols-2 gap-5">
          {list.map((ch, i) => (
            <ChallengeCard key={ch.id} ch={ch} index={i} solved={solved.has(ch.id)} onSolved={mark} />
          ))}
        </div>
      )}

      {!ready && list.length === 0 && <div className="text-grey text-sm">Sin retos en este nivel.</div>}
      {ready && list.length === 0 && <div className="text-grey text-sm">Sin retos en este nivel.</div>}
    </div>
  )
}
