import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Play } from 'lucide-react'
import { TOPICS } from '../data'
import { markVisited, navigate } from '../lib/store'
import { setPendingSql } from '../lib/store'
import { Reveal, SqlCode, P } from './ui'

export function TopicView({ id }: { id: string }) {
  const idx = TOPICS.findIndex(t => t.id === id)
  const topic = TOPICS[idx]

  useEffect(() => {
    if (topic) markVisited(topic.id)
    window.scrollTo(0, 0)
  }, [topic])

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="font-mono text-grey">Tema no encontrado: <span className="text-accent">{id}</span></div>
        <button onClick={() => navigate({ view: 'home' })} className="mt-4 font-mono text-sm text-accent hover:underline">
          ← volver al inicio
        </button>
      </div>
    )
  }

  const prev = TOPICS[idx - 1]
  const next = TOPICS[idx + 1]
  const goPlay = (sql: string) => {
    setPendingSql(sql)
    navigate({ view: 'playground' })
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Reveal>
        <button onClick={() => navigate({ view: 'home' })} className="inline-flex items-center gap-1.5 font-mono text-xs text-grey hover:text-accent transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> cheatsheet
        </button>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="section-tag mb-2">// {topic.cat} › {topic.sub}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            {topic.title}<span className="text-accent">_</span>
          </h1>
        </motion.div>
      </Reveal>

      <div className="mt-10 space-y-5">
        {topic.blocks.map((b, i) => {
          if (b.t === 'h1') return <h2 key={i} className="text-2xl font-extrabold text-white pt-4">{b.text}</h2>
          if (b.t === 'h2') return (
            <h2 key={i} className="text-xl font-bold text-accent-soft border-t border-edge/60 pt-6 mt-8 first:mt-0 first:border-0">
              {b.text}
            </h2>
          )
          if (b.t === 'h3') return <h3 key={i} className="text-lg font-bold text-white pt-2">{b.text}</h3>
          if (b.t === 'p') return <P key={i} html={b.html} />
          if (b.t === 'ul') return (
            <ul key={i} className="space-y-1.5 list-none">
              {b.items.map((li, j) => (
                <li key={j} className="text-grey text-[15px] leading-relaxed flex gap-2">
                  <span className="text-accent shrink-0">▸</span>
                  <span dangerouslySetInnerHTML={{ __html: li }} />
                </li>
              ))}
            </ul>
          )
          if (b.t === 'code') return <SqlCode key={i} code={b.text} onRun={goPlay} />
          if (b.t === 'img') return (
            <img key={i} src={b.src} alt={b.alt} className="rounded-xl border border-edge my-4 max-w-full" />
          )
          return null
        })}
      </div>

      {/* prev / next */}
      <div className="mt-14 grid grid-cols-2 gap-4">
        {prev ? (
          <button onClick={() => navigate({ view: 'topic', id: prev.id })} className="card p-4 text-left group">
            <div className="font-mono text-[10px] text-grey/60 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> anterior</div>
            <div className="font-mono text-sm text-ink group-hover:text-accent transition-colors mt-1">{prev.title}</div>
          </button>
        ) : <div />}
        {next && (
          <button onClick={() => navigate({ view: 'topic', id: next.id })} className="card p-4 text-right group">
            <div className="font-mono text-[10px] text-grey/60">siguiente <ArrowRight className="w-3 h-3 inline" /></div>
            <div className="font-mono text-sm text-ink group-hover:text-accent transition-colors mt-1">{next.title}</div>
          </button>
        )}
      </div>
    </div>
  )
}
