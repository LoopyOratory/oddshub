import { Database } from 'bun:sqlite'
import { join } from 'path'

const DB_PATH = join(import.meta.dir, '../../data/oddshub.sqlite')

// Ensure data directory exists
import { mkdirSync } from 'fs'
mkdirSync(join(import.meta.dir, '../../data'), { recursive: true })

const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent read performance
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

// Create tables
db.exec(`
  -- Voting system
  CREATE TABLE IF NOT EXISTS match_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    vote TEXT NOT NULL CHECK(vote IN ('home', 'draw', 'away')),
    user_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(event_id, user_hash)
  );

  -- Public accumulators
  CREATE TABLE IF NOT EXISTS public_accumulators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    user_name TEXT NOT NULL,
    selections TEXT NOT NULL,
    total_odds REAL NOT NULL,
    stake REAL DEFAULT 10,
    potential_return REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'won', 'lost', 'void')),
    views INTEGER DEFAULT 0,
    copies INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_votes_event ON match_votes(event_id);
  CREATE INDEX IF NOT EXISTS idx_votes_user ON match_votes(user_hash);
  CREATE INDEX IF NOT EXISTS idx_accas_status ON public_accumulators(status, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_accas_code ON public_accumulators(code);
  CREATE INDEX IF NOT EXISTS idx_accas_created ON public_accumulators(created_at DESC);
`)

// Vote functions
export function castVote(eventId: number, vote: string, userHash: string): boolean {
  try {
    const stmt = db.prepare(`
      INSERT INTO match_votes (event_id, vote, user_hash)
      VALUES (?, ?, ?)
      ON CONFLICT(event_id, user_hash) DO UPDATE SET vote = excluded.vote
    `)
    stmt.run(eventId, vote, userHash)
    return true
  } catch {
    return false
  }
}

export function getVoteSummary(eventId: number) {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total_votes,
      COUNT(*) FILTER (WHERE vote = 'home') as home_votes,
      COUNT(*) FILTER (WHERE vote = 'draw') as draw_votes,
      COUNT(*) FILTER (WHERE vote = 'away') as away_votes
    FROM match_votes
    WHERE event_id = ?
  `)
  return stmt.get(eventId) as {
    total_votes: number
    home_votes: number
    draw_votes: number
    away_votes: number
  }
}

export function getUserVote(eventId: number, userHash: string): string | null {
  const stmt = db.prepare(`
    SELECT vote FROM match_votes
    WHERE event_id = ? AND user_hash = ?
  `)
  const row = stmt.get(eventId, userHash) as { vote: string } | undefined
  return row?.vote ?? null
}

// Accumulator functions
export function createAccumulator(
  code: string,
  userName: string,
  selections: unknown[],
  totalOdds: number,
  stake: number,
  potentialReturn: number
): boolean {
  try {
    const stmt = db.prepare(`
      INSERT INTO public_accumulators (code, user_name, selections, total_odds, stake, potential_return)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(code, userName, JSON.stringify(selections), totalOdds, stake, potentialReturn)
    return true
  } catch {
    return false
  }
}

export function getAccumulator(code: string) {
  // Slip pages live for 7 days, then expire automatically
  const stmt = db.prepare(`
    SELECT * FROM public_accumulators
    WHERE code = ? AND created_at >= datetime('now', '-7 days')
  `)
  const row = stmt.get(code) as Record<string, unknown> | undefined
  if (row) {
    // Increment views
    db.prepare('UPDATE public_accumulators SET views = views + 1 WHERE code = ?').run(code)
    return { ...row, selections: JSON.parse(row.selections as string) }
  }
  return null
}

export function listPublicAccas(limit = 20, offset = 0) {
  const stmt = db.prepare(`
    SELECT id, code, user_name, total_odds, stake, potential_return, status, views, copies, created_at
    FROM public_accumulators
    WHERE status = 'pending' AND created_at >= datetime('now', '-7 days')
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  return stmt.all(limit, offset)
}

export function getTopAccas(period: 'day' | 'week' | 'month' = 'week', limit = 10) {
  const interval = period === 'day' ? '1 day' : period === 'week' ? '7 days' : '30 days'
  const stmt = db.prepare(`
    SELECT id, code, user_name, total_odds, stake, potential_return, copies, created_at
    FROM public_accumulators
    WHERE created_at >= datetime('now', ?)
    ORDER BY copies DESC, total_odds DESC
    LIMIT ?
  `)
  return stmt.all(`-${interval}`, limit)
}

// Cleanup: delete slip pages older than 7 days (called on server startup)
export function cleanupExpiredAccas(): number {
  const stmt = db.prepare(`
    DELETE FROM public_accumulators
    WHERE created_at < datetime('now', '-7 days')
  `)
  return stmt.run().changes
}

export function copyAccumulator(code: string): boolean {
  const stmt = db.prepare(`
    UPDATE public_accumulators SET copies = copies + 1 WHERE code = ?
  `)
  const result = stmt.run(code)
  return result.changes > 0
}

export function generateAccaCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'ODD-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Expire slip pages older than 7 days on server startup
try {
  cleanupExpiredAccas()
} catch {
  // table may not exist on first boot before migrations run — ignore
}

export { db }