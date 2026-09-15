// langs.ts — idiomas disponibles (los 5 comparten el mismo juego de claves)
export type Lang = 'es' | 'en' | 'fr' | 'de' | 'pt'

export const LANGS: { code: Lang; flag: string; short: string; name: string }[] = [
  { code: 'es', flag: '🇪🇸', short: 'ES', name: 'Español' },
  { code: 'en', flag: '🇬🇧', short: 'EN', name: 'English' },
  { code: 'fr', flag: '🇫🇷', short: 'FR', name: 'Français' },
  { code: 'de', flag: '🇩🇪', short: 'DE', name: 'Deutsch' },
  { code: 'pt', flag: '🇧🇷', short: 'PT', name: 'Português' }
]

export const isLang = (x: string): x is Lang => LANGS.some(l => l.code === x)
