import { TopAccas } from '@/components/PublicAcca'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { SITE_DESCRIPTION } from '@/routes/__root'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LeagueGroup, MatchRow, type EventOddsMap } from '@/components/MatchRow'
import { liveEvents, listEvents, listLeagues, listPredictions, oddsFeed } from '@/lib/bsd.functions'
import { toParams } from '@/lib/bsd'
import { fmtTime } from '@/lib/format'
import { ScorelineHeatmap } from '@/components/SportsCharts'
import { TeamCreat } from '@/components/TeamCreat'
import type { EventSummary, League, OddsRow, Prediction } from '@/lib/bsd'

const liveQuery = queryOptions({
  queryKey: ['live'],
  queryFn: () => liveEvents({ data: {} }),
  staleTime: 5_000,
  refetchInterval: 10_000,
})

function fixturesQueries() {
  const date_from = new Date().toISOString().slice(0, 10)
  const fixturesQuery = queryOptions({
    queryKey: ['home-fixtures', date_from],
    queryFn: () =>
      listEvents({ data: toParams({ status: 'upcoming', date_from, limit: 60 }) }),
    staleTime: 30_000,
    refetchInterval: 120_000,
  })
  const dayOddsQuery = queryOptions({
    queryKey: ['home-day-odds', date_from],
    queryFn: () =>
      oddsFeed({
        data: toParams({ market: '1x2', date_from, date_to: date_from, limit: 200 }),
      }),
    staleTime: 30_000,
    refetchInterval: 120_000,
  })
  return { fixturesQuery, dayOddsQuery }
}

const leaguesQuery = queryOptions({
  queryKey: ['home-leagues'],
  queryFn: () => listLeagues({ data: { limit: 200 } }),
  staleTime: 60_000,
})

const featuredQuery = queryOptions({
  queryKey: ['home-featured'],
  queryFn: () => listPredictions({ data: { upcoming: true, limit: 20 } }),
  staleTime: 60_000,
  refetchInterval: 300_000,
})

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'OddsHub — Football Predictions Today, Live Odds & Tips' },
      {
        name: 'description',
        content:
          'Free football predictions with model confidence scores, best decimal odds across 80+ bookmakers, scoreline probabilities, xG analysis and an acca calculator.',
      },
      { property: 'og:title', content: 'OddsHub — Football Predictions Today & Live Odds' },
      { property: 'og:type', content: 'website' },
    ],
  }),
  loader: ({ context }) => {
    const queryClient = (context as { queryClient: QueryClient }).queryClient
    const { fixturesQuery, dayOddsQuery } = fixturesQueries()
    return Promise.all([
      queryClient.ensureQueryData(liveQuery),
      queryClient.ensureQueryData(fixturesQuery),
      queryClient.ensureQueryData(dayOddsQuery),
      queryClient.ensureQueryData(leaguesQuery),
      queryClient.ensureQueryData(featuredQuery),
    ])
  },
  component: Home,
})

