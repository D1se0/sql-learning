// i18n.tsx — contexto de idioma: ES incluido en el bundle; EN/FR/DE/PT lazy-loaded
// (los JSON de contenido + diccionario de cada idioma se descargan al cambiar).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import dictEs from './dict.es.json'
import topicsEs from '../data/topics.json'
import searchEs from '../data/search.json'
import chEs from '../data/challenges.es.json'
import { LANGS, isLang, type Lang } from './langs'

export type Block =
  | { t: 'h1' | 'h2' | 'h3'; text: string }
  | { t: 'p'; html: string }
  | { t: 'ul'; items: string[] }
  | { t: 'code'; lang: string; text: string }
  | { t: 'img'; src: string; alt: string }

export type Topic = { id: string; title: string; cat: string; sub: string; blocks: Block[] }
export type SearchEntry = { id: string; title: string; cat: string; sub: string; kws: string[] }
export type Challenge = {
  id: string
  level: 'fácil' | 'medio' | 'difícil'
  title: string
  brief: string
  hint: string
  solution: string
  relaxed?: boolean
}

type Dict = Record<string, string>

const LS_KEY = 'sql-learning:lang'

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved && isLang(saved)) return saved
  } catch { /* noop */ }
  const nav = navigator.language?.slice(0, 2)
  return nav && isLang(nav) ? nav : 'es'
}

/* ---------- carga diferida de un idioma ---------- */
async function loadLang(l: Lang): Promise<{ dict: Dict; topics: Topic[]; search: SearchEntry[]; challenges: Challenge[] }> {
  if (l === 'es') {
    return { dict: dictEs as Dict, topics: topicsEs as Topic[], search: searchEs as SearchEntry[], challenges: chEs as Challenge[] }
  }
  const [dict, topics, search, challenges] = await Promise.all([
    import(`./dict.${l}.json`),
    import(`../data/topics.${l}.json`),
    import(`../data/search.${l}.json`),
    import(`../data/challenges.${l}.json`)
  ])
  return {
    dict: dict.default as Dict,
    topics: topics.default as Topic[],
    search: search.default as SearchEntry[],
    challenges: challenges.default as Challenge[]
  }
}

/* ---------- contexto ---------- */
type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: string, vars?: Record<string, string | number>) => string
  topics: Topic[]
  search: SearchEntry[]
  challenges: Challenge[]
  switchError: boolean
}

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  // ES viaja siempre en el bundle inicial; EN/FR/DE/PT llegan por import() dinámico
  const [packs, setPacks] = useState<Partial<Record<Lang, { dict: Dict; topics: Topic[]; search: SearchEntry[]; challenges: Challenge[] }>>>(() => ({
    es: { dict: dictEs as Dict, topics: topicsEs as Topic[], search: searchEs as SearchEntry[], challenges: chEs as Challenge[] }
  }))
  const [switchError, setSwitchError] = useState(false)

  // precargar el idioma inicial guardado/detectado si no es ES
  useEffect(() => {
    const l = initialLang()
    if (l !== 'es') loadLang(l).then(p => setPacks(prev => ({ ...prev, [l]: p }))).catch(() => setSwitchError(true))
  }, [])

  const pack = packs[lang]
  const loading = !pack

  // los niveles de los retos se mantienen canónicos (fácil/medio/difícil) para los filtros
  useEffect(() => {
    if (!pack) return
    const levels = new Set(pack.challenges.map(c => c.level))
    const valid = levels.size === 1 && (['fácil', 'medio', 'difícil'] as const).some(l => levels.has(l))
    if (!valid) {
      //Levels traducidos deconocidos → re-canonicalizar desde ES por id
      const esById = new Map<string, string>(chEs.map(c => [c.id, c.level]))
      pack.challenges.forEach(c => { c.level = (esById.get(c.id) ?? 'medio') as Challenge['level'] })
    }
  }, [pack])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(LS_KEY, l) } catch { /* noop */ }
    if (!packs[l]) {
      loadLang(l)
        .then(p => setPacks(prev => ({ ...prev, [l]: p })))
        .catch(() => { setLangState('es'); setSwitchError(true) })
    }
  }, [packs])

  const t = useCallback((k: string, vars?: Record<string, string | number>) => {
    const d = packs[lang]?.dict ?? packs.es!.dict
    let s = d[k] ?? packs.es!.dict[k] ?? k
    if (vars) for (const [key, v] of Object.entries(vars)) s = s.split(`{${key}}`).join(String(v))
    return s
  }, [lang, packs])

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t,
    topics: pack?.topics ?? (topicsEs as Topic[]),
    search: pack?.search ?? (searchEs as SearchEntry[]),
    challenges: pack?.challenges ?? (chEs as Challenge[]),
    switchError
  }), [lang, setLang, t, pack, switchError])

  return (
    <I18nContext.Provider value={value}>
      {loading ? <BootSplash /> : children}
    </I18nContext.Provider>
  )
}

function BootSplash() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="font-mono text-grey text-sm animate-pulse">
        sql<span className="text-accent">-learning</span><span className="text-accent animate-blink">_</span>
      </div>
    </div>
  )
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n fuera de I18nProvider')
  return ctx
}

export { LANGS }
export type { Lang }
