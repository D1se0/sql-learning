import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Braces, CheckCircle2, Database, Layers, Search, Sparkles, Terminal } from 'lucide-react'
import { useI18n, type Topic } from '../i18n/i18n'
import { navigate, getVisited } from '../lib/store'
import { Reveal } from './ui'

/* ---------- typewriter ---------- */
function Typewriter({ phrases }: { phrases: string[] }) {
  const [txt, setTxt] = useState('')
  const [i, setI] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const full = phrases[i % phrases.length]
    const t = setTimeout(() => {
      if (!del) {
        const n = full.slice(0, txt.length + 1)
        setTxt(n)
        if (n === full) setTimeout(() => setDel(true), 1700)
      } else {
        const n = full.slice(0, txt.length - 1)
        setTxt(n)
        if (n === '') { setDel(false); setI(x => x + 1) }
      }
    }, del ? 26 : 60)
    return () => clearTimeout(t)
  }, [txt, del, i, phrases])
  return (
    <span>
      {txt}
      <span className="text-accent animate-blink">▊</span>
    </span>
  )
}

/* ---------- hero terminal (traducible salvo los comandos) ---------- */
function HeroTerminal() {
  const { t } = useI18n()
  const script = useMemo(() => [
    { kind: 'cmd', text: 'SELECT title, level FROM challenges ORDER BY difficulty;' },
    { kind: 'out', text: t('home.term.out.1') },
    { kind: 'cmd', text: 'SELECT COUNT(*) FROM topics;' },
    { kind: 'out', text: '60' },
    { kind: 'cmd', text: 'SELECT * FROM hospital_lab WHERE engine = "sqlite-wasm";' },
    { kind: 'out', text: t('home.term.out.2') },
    { kind: 'cmd', text: 'SELECT * FROM search WHERE q = "group by";' },
    { kind: 'out', text: t('home.term.out.3') },
    { kind: 'cmd', text: 'COMMIT;' },
    { kind: 'out', text: t('home.term.out.4') }
  ], [t])
  const [line, setLine] = useState(0)
  const [chars, setChars] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idx = line % script.length
  const current = script[idx]

  // reset cuando cambia el idioma (el script cambia de longitud)
  useEffect(() => { setLine(0); setChars(0) }, [script])

  useEffect(() => {
    if (chars <= current.text.length) {
      timer.current = setTimeout(() => setChars(c => c + 1), current.kind === 'cmd' ? 42 : 12)
    } else {
      timer.current = setTimeout(() => { setLine(l => l + 1); setChars(0) }, idx === script.length - 1 ? 4000 : 220)
    }
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [chars, line, current, idx, script])

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl blur-3xl bg-accent/10 pointer-events-none" />
      <div className="relative rounded-2xl border border-edge bg-black/80 shadow-glass overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-edge">
          <span className="w-3 h-3 rounded-full bg-accent" />
          <span className="w-3 h-3 rounded-full bg-edge" />
          <span className="w-3 h-3 rounded-full bg-edge" />
          <span className="ml-3 font-mono text-xs text-grey">sql@learning — sqlite-wasm</span>
          <span className="ml-auto font-mono text-[11px] text-green-500">● live</span>
        </div>
        <div className="relative">
          <div className="px-5 py-5 min-h-[300px] font-mono text-[13px] leading-[1.85]">
            {script.slice(0, idx + 1).map((l, i) => {
              const isLast = i === idx
              return (
                <div key={`${idx}-${i}`} className={l.kind === 'cmd' ? 'text-ink' : 'text-grey'}>
                  {l.kind === 'cmd' ? (
                    <>
                      <span className="text-accent font-bold">sql&gt;</span>{' '}
                      {l.text.slice(0, isLast ? chars : undefined)}
                      {isLast && chars <= l.text.length && <span className="text-accent animate-blink">▊</span>}
                    </>
                  ) : (
                    l.text
                  )}
                </div>
              )
            })}
            <div className="h-1" />
          </div>
          <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-accent/[0.05] to-transparent animate-scanline pointer-events-none" />
        </div>
        <div className="border-t border-edge px-5 py-3 grid grid-cols-4 gap-2 font-mono text-[11px]">
          {[['60', t('home.term.label.topics')], ['10', t('home.term.label.challenges')], ['5', t('home.term.label.tables')], ['0', t('home.term.label.backend')]].map(([v, l]) => (
            <div key={l}>
              <div className="text-accent font-bold text-sm">{v}</div>
              <div className="text-grey/70">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- home ---------- */
const CATS = ['Todas', 'Query Basics', 'Query Filtering', 'Functions', 'Tables'] as const

export function Home({ onSearch }: { onSearch: () => void }) {
  const { t, topics } = useI18n()
  const [filter, setFilter] = useState<(typeof CATS)[number]>('Todas')
  const [q, setQ] = useState('')
  const [visited, setVisited] = useState<Set<string>>(getVisited())

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return topics.filter(tp => {
      const okCat = filter === 'Todas' || tp.cat === filter
      const hay = `${tp.title} ${tp.cat} ${tp.sub}`.toLowerCase()
      return okCat && (!term || hay.includes(term))
    })
  }, [filter, q, topics])

  const open = (id: string) => navigate({ view: 'topic', id })

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-edge">
        <div className="absolute inset-0 grid-bg animate-grid-drift opacity-60" />
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-[140px] bg-accent/15" />
        <div className="absolute top-40 -right-32 w-[380px] h-[380px] rounded-full blur-[140px] bg-accent/10" />
        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="inline-flex items-center gap-2 chip mb-6">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-green-500 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
              </span>
              <span className="font-mono text-xs text-grey">sql@learning:~$ <Typewriter phrases={[t('home.typewriter.1'), t('home.typewriter.2'), t('home.typewriter.3'), t('home.typewriter.4')]} /></span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
              SQL <span className="text-accent text-glow">Learning</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }} className="mt-6 text-grey leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: t('home.hero.subtitle') }} />
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate({ view: 'playground' })} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-base font-bold hover:shadow-glow transition-all group">
                <Terminal className="w-4 h-4" /> {t('home.hero.cta.playground')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={onSearch} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-edge text-ink hover:border-accent/50 hover:bg-accent/5 transition-all">
                <Search className="w-4 h-4 text-accent" /> {t('home.hero.cta.search')} <kbd className="kbd">Ctrl</kbd><kbd className="kbd">K</kbd>
              </button>
              <button onClick={() => navigate({ view: 'challenges' })} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-edge text-ink hover:border-accent/50 hover:bg-accent/5 transition-all">
                <Sparkles className="w-4 h-4 text-accent" /> {t('home.hero.cta.challenges')}
              </button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-8 flex flex-wrap gap-2.5">
              {[t('home.hero.badge.1'), t('home.hero.badge.2'), t('home.hero.badge.3'), t('home.hero.badge.4'), t('home.hero.badge.5')].map((c, i) => (
                <span key={c} className="chip animate-floatSlow" style={{ animationDelay: `${i * 0.35}s` }}>{c}</span>
              ))}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
            <HeroTerminal />
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-edge bg-panel/40">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <BookOpen className="w-5 h-5" />, v: t('home.stat.topics.v'), l: t('home.stat.topics.l'), s: t('home.stat.topics.s') },
            { icon: <Braces className="w-5 h-5" />, v: t('home.stat.cmds.v'), l: t('home.stat.cmds.l'), s: t('home.stat.cmds.s') },
            { icon: <Database className="w-5 h-5" />, v: t('home.stat.tables.v'), l: t('home.stat.tables.l'), s: t('home.stat.tables.s') },
            { icon: <Sparkles className="w-5 h-5" />, v: t('home.stat.challenges.v'), l: t('home.stat.challenges.l'), s: t('home.stat.challenges.s') }
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">{s.icon}</div>
                <div className="text-2xl font-extrabold text-white">{s.v}</div>
                <div className="font-mono text-xs text-grey">{s.l}</div>
                <div className="text-[11px] text-grey/60">{s.s}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TOPICS GRID */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-8">
            <div>
              <p className="section-tag mb-2">// cheatsheet</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {t('home.topics.title')}<span className="text-accent">_</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-grey absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={t('home.topics.filter')}
                  className="w-52 bg-card border border-edge rounded-lg pl-9 pr-3 py-2 font-mono text-xs text-ink outline-none focus:border-accent/60 transition-colors"
                />
              </div>
              {CATS.map(c => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`font-mono text-xs px-3 py-2 rounded-lg border transition-colors ${
                    filter === c ? 'bg-accent/15 border-accent/50 text-accent' : 'border-edge text-grey hover:text-ink'
                  }`}
                >
                  {c === 'Todas' ? t('home.topics.filter.all') : c}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((tp: Topic, i: number) => (
            <Reveal key={tp.id} delay={Math.min(i * 0.04, 0.4)}>
              <button onClick={() => open(tp.id)} className="card w-full text-left p-5 group relative overflow-hidden">
                {visited.has(tp.id) && <CheckCircle2 className="w-4 h-4 text-green-400 absolute top-4 right-4" />}
                <span className="font-mono text-[10px] text-grey/50 border-b border-l border-edge rounded-bl-lg px-2 py-0.5 bg-base/60 absolute top-3 right-3">
                  {tp.sub ? `${tp.cat} › ${tp.sub}` : tp.cat}
                </span>
                <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center text-accent mb-3 group-hover:scale-105 group-hover:shadow-glow transition-all">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-white font-bold font-mono group-hover:text-accent transition-colors">{tp.title}</h3>
                <div className="mt-1 text-xs text-grey/70">{tp.blocks.filter(b => b.t === 'code').length} {t('home.topics.codeExamples')}</div>
                <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all mt-3" />
              </button>
            </Reveal>
          ))}
        </div>
        {list.length === 0 && (
          <div className="text-center text-grey py-12">
            {t('home.topics.noResults.pre')} <span className="font-mono text-accent">{q}</span> — prueba{' '}
            <button onClick={onSearch} className="text-accent underline">{t('home.topics.noResults.link')}</button>
          </div>
        )}
      </section>
    </div>
  )
}