function Home() {
  const { data: live } = useSuspenseQuery(liveQuery)
  const { fixturesQuery, dayOddsQuery } = fixturesQueries()
  const fixturesData = useSuspenseQuery(fixturesQuery).data
  const dayOddsData = useSuspenseQuery(dayOddsQuery).data
  const featuredData = useSuspenseQuery(featuredQuery).data
  const leaguesData = useSuspenseQuery(leaguesQuery).data
  const [updatedAt] = useState(() => new Date().toLocaleTimeString())

  const leagueNames = new Map<number, string>()
  for (const league of leaguesData.results as League[]) {
    leagueNames.set(league.id, league.name)
  }

  const liveMatches = live.events.filter((event) => event.status === 'live')
  const featured = pickFeatured(featuredData.results)

  const oddsMap: EventOddsMap = new Map()
  for (const row of dayOddsData.results as OddsRow[]) {
    const bucket = oddsMap.get(row.event_id) ?? {}
    const key = row.outcome.toLowerCase()
    if (key === 'home' || key === 'draw' || key === 'away') {
      const best = bucket[key] ?? 0
      if ((row.decimal_odds ?? 0) > best) bucket[key] = row.decimal_odds ?? undefined
      oddsMap.set(row.event_id, bucket)
    }
  }

  const grouped = new Map<string, EventSummary[]>()
  for (const event of fixturesData.results) {
    const key = leagueNames.get(event.league_id) ?? event.league_name ?? `League ${event.league_id}`
    const bucket = grouped.get(key) ?? []
    bucket.push(event)
    grouped.set(key, bucket)
  }

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'OddsHub',
            url: 'https://oddshub.example.com',
            description: SITE_DESCRIPTION,
            publisher: { '@type': 'Organization', name: 'OddsHub' },
          }),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-emerald-500/[0.08] to-transparent px-6 py-14 text-center">
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Football Predictions,{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Live Odds
          </span>{' '}
          &amp; Model Analysis
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Daily football tips powered by a CatBoost model — scoreline probabilities, expected
          goals, corner markets and best prices compared across 80+ bookmakers.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/predictions"
            search={{}}
            className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
          >
            All predictions
          </Link>
          <Link
            to="/acca"
            className="rounded-full bg-white/5 px-6 py-2.5 text-sm font-medium text-foreground ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10"
          >
            Acca calculator
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Data refreshed {updatedAt} · Nigeria Premier League covered
        </p>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Leagues covered" value="79" />
        <Stat label="Bookmakers compared" value="81" />
        <Stat label="Model predictions" value={String(featuredData.count)} />
        <Stat label="Live matches now" value={String(liveMatches.length)} />
      </section>

      {/* Live strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Live now</h2>
          <Link to="/matches" search={{ status: 'live' }} className="text-sm text-primary">
            All live →
          </Link>
        </div>
        {liveMatches.length ? (
          <LiveStrip events={liveMatches} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No live matches right now — browse{' '}
            <Link to="/matches" search={{}} className="text-primary">
              today's fixtures
            </Link>
            .
          </p>
        )}
      </section>

      {/* Featured prediction */}
      {featured && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Featured prediction</h2>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-base">
                  <Link
                    to="/teams/$teamId"
                    params={{ teamId: String(featured.event.home_team_id) }}
                    className="inline-flex items-center gap-1.5 hover:text-emerald-300"
                  >
                    <TeamCreat teamId={featured.event.home_team_id} name={featured.event.home_team} size="sm" link={false} />
                    {featured.event.home_team}
                  </Link>{' '}
                  vs{' '}
                  <Link
                    to="/teams/$teamId"
                    params={{ teamId: String(featured.event.away_team_id) }}
                    className="inline-flex items-center gap-1.5 hover:text-emerald-300"
                  >
                    {featured.event.away_team}
                    <TeamCreat teamId={featured.event.away_team_id} name={featured.event.away_team} size="sm" link={false} />
                  </Link>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {featured.event.league_name} · {fmtTime(featured.event.event_date)}
                </p>
              </div>
              <Link
                to="/matches/$eventId"
                params={{ eventId: String(featured.event.id) }}
                className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/25 transition-colors hover:bg-emerald-500/25"
              >
                Full analysis →
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <FeaturedPick featured={featured} />
              {featured.markets.expected_goals && (
                <ScorelineHeatmap
                  homeXg={featured.markets.expected_goals.home ?? 1.2}
                  awayXg={featured.markets.expected_goals.away ?? 1.2}
                />
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Today's fixtures */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Today's fixtures</h2>
            <p className="text-sm text-muted-foreground">
              League-grouped, with each match's best 1X2 prices
            </p>
          </div>
          <Link to="/matches" search={{}} className="text-sm text-primary">
            All fixtures →
          </Link>
        </div>
        {[...grouped.entries()].map(([league, matches]) => (
          <LeagueGroup key={league} title={`${league} · ${matches.length}`}>
            {matches.slice(0, 6).map((event) => (
              <MatchRow key={event.id} event={event} odds={oddsMap} />
            ))}
          </LeagueGroup>
        ))}
        {!fixturesData.results.length && (
          <p className="text-sm text-muted-foreground">No fixtures scheduled for today.</p>
        )}
      </section>

      {/* Top public accas */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Community Accumulators</h2>
        <TopAccas period="week" />
      </section>

      {/* Explore */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ExploreCard
          title="Predictions"
          description="Match winner, over/under, BTTS and corner probabilities for upcoming games."
          href="/predictions"
        />
        <ExploreCard
          title="Odds comparison"
          description="Bookmaker-by-bookmaker price comparison with movement and payout."
          href="/matches"
        />
        <ExploreCard
          title="Fixtures & results"
          description="Live scores, lineups, shot maps, xG and head-to-heads."
          href="/matches"
        />
        <ExploreCard
          title="Acca calculator"
          description="Combine selections, handle voids and see returns instantly."
          href="/acca"
        />
      </section>
    </div>
  )
}

function FeaturedPick({ featured }: { featured: Prediction }) {
  const m = featured.markets
  const result = m.match_result
  const predicted = result?.predicted?.toLowerCase()
  const pickLabel =
    predicted === 'h'
      ? featured.event.home_team
      : predicted === 'a'
        ? featured.event.away_team
        : predicted === 'd'
          ? 'Draw'
          : result?.predicted ?? '—'

  const chips: [string, number | undefined][] = [
    ['Over 2.5', m.over_under?.prob_over_25],
    ['BTTS', m.btts?.prob_yes],
    ['Corners 8.5+', m.corners?.prob_over_85],
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        {result && (
          <p className="text-lg">
            Model pick:{' '}
            <span className="font-bold text-emerald-300">{pickLabel}</span>
            <span className="ml-2 text-sm text-muted-foreground">
              ({featured.event.home_team} {d(result.prob_home)}% · Draw {d(result.prob_draw)}% ·{' '}
              {featured.event.away_team} {d(result.prob_away)}%)
            </span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Model confidence{' '}
          <span className="font-semibold text-foreground">
            {(featured.model.confidence * 100).toFixed(0)}%
          </span>
          {m.score?.most_likely && (
            <>
              {' '}
              · most likely scoreline{' '}
              <span className="font-semibold text-foreground">{m.score.most_likely}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map(
          ([label, value]) =>
            value != null && (
              <Badge key={label} variant="outline" className="tabular-nums">
                {label} {value.toFixed(0)}%
              </Badge>
            ),
        )}
      </div>
    </div>
  )
}

function pickFeatured(predictions: Prediction[]): Prediction | undefined {
  return predictions
    .filter((prediction) => prediction.markets.expected_goals?.home != null)
    .sort((a, b) => b.model.confidence - a.model.confidence)[0]
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="font-heading text-2xl font-bold text-emerald-300">{value}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

function ExploreCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: '/predictions' | '/matches' | '/acca'
}) {
  return (
    <Link
      to={href}
      search={{}}
      className="group rounded-xl border border-white/5 bg-card/60 p-4 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
    >
      <h3 className="font-heading text-sm font-semibold group-hover:text-emerald-300">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  )
}

function LiveStrip({ events }: { events: EventSummary[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {events.slice(0, 12).map((event) => (
        <Link
          key={event.id}
          to="/matches/$eventId"
          params={{ eventId: String(event.id) }}
          className="flex min-w-44 flex-col gap-2 rounded-xl border border-white/5 bg-card/80 p-3 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-muted-foreground">{event.league_name}</span>
            <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 font-mono text-red-400">
              {event.current_minute ?? 'LIVE'}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{event.home_team}</span>
              <span className="font-mono text-base font-bold tabular-nums">
                {event.home_score ?? '-'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{event.away_team}</span>
              <span className="font-mono text-base font-bold tabular-nums">
                {event.away_score ?? '-'}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function d(prob: number | null | undefined): string {
  return (prob ?? 0).toFixed(0)
}