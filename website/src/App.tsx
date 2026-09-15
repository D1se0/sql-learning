import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronRight, Github, Menu, Search, Sparkles, Table2, Terminal
} from 'lucide-react'
import { navigate, useRoute, type Route } from './lib/store'
import { initEngine } from './lib/sqlEngine'
import { useI18n, type Topic } from './i18n/i18n'
import { SearchPalette, type SearchItem } from './components/SearchPalette'
import { Home } from './components/Home'
import { TopicView } from './components/TopicView'
import { Playground } from './components/Playground'
import { Challenges } from './components/Challenges'
import { SchemaView } from './components/SchemaView'
import { LanguageSwitcher } from './components/LanguageSwitcher'

/* ---------- enlaces del sidebar ---------- */
function TopicLink({ t, route, go }: { t: Topic; route: Route; go: (r: Route) => void }) {
  const active = route.view === 'topic' && route.id === t.id
  return (
    <button
      onClick={() => go({ view: 'topic', id: t.id })}
      className={`w-full text-left px-3 py-1.5 rounded-md font-mono text-xs transition-colors ${
        active ? 'text-accent bg-accent/10' : 'text-grey hover:text-ink hover:bg-card/60'
      }`}
    >
      {t.title}
    </button>
  )
}

function SubGroup({ label, topics, route, go, nested = [] }: {
  label: string
  topics: Topic[]
  route: Route
  go: (r: Route) => void
  nested?: { label: string; topics: Topic[] }[]
}) {
  const activeInside =
    route.view === 'topic' &&
    (topics.some(t => t.id === route.id) ||
      nested.some(n => n.topics.some(t => t.id === route.id)))
  const [open, setOpen] = useState(activeInside)
  useEffect(() => {
    if (activeInside) setOpen(true)
  }, [activeInside])
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs transition-colors ${
          activeInside ? 'text-ink' : 'text-grey hover:text-ink'
        }`}
      >
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        {label}
        <span className="ml-auto text-[10px] text-grey/50">{topics.length}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 py-0.5 space-y-0.5">
              {topics.map(t => (
                <TopicLink key={t.id} t={t} route={route} go={go} />
              ))}
              {nested.map(n => (
                <SubGroup key={n.label} label={n.label} topics={n.topics} route={route} go={go} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- índice de búsqueda global (i18n-aware) ---------- */
function useSearchIndex(): SearchItem[] {
  const { t, topics, search } = useI18n()
  return useMemo(() => {
    const items: SearchItem[] = []
    for (const tp of topics) {
      items.push({ id: tp.id, title: tp.title, cat: tp.cat, sub: tp.sub, kws: [], route: { view: 'topic', id: tp.id }, icon: 'topic' })
    }
    for (const s of search) {
      if (!s.kws.length) continue
      items.push({
        id: s.id,
        title: s.kws[0],
        cat: s.cat,
        sub: s.sub,
        kws: s.kws,
        route: { view: 'topic', id: s.id },
        icon: 'cmd',
        subtitle: s.kws.slice(1).join(' · ')
      })
    }
    items.push({ id: 'playground', title: t('tool.title.playground'), cat: t('search.cat.tools'), sub: '', kws: t('search.kw.playground').split(', '), route: { view: 'playground' }, icon: 'db' })
    items.push({ id: 'challenges', title: t('tool.title.challenges'), cat: t('search.cat.tools'), sub: '', kws: t('search.kw.challenges').split(', '), route: { view: 'challenges' }, icon: 'db' })
    items.push({ id: 'schema', title: t('tool.title.schema'), cat: t('search.cat.tools'), sub: '', kws: t('search.kw.schema').split(', '), route: { view: 'schema' }, icon: 'db' })
    return items
  }, [t, topics, search])
}

/* ---------- estructura del sidebar ---------- */
const CAT_ORDER = ['Query Basics', 'Query Filtering', 'Functions', 'Tables'] as const
// orden de subgrupos de Functions + anidamiento (Math dentro de Numeric), como el original
const SUB_ORDER = ['Aggregate', 'Window', 'String', 'Numeric', 'Date']

function Sidebar({ route, onNavigate, mobileOpen, onCloseMobile }: {
  route: Route
  onNavigate: (r: Route) => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const { t, topics: TOPICS } = useI18n()
  const groups = useMemo(() => {
    const m = new Map<string, Topic[]>()
    for (const tp of TOPICS) {
      if (!m.has(tp.cat)) m.set(tp.cat, [])
      m.get(tp.cat)!.push(tp)
    }
    return m
  }, [TOPICS])

  const activeCat = route.view === 'topic' ? TOPICS.find(tp => tp.id === route.id)?.cat : null
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(activeCat ? [activeCat] : ['Query Basics']))

  useEffect(() => {
    if (activeCat) setOpenCats(s => new Set(s).add(activeCat))
  }, [activeCat])

  const toggle = (c: string) =>
    setOpenCats(s => {
      const n = new Set(s)
      if (n.has(c)) n.delete(c)
      else n.add(c)
      return n
    })

  const go = (r: Route) => {
    onNavigate(r)
    onCloseMobile()
  }

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onCloseMobile} />}
      <aside className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-screen lg:h-[calc(100vh-4rem)] w-72 shrink-0 bg-panel border-r border-edge overflow-y-auto transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-grey/60 mb-3 px-1">{t('sidebar.tools')}</div>
          {[
            { r: { view: 'playground' } as Route, icon: <Terminal className="w-4 h-4" />, label: t('tool.playground') },
            { r: { view: 'challenges' } as Route, icon: <Sparkles className="w-4 h-4" />, label: t('tool.challenges') },
            { r: { view: 'schema' } as Route, icon: <Table2 className="w-4 h-4" />, label: t('tool.schema') }
          ].map(item => {
            const active = route.view === item.r.view
            return (
              <button
                key={item.r.view}
                onClick={() => go(item.r)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-mono text-[13px] mb-1 transition-colors ${
                  active ? 'bg-accent/15 text-accent border border-accent/40' : 'text-grey hover:text-ink hover:bg-card border border-transparent'
                }`}
              >
                {item.icon} {item.label}
              </button>
            )
          })}

          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-grey/60 mt-5 mb-2 px-1">{t('sidebar.cheatsheet')}</div>
          {CAT_ORDER.map(cat => {
            const topics = groups.get(cat) ?? []
            const open = openCats.has(cat)
            // subgrupos solo en Functions (Aggregate, Window, String, Numeric›Math, Date), como el original
            const subgroups = new Map<string, Topic[]>()
            for (const tp of topics) {
              const s = cat === 'Functions' ? tp.sub : ''
              if (!subgroups.has(s)) subgroups.set(s, [])
              subgroups.get(s)!.push(tp)
            }
            const hasSubs = cat === 'Functions'
            return (
              <div key={cat} className="mb-1.5">
                <button
                  onClick={() => toggle(cat)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-[13px] transition-colors ${
                    open ? 'text-ink bg-card' : 'text-grey hover:text-ink hover:bg-card/60'
                  }`}
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
                  {cat}
                  <span className="ml-auto text-[10px] text-grey/50">{topics.length}</span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 py-1 space-y-0.5">
                        {hasSubs
                          ? SUB_ORDER.filter(s => subgroups.has(s) || s === 'Numeric').map(s => {
                              // Math se renderiza anidado dentro de Numeric, como el original
                              const nested =
                                s === 'Numeric' && subgroups.has('Math')
                                  ? [{ label: 'Math', topics: subgroups.get('Math')! }]
                                  : []
                              return (
                                <SubGroup
                                  key={s}
                                  label={s}
                                  topics={subgroups.get(s) ?? []}
                                  route={route}
                                  go={go}
                                  nested={nested}
                                />
                              )
                            })
                          : topics.map(tp => <TopicLink key={tp.id} t={tp} route={route} go={go} />)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}

/* ---------- app ---------- */
export default function App() {
  const route = useRoute()
  const { t, topics } = useI18n()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [engineReady, setEngineReady] = useState(false)
  const index = useSearchIndex()

  useEffect(() => {
    initEngine().then(() => setEngineReady(true))
  }, [])

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const nav = (r: Route) => {
    navigate(r)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-base">
      {/* topbar */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-base/85 backdrop-blur-xl border-b border-edge">
        <div className="h-full px-4 lg:px-6 flex items-center gap-3">
          <button className="lg:hidden p-2 text-grey hover:text-ink" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={() => nav({ view: 'home' })} className="flex items-center gap-2.5 shrink-0">
            <span className="w-8 h-8 rounded-md bg-accent/15 border border-accent/40 flex items-center justify-center font-mono font-bold text-accent text-xs">
              SQL
            </span>
            <span className="font-mono font-bold text-white text-sm tracking-tight hidden sm:block">
              sql-learning<span className="text-accent animate-blink">_</span>
            </span>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="ml-auto md:ml-6 flex-1 max-w-md flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-edge bg-card/60 hover:border-accent/40 transition-colors text-left"
          >
            <Search className="w-4 h-4 text-grey" />
            <span className="font-mono text-xs text-grey/70 hidden sm:block">{t('header.search')}</span>
            <kbd className="kbd ml-auto hidden sm:inline-flex">Ctrl K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-3">
            <span
              className={`hidden md:flex items-center gap-1.5 font-mono text-[10px] ${engineReady ? 'text-green-500' : 'text-grey/50'}`}
              title={t('header.sqliteTitle')}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${engineReady ? 'bg-green-500 animate-pulse' : 'bg-grey/50'}`} />
              {t('header.sqliteReady')}
            </span>
            <LanguageSwitcher />
            <a
              href="https://github.com/D1se0/sql-learning"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-md border border-edge text-grey hover:text-accent hover:border-accent/50 transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* layout */}
      <div className="pt-16 flex">
        <Sidebar route={route} onNavigate={nav} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)]">
          {route.view === 'home' && <Home onSearch={() => setSearchOpen(true)} />}
          {route.view === 'topic' && <TopicView key={route.id} id={route.id} />}
          {route.view === 'playground' && <Playground onOpenTopic={id => nav({ view: 'topic', id })} />}
          {route.view === 'challenges' && <Challenges />}
          {route.view === 'schema' && <SchemaView />}

          <footer className="border-t border-edge mt-10">
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs text-grey">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {t('footer.version')}
              </span>
              <span>
                {t('footer.madeBy')} <a href="https://github.com/D1se0" target="_blank" rel="noreferrer" className="text-accent hover:underline">D1se0</a> ·{' '}
                <a href="https://github.com/D1se0/sql-learning" target="_blank" rel="noreferrer" className="hover:text-ink">{t('footer.repo')}</a>
              </span>
            </div>
          </footer>
        </main>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} items={index} />
    </div>
  )
}
