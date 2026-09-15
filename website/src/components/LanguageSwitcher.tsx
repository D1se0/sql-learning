import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { LANGS, useI18n, type Lang } from '../i18n/i18n'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<Lang | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (l: Lang) => {
    if (l === lang) { setOpen(false); return }
    setBusy(l)
    // dar un frame para que se pinte el spinner antes del trabajo (sync cache hit)
    setTimeout(() => {
      setLang(l)
      setBusy(null)
      setOpen(false)
    }, 60)
  }

  const current = LANGS.find(l => l.code === lang)!
  const loading = (l: Lang) => busy === l

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title={t('lang.title')}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-md border border-edge text-grey hover:text-accent hover:border-accent/50 transition-colors"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-mono text-xs hidden sm:inline">{current.short}</span>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-[calc(100%+8px)] w-44 bg-panel border border-edge rounded-xl shadow-glass overflow-hidden z-[60]"
          >
            <div className="px-3 pt-2.5 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-grey/60">
              {t('lang.title')}
            </div>
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => pick(l.code)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/10 transition-colors"
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className={`font-mono text-xs flex-1 ${l.code === lang ? 'text-accent' : 'text-grey'}`}>{l.name}</span>
                {l.code === lang ? (
                  <Check className="w-3.5 h-3.5 text-accent" />
                ) : loading(l.code) ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-grey" />
                ) : null}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
