import topicsJson from './data/topics.json'
import searchJson from './data/search.json'

export type Block =
  | { t: 'h1' | 'h2' | 'h3'; text: string }
  | { t: 'p'; html: string }
  | { t: 'ul'; items: string[] }
  | { t: 'code'; lang: string; text: string }
  | { t: 'img'; src: string; alt: string }

export type Topic = {
  id: string
  title: string
  cat: string
  sub: string
  blocks: Block[]
}

export type SearchEntry = {
  id: string
  title: string
  cat: string
  sub: string
  kws: string[]
}

export const TOPICS = topicsJson as Topic[]
export const SEARCH = searchJson as SearchEntry[]
