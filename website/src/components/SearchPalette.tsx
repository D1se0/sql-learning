import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, Database, Search, Terminal } from 'lucide-react'
import { navigate, type Route } from '../lib/store'
import { useI18n } from '../i18n/i18n'

export type SearchItem = {
  id: string
  title: string
  cat: string
  sub: string
  kws: string[]
  route: Route
  icon: 'topic' | 'cmd' | 'db'
  subtitle?: string
}

type Props = {
  open: boolean
  onClose: () => void
  items: SearchItem[]
}

export function SearchPalette({ open, onClose, items }: Props) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return items.slice(0, 9)
    const tokens = t.split(/\s+/)
    const scored: { it: SearchItem; score: number }[] = []
    for (const it of items) {
      const hay = `${it.title} ${it.cat} ${it.sub} ${it.kws.join(' ')} ${it.subtitle ?? ''}`.toLowerCase()
      let score = 0
      let ok = true
      for (const tok of tokens) {
        if (it.title.toLowerCase() === tok) score += 30
        else if (it.title.toLowerCase().startsWith(tok)) score += 15
        else if (it.title.toLowerCase().includes(tok)) score += 8
        else if (it.kws.some(k => k.toLowerCase().includes(tok))) score += 4
        else if (hay.includes(tok)) score += 2
        else { ok = false; break }
        if (it.icon === 'cmd' && tok.length > 2 && it.title.toLowerCase().includes(tok)) score += 6
      }
      if (ok) scored.push({ it, score })
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(x => x.it)
  }, [q, items])

  useEffect(() => setSel(0), [q])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  const run = (it: SearchItem) => {
    navigate(it.route)
    onClose()
  }

  const iconFor = (icon: SearchItem['icon']) =>
    icon === 'cmd' ? <Terminal className="w-4 h-4 text-accent" /> :
    icon === 'db' ? <Database className="w-4 h-4 text-cyan-300" /> :
    null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-xl bg-panel border border-edge rounded-2xl shadow-glass overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-edge">
              <Search className="w-4 h-4 text-accent" />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
                  if (e.key === 'Enter' && results[sel]) run(results[sel])
                  if (e.key === 'Escape') onClose()
                }}
                placeholder={t('header.searchPlaceholder')}
                className="flex-1 bg-transparent outline-none font-mono text-sm text-ink placeholder:text-grey/50"
              />
              <kbd className="kbd">esc</kbd>
            </div>
            <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <div className="px-4 py-8 text-center text-grey text-sm">
                  {t('search.noResults')} <span className="text-accent font-mono">{q}</span>
                </div>
              )}
              {results.map((it, i) => (
                <button
                  key={it.icon + it.id}
                  data-idx={i}
                  onClick={() => run(it)}
                  onMouseEnter={() => setSel(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    sel === i ? 'bg-accent/15 border border-accent/40' : 'border border-transparent hover:bg-card'
                  }`}
                >
                  <span className="w-8 h-8 rounded-md bg-card border border-edge flex items-center justify-center shrink-0">
                    {iconFor(it.icon) ?? <span className="font-mono text-[10px] text-accent font-bold">{it.title.slice(0, 2)}</span>}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-mono text-sm text-ink truncate">{it.title}</span>
                    <span className="block text-[11px] text-grey truncate">
                      {it.sub ? `${it.cat} › ${it.sub}` : it.cat}{it.subtitle ? ` — ${it.subtitle}` : ''}
                    </span>
                  </span>
                  {sel === i && <CornerDownLeft className="w-4 h-4 text-accent shrink-0" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-edge font-mono text-[10px] text-grey/70">
              <span className="flex items-center gap-1"><kbd className="kbd !px-1.5 !py-0.5">↑↓</kbd> {t('search.navigate')}</span>
              <span className="flex items-center gap-1"><kbd className="kbd !px-1.5 !py-0.5">↵</kbd> {t('search.openKey')}</span>
              <span className="ml-auto">{results.length} {t('search.results')}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
