import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const dataDir = join(process.cwd(), 'data')
mkdirSync(dataDir, { recursive: true })

const db = new Database(join(dataDir, 'bsd-cache.sqlite'))
db.exec('PRAGMA journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )
`)

const getStmt = db.prepare('SELECT payload FROM cache WHERE key = ? AND expires_at > ?')
const setStmt = db.prepare(
  'INSERT OR REPLACE INTO cache (key, payload, expires_at) VALUES (?, ?, ?)',
)

function readCached<T>(key: string): T | null {
  const row = getStmt.get(key, Date.now()) as { payload: string } | null
  return row ? (JSON.parse(row.payload) as T) : null
}

function writeCached(key: string, payload: unknown, ttlMs: number): void {
  setStmt.run(key, JSON.stringify(payload), Date.now() + ttlMs)
}

// Endpoint families are cached server-side to respect BSD's own cache hints and
// to stay well under the 10 req/s burst limit.
function ttlFor(path: string): number {
  if (path.startsWith('/events/live/')) return 10_000
  if (path.startsWith('/odds/')) return 30_000
  if (path.startsWith('/events/')) return 300_000
  if (path.startsWith('/predictions/')) return 120_000
  if (path.includes('/stats/')) return 300_000
  return 600_000
}

export function cacheKey(path: string, query: URLSearchParams): string {
  return `${path}?${query.toString()}`
}

export function cachedGet<T>(key: string): T | null {
  return readCached<T>(key)
}

export function cachedSet(key: string, path: string, payload: unknown): void {
  writeCached(key, payload, ttlFor(path))
}