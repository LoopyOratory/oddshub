import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { searchAll } from '@/lib/search.functions'
import { Input } from '@/components/ui/input'

interface SearchResults {
  teams: { id: number; name: string; country_code?: string }[]
  matches: { id: number; home_team: string; away_team: string; event_date: string; league_name?: string }[]
  leagues: { id: number; name: string }[]
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchAll({ data: { query } })
        setResults(data)
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch {
        setResults(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results || !isOpen) return

    const allResults = [
      ...results.teams.map((t) => ({ type: 'team', id: t.id, label: t.name })),
      ...results.matches.map((m) => ({
        type: 'match',
        id: m.id,
        label: `${m.home_team} vs ${m.away_team}`,
      })),
      ...results.leagues.map((l) => ({ type: 'league', id: l.id, label: l.name })),
    ]

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const item = allResults[selectedIndex]
      if (item.type === 'team') navigate({ to: '/teams/$teamId', params: { teamId: String(item.id) } })
      else if (item.type === 'match') navigate({ to: '/matches/$eventId', params: { eventId: String(item.id) } })
      else if (item.type === 'league') navigate({ to: '/leagues/$leagueId', params: { leagueId: String(item.id) } })
      setIsOpen(false)
      setQuery('')
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const hasResults = results && (results.teams.length + results.matches.length + results.leagues.length > 0)

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search teams, matches, leagues..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-xl">
          {!hasResults ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.teams.length > 0 && (
                <div>
                  <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Teams</div>
                  {results.teams.map((team, i) => (
                    <Link
                      key={team.id}
                      to="/teams/$teamId"
                      params={{ teamId: String(team.id) }}
                      onClick={() => { setIsOpen(false); setQuery('') }}
                      className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 ${selectedIndex === i ? 'bg-white/5' : ''}`}
                    >
                      <span className="text-lg">⚽</span>
                      <span>{team.name}</span>
                      {team.country_code && (
                        <span className="text-xs text-muted-foreground">({team.country_code})</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {results.matches.length > 0 && (
                <div>
                  <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Matches</div>
                  {results.matches.map((match, i) => (
                    <Link
                      key={match.id}
                      to="/matches/$eventId"
                      params={{ eventId: String(match.id) }}
                      onClick={() => { setIsOpen(false); setQuery('') }}
                      className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 ${selectedIndex === results.teams.length + i ? 'bg-white/5' : ''}`}
                    >
                      <span className="text-lg">🏟️</span>
                      <div>
                        <span>{match.home_team} vs {match.away_team}</span>
                        {match.league_name && (
                          <span className="ml-2 text-xs text-muted-foreground">{match.league_name}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.leagues.length > 0 && (
                <div>
                  <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Leagues</div>
                  {results.leagues.map((league, i) => (
                    <Link
                      key={league.id}
                      to="/leagues/$leagueId"
                      params={{ leagueId: String(league.id) }}
                      onClick={() => { setIsOpen(false); setQuery('') }}
                      className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 ${selectedIndex === results.teams.length + results.matches.length + i ? 'bg-white/5' : ''}`}
                    >
                      <span className="text-lg">🏆</span>
                      <span>{league.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}