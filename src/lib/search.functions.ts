import { createServerFn } from '@tanstack/react-start'
import { bsdGet } from '@/lib/bsd.server'

interface SearchResult {
  teams: { id: number; name: string; country_code?: string }[]
  matches: { id: number; home_team: string; away_team: string; event_date: string; league_name?: string }[]
  leagues: { id: number; name: string }[]
}

export const searchAll = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }) => {
    const q = data.query.trim()
    if (q.length < 2) return { teams: [], matches: [], leagues: [] }

    const results: SearchResult = { teams: [], matches: [], leagues: [] }

    try {
      // Search teams
      const teamsRes = await bsdGet<{ results: { id: number; name: string; country_code?: string }[] }>(
        '/teams/',
        { name: q, limit: 5 }
      )
      results.teams = teamsRes.results ?? []
    } catch { /* ignore */ }

    try {
      // Search leagues
      const leaguesRes = await bsdGet<{ results: { id: number; name: string }[] }>(
        '/leagues/',
        { name: q, limit: 3 }
      )
      results.leagues = leaguesRes.results ?? []
    } catch { /* ignore */ }

    try {
      // Search matches (upcoming)
      const matchesRes = await bsdGet<{
        results: { id: number; home_team: string; away_team: string; event_date: string; league_name?: string }[]
      }>('/events/', { status: 'upcoming', limit: 20 })

      const query = q.toLowerCase()
      results.matches = (matchesRes.results ?? []).filter(
        (e) =>
          e.home_team.toLowerCase().includes(query) ||
          e.away_team.toLowerCase().includes(query),
      ).slice(0, 5)
    } catch { /* ignore */ }

    return results
  })