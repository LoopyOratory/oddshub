import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeagueGroup, MatchRow, type EventOddsMap } from '@/components/MatchRow'
import { listEvents, oddsFeed } from '@/lib/bsd.functions'
import { toParams } from '@/lib/bsd'
import type { OddsRow } from '@/lib/bsd'

const statuses = ['upcoming', 'live', 'finished', 'cancelled', 'postponed'] as const
type Status = (typeof statuses)[number]

interface MatchSearch {
  status?: Status
  league_id?: number
  date_from?: string
}

function makeQueries(search: MatchSearch) {
  const status = search.status ?? 'upcoming'
  const date_from = search.date_from ?? today()

  const eventsQuery = queryOptions({
    queryKey: ['events', status, search.league_id ?? null, date_from],
    queryFn: () =>
      listEvents({
        data: toParams({ status, league_id: search.league_id, date_from, limit: 100 }),
      }),
    staleTime: 15_000,
    refetchInterval: status === 'live' ? 15_000 : 60_000,
  })

  const oddsQuery = queryOptions({
    queryKey: ['day-odds', date_from, status],
    queryFn: () =>
      oddsFeed({
        data: toParams({ market: '1x2', date_from, date_to: addDays(date_from, 1), limit: 200 }),
      }),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: status !== 'finished',
  })

  return { status, date_from, eventsQuery, oddsQuery }
}

export const Route = createFileRoute('/matches/')({
  head: () => ({ meta: [{ title: 'Matches & fixtures | OddsHub' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.status === 'string' && (statuses as readonly string[]).includes(search.status)
      ? { status: search.status as Status }
      : {}),
    ...(typeof search.league_id === 'string' ? { league_id: Number(search.league_id) } : {}),
    ...(typeof search.date_from === 'string' ? { date_from: search.date_from } : {}),
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    const queryClient = (context as { queryClient: { ensureQueryData: (q: object) => Promise<unknown> } }).queryClient
    const { eventsQuery, oddsQuery } = makeQueries(deps.search)
    return Promise.all([queryClient.ensureQueryData(eventsQuery), queryClient.ensureQueryData(oddsQuery)])
  },
  component: Matches,
})

function Matches() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { status, date_from, eventsQuery, oddsQuery } = makeQueries(search)

  const eventsData = useSuspenseQuery(eventsQuery).data
  const oddsData = useSuspenseQuery(oddsQuery).data

  const oddsMap: EventOddsMap = new Map()
  for (const row of oddsData.results as OddsRow[]) {
    const bucket = oddsMap.get(row.event_id) ?? {}
    const key = row.outcome.toLowerCase()
    if (key === 'home' || key === 'draw' || key === 'away') {
      const best = bucket[key] ?? 0
      if ((row.decimal_odds ?? 0) > best) bucket[key] = row.decimal_odds ?? undefined
      oddsMap.set(row.event_id, bucket)
    }
  }

  const grouped = new Map<string, typeof eventsData.results>()
  for (const event of eventsData.results) {
    const key = event.league_name ?? 'Other'
    const bucket = grouped.get(key) ?? []
    bucket.push(event)
    grouped.set(key, bucket)
  }

  function onStatusChange(value: string) {
    navigate({ search: (prev) => ({ ...prev, status: value as Status }) })
  }

  function onDateFrom(e: FormEvent<HTMLInputElement>) {
    navigate({ search: (prev) => ({ ...prev, date_from: e.currentTarget.value }) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Matches</h1>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(value) => value && onStatusChange(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={date_from} onChange={onDateFrom} className="w-40" />
          {search.league_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ search: (prev) => ({ ...prev, league_id: undefined }) })}
            >
              Clear league filter
            </Button>
          )}
        </div>
      </div>

      {[...grouped.entries()].map(([league, matches]) => (
        <LeagueGroup key={league} title={`${league} · ${matches.length}`}>
          {matches.map((event) => (
            <MatchRow key={event.id} event={event} odds={oddsMap} />
          ))}
        </LeagueGroup>
      ))}
      {!eventsData.results.length && (
        <p className="text-sm text-muted-foreground">No matches for these filters.</p>
      )}
    </div>
  )
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}