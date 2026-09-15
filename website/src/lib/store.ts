// store.ts — helpers de estado: routing por hash + progreso en localStorage
import { useEffect, useState } from 'react'

export type Route =
  | { view: 'home' }
  | { view: 'topic'; id: string }
  | { view: 'playground' }
  | { view: 'challenges' }
  | { view: 'schema' }

export function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (h.startsWith('topic/')) return { view: 'topic', id: h.slice(6) }
  if (h === 'playground') return { view: 'playground' }
  if (h === 'challenges') return { view: 'challenges' }
  if (h === 'schema') return { view: 'schema' }
  return { view: 'home' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash())
  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function navigate(r: Route): void {
  const h =
    r.view === 'home' ? '' :
    r.view === 'topic' ? `#/topic/${r.id}` :
    `#/${r.view}`
  if (window.location.hash !== h) window.location.hash = h
}

/* ---------- progreso ---------- */
const VISITED_KEY = 'sql-learning:visited'
const SOLVED_KEY = 'sql-learning:solved'

function readSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || '[]'))
  } catch {
    return new Set()
  }
}

function writeSet(key: string, s: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...s]))
}

export function getVisited(): Set<string> {
  return readSet(VISITED_KEY)
}

export function markVisited(id: string): void {
  const s = getVisited()
  s.add(id)
  writeSet(VISITED_KEY, s)
}

export function getSolved(): Set<string> {
  return readSet(SOLVED_KEY)
}

export function markSolved(id: string): void {
  const s = getSolved()
  if (!s.has(id)) {
    s.add(id)
    writeSet(SOLVED_KEY, s)
  }
}

export function resetProgress(): void {
  localStorage.removeItem(VISITED_KEY)
  localStorage.removeItem(SOLVED_KEY)
}

/* ---------- SQL pendiente de ejecutar en el playground ---------- */
const PENDING_SQL = 'sql-learning:pending-sql'

export function setPendingSql(sql: string): void {
  sessionStorage.setItem(PENDING_SQL, sql)
}

export function consumePendingSql(): string | null {
  const v = sessionStorage.getItem(PENDING_SQL)
  if (v !== null) sessionStorage.removeItem(PENDING_SQL)
  return v
}
