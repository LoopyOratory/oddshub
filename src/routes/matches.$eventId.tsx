import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { eventBroadcasts,
  eventDetail,
  eventH2h,
  eventIncidents,
  eventLineups,
  eventOdds,
  eventOddsComparison,
  eventPolymarket,
  eventPrediction,
  eventSocial,
  eventStats,
} from '@/lib/bsd.functions'
import type {
  ComparisonResponse,
  H2H,
  Incident,
  MatchLineup,
  PolymarketResponse,
  Prediction,
} from '@/lib/bsd'
import { fmtDateTime, fmtOdds, fmtTime } from '@/lib/format'
import { ScorelineHeatmap, StatRadar, XgFlowChart } from '@/components/SportsCharts'
import { ShotPitch } from '@/components/ShotPitch'
import { TeamCreat } from '@/components/TeamCreat'

export const Route = createFileRoute('/matches/$eventId')({
  loader: async ({ params }) => {
    const id = Number(params.eventId)
    const [detail, odds, prediction, h2h, stats, lineups, incidents, broadcasts, social] =
      await Promise.all([
        eventDetail({ data: { id } }),
        eventOdds({ data: { id } }),
        eventPrediction({ data: { id } }).catch(() => null),
        eventH2h({ data: { id } }).catch(() => null),
        eventStats({ data: { id } }).catch(() => null),
        eventLineups({ data: { id } }).catch(() => null),
        eventIncidents({ data: { id } }).catch(() => null),
        eventBroadcasts({ data: { id, limit: 20 } }).catch(() => null),
        eventSocial({ data: { id, limit: 20 } }).catch(() => null),
      ])
    const polymarket = await eventPolymarket({ data: { id } }).catch(() => null)
    const comparison = await eventOddsComparison({ data: { id } }).catch(() => null)
    return { detail, odds, prediction, h2h, stats, lineups, incidents, broadcasts, social, polymarket, comparison }
  },
  component: MatchPage,
})

function MatchPage() {
  const { detail, odds, prediction, h2h, stats, lineups, incidents, broadcasts, social, polymarket, comparison } =
    Route.useLoaderData()
  const [tab, setTab] = useState('overview')

  const eventLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${detail.home_team} vs ${detail.away_team}`,
    startDate: detail.event_date,
    eventStatus: detail.status === 'finished' ? 'https://schema.org/EventScheduled' : undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'SportsEvent', name: detail.league_name ?? '' },
    homeTeam: { '@type': 'SportsTeam', name: detail.home_team },
    awayTeam: { '@type': 'SportsTeam', name: detail.away_team },
    url: `https://oddshub.example.com/matches/${detail.id}`,
  }

  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{detail.league_name}</span>
          <span>•</span>
          <span>{fmtDateTime(detail.event_date)}</span>
          {detail.round_name && (
            <>
              <span>•</span>
              <span>Round {detail.round_number}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/teams/$teamId"
            params={{ teamId: String(detail.home_team_id) }}
            className="flex items-center gap-2 text-2xl font-bold hover:text-emerald-300"
          >
            <TeamCreat teamId={detail.home_team_id} name={detail.home_team} />
            {detail.home_team}
          </Link>
          <div className="text-center">
            <div className="font-mono text-3xl font-bold tabular-nums">
              {detail.home_score ?? '-'} : {detail.away_score ?? '-'}
            </div>
            <div className="text-xs uppercase text-muted-foreground">{detail.status}</div>
          </div>
          <Link
            to="/teams/$teamId"
            params={{ teamId: String(detail.away_team_id) }}
            className="flex items-center gap-2 text-2xl font-bold hover:text-emerald-300"
          >
            {detail.away_team}
            <TeamCreat teamId={detail.away_team_id} name={detail.away_team} />
          </Link>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="lineups">Lineups</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="h2h">H2H</TabsTrigger>
          <TabsTrigger value="odds">Odds</TabsTrigger>
          <TabsTrigger value="prediction">Prediction</TabsTrigger>
          <TabsTrigger value="polymarket">Polymarket</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DetailGrid />
          {stats && <StatsTable stats={stats} />}
        </TabsContent>

        <TabsContent value="stats">
          {stats ? (
            <div className="space-y-4">
              <StatsCharts stats={stats} homeLabel={detail.home_team} awayLabel={detail.away_team} />
              <StatsTable stats={stats} />
            </div>
          ) : (
            <Empty label="No stats available." />
          )}
        </TabsContent>

        <TabsContent value="lineups">
          {lineups ? <LineupsView lineups={lineups} /> : <Empty label="No lineups yet." />}
        </TabsContent>

        <TabsContent value="incidents">
          {incidents ? <IncidentsView incidents={incidents.results as unknown as Incident[]} /> : <Empty label="No incidents." />}
        </TabsContent>

        <TabsContent value="h2h">
          {h2h ? <H2hView h2h={h2h} /> : <Empty label="No head-to-head data." />}
        </TabsContent>

        <TabsContent value="odds">
          <div className="space-y-4">
            <ComparisonGrid comparison={comparison} />
            <ConsensusOddsView odds={odds?.odds} />
          </div>
        </TabsContent>

        <TabsContent value="prediction">
          {prediction ? <PredictionView prediction={prediction} /> : <Empty label="No model prediction." />}
        </TabsContent>

        <TabsContent value="polymarket">
          {polymarket ? <PolymarketView pm={polymarket} /> : <Empty label="No active Polymarket market (404 or not open)." />}
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">Broadcasts</h3>
            {broadcasts?.results.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {broadcasts.results.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span>{b.channel_name ?? String(b.channel_id)}</span>
                    <Badge variant="outline">{b.country_code}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No broadcast data.</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Social</h3>
            {social?.results.length ? (
              <div className="space-y-2">
                {social.results.map((post) => (
                  <div key={post.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{post.author ?? '—'}</span>
                      <span className="text-xs text-muted-foreground">{post.type}</span>
                    </div>
                    {post.text && <p className="mt-1 line-clamp-3">{post.text}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No social posts.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  function DetailGrid() {
    const rows: [string, string][] = [
      ['League', detail.league_name ?? '—'],
      ['Season', String(detail.season_id ?? '—')],
      ['Round', detail.round_name || String(detail.round_number ?? '—')],
      ['Status', detail.status],
      ['Kickoff', fmtDateTime(detail.event_date)],
      ['Attendance', detail.attendance != null ? String(detail.attendance) : '—'],
      ['Pitch', detail.pitch_condition ?? '—'],
      ['Weather', detail.weather?.description ?? '—'],
      ['Referee', String(detail.referee_id ?? '—')],
      ['Home coach', String(detail.home_coach_id ?? '—')],
      ['Away coach', String(detail.away_coach_id ?? '—')],
      ['Venue', String(detail.venue_id ?? '—')],
      ['Travel (home→away)', detail.travel_distance_km != null ? `${detail.travel_distance_km} km` : '—'],
      ['Flags', [detail.is_local_derby && 'derby', detail.is_neutral_ground && 'neutral'].filter(Boolean).join(', ') || '—'],
      ['xG available', detail.has_xg ? 'yes' : 'no'],
    ]
    return (
      <Card>
        <CardContent className="grid gap-x-8 gap-y-1 p-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b py-1.5 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }
}

function numericStats(side: Record<string, unknown>): Record<string, number> {
  const wanted = new Set([
    'possession',
    'shots_total',
    'shots_on_target',
    'corners',
    'fouls',
    'xg',
    'yellow_cards',
    'red_cards',
    'offsides',
    'passes',
    'duels',
    'tackles',
  ])
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(side)) {
    if (!wanted.has(key)) continue
    if (typeof value === 'number') out[key] = value
    else if (value && typeof value === 'object' && typeof (value as { value?: unknown }).value === 'number') {
      out[key] = (value as { value: number }).value
    }
  }
  return out
}

function StatsCharts({
  stats,
  homeLabel,
  awayLabel,
}: {
  stats: Record<string, unknown>
  homeLabel: string
  awayLabel: string
}) {
  const statsData = stats.stats as Record<string, unknown> | undefined
  const homeRaw = (statsData?.home ?? {}) as Record<string, unknown>
  const awayRaw = (statsData?.away ?? {}) as Record<string, unknown>
  const home = numericStats(homeRaw)
  const away = numericStats(awayRaw)
  const xgPoints = (stats.xg_per_minute as { m: number; cum_home: number; cum_away: number }[] | undefined) ?? []
  const shots = (stats.shotmap as {
    gm: { x: number; y: number }
    pos?: { x: number; y: number }
    xg: number
    min: number
    type: string
    home: boolean
    body?: string
    added?: number
    player_id?: number
  }[] | undefined) ?? []

  return (
    <>
      {Object.keys(home).length > 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Team comparison ({homeLabel} vs {awayLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <StatRadar home={home} away={away} homeLabel={homeLabel} awayLabel={awayLabel} />
          </CardContent>
        </Card>
      )}
      {xgPoints.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cumulative xG flow</CardTitle>
          </CardHeader>
          <CardContent>
            <XgFlowChart points={xgPoints.map((p) => ({ minute: p.m, home: p.cum_home, away: p.cum_away }))} />
          </CardContent>
        </Card>
      )}
      {shots.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shot map ({shots.length} shots)</CardTitle>
          </CardHeader>
          <CardContent>
            <ShotPitch shots={shots} />
          </CardContent>
        </Card>
      )}
    </>
  )
}

function StatsTable({ stats }: { stats: Record<string, unknown> }) {
  const statsData = stats.stats as Record<string, unknown> | undefined
  const home = (statsData?.home ?? {}) as Record<string, unknown>
  const away = (statsData?.away ?? {}) as Record<string, unknown>
  if (!Object.keys(home).length || !Object.keys(away).length) return <JsonView data={stats} />

  const keys = new Set([...Object.keys(home), ...Object.keys(away)])
  const seen = new Set(['possession', 'shots_total', 'shots_on_target', 'corners', 'xg', 'fouls', 'yellow_cards', 'red_cards', 'offsides'])

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stat</TableHead>
                <TableHead className="text-right">Home</TableHead>
                <TableHead className="text-right">Away</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...keys]
                .filter((key) => seen.has(key) || !['first_half', 'second_half'].includes(key))
                .slice(0, 30)
                .map((key) => (
                  <TableRow key={key}>
                    <TableCell>{key.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtStat(home[key])}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtStat(away[key])}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function fmtStat(value: unknown): string {
  if (typeof value === 'number') return value.toFixed(value % 1 ? 2 : 0)
  return String(value ?? '—')
}

function LineupsView({ lineups }: { lineups: MatchLineup }) {
  const bench = (lineups as unknown as { substitutes?: unknown[] }).substitutes
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SquadSide side={lineups.home} title="Home" />
      <SquadSide side={lineups.away} title="Away" />
      {bench ? (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bench (predicted/confirmed)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <JsonView data={bench} compact />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function SquadSide({ side, title }: { side: MatchLineup['home']; title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {title} <span className="ml-1 text-xs font-normal text-muted-foreground">{side.formation ?? ''}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {side.players.map((player) => (
          <div key={player.player_id} className="flex justify-between">
            <span>
              {player.player_name}
              {player.captain ? ' (C)' : ''}
            </span>
            <span className="text-muted-foreground">
              {player.position}
              {player.ai_score != null ? ` · AI ${(player.ai_score * 100).toFixed(0)}%` : ''}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function IncidentsView({ incidents }: { incidents: Incident[] }) {
  return (
    <Card>
      <CardContent className="divide-y p-0">
        {incidents.map((incident) => (
          <div key={incident.id ?? `${incident.minute}-${incident.player_id}`} className="flex items-center gap-3 px-4 py-2 text-sm">
            <span className="w-10 font-mono text-muted-foreground">{incident.minute}'</span>
            <Badge variant="outline">{incident.type}</Badge>
            <span>{incident.player_name ?? '—'}</span>
            {incident.rescinded && <Badge className="bg-amber-500/15 text-amber-500">rescinded</Badge>}
            {incident.score_home != null && (
              <span className="ml-auto font-mono tabular-nums text-muted-foreground">
                {incident.score_home}-{incident.score_away}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function H2hView({ h2h }: { h2h: H2H }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Home wins" value={h2h.home_wins ?? 0} />
        <Stat label="Draws" value={h2h.draws ?? 0} />
        <Stat label="Away wins" value={h2h.away_wins ?? 0} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(h2h.meetings ?? []).map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="text-muted-foreground">{fmtTime(meeting.event_date)}</TableCell>
                  <TableCell>
                    {meeting.home_team} vs {meeting.away_team}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {meeting.home_score != null ? `${meeting.home_score}-${meeting.away_score}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

// Consensus odds (per-event /odds/ returns {event_id, odds: {home_win, draw, ...}}).
function ConsensusOddsView({ odds }: { odds: Record<string, number | null> | null | undefined }) {
  const map = odds ?? {}

  const markets: Record<string, [string, string][]> = {
    '1X2': [
      ['home_win', 'Home'],
      ['draw', 'Draw'],
      ['away_win', 'Away'],
    ],
    'Over / Under': [
      ['over_15_goals', 'Over 1.5'],
      ['under_15_goals', 'Under 1.5'],
      ['over_25_goals', 'Over 2.5'],
      ['under_25_goals', 'Under 2.5'],
      ['over_35_goals', 'Over 3.5'],
      ['under_35_goals', 'Under 3.5'],
    ],
    'Both teams to score': [
      ['btts_yes', 'Yes'],
      ['btts_no', 'No'],
    ],
  }

  const extraKeys = Object.keys(map).filter(
    (key) => !Object.values(markets).flat().some(([k]) => k === key),
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(markets).map(([market, rows]) => (
        <Card key={market}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{market}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {rows.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
                <span>{label}</span>
                <span className="font-mono font-semibold tabular-nums">
                  {fmtOdds(map[key] ?? null)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {extraKeys.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Other markets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {extraKeys.map((key) => (
              <div key={key} className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono font-semibold tabular-nums">{fmtOdds(map[key] ?? null)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const marketLabels: Record<string, string> = {
  '1x2': 'Match winner',
  over_under_15: 'Over/Under 1.5',
  over_under_25: 'Over/Under 2.5',
  over_under_35: 'Over/Under 3.5',
  btts: 'Both teams to score',
  double_chance: 'Double chance',
  draw_no_bet: 'Draw no bet',
  total_corners: 'Total corners',
  total_red_cards: 'Total red cards',
}

// OddsPortal-style comparison grid straight from /odds/comparison/: one row per
// bookmaker, one column per outcome, best price per column highlighted, movement
// arrows, payout (= 1/overround) footnote.
function ComparisonGrid({ comparison }: { comparison: ComparisonResponse | null }) {
  const [market, setMarket] = useState('1x2')
  if (!comparison) return null

  const markets = Object.keys(comparison.markets)
  const activeMarket = markets.includes(market) ? market : (markets[0] ?? '1x2')
  const outcomes = Object.values(comparison.markets[activeMarket] ?? {})
  const bookmakers = [
    ...new Set(outcomes.flatMap((outcome) => Object.keys(outcome.bookmakers))),
  ]
  const payout =
    outcomes.length > 1
      ? (1 / outcomes.reduce((sum, outcome) => sum + 1 / outcome.best_odds, 0)) * 100
      : null

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">
          Bookmaker comparison · {comparison.bookmakers_count} books / {comparison.total_odds} prices
        </CardTitle>
        <Select value={activeMarket} onValueChange={(value) => value && setMarket(value)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {markets.map((m) => (
              <SelectItem key={m} value={m}>
                {marketLabels[m] ?? m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card">Bookmaker</TableHead>
              {outcomes.map((outcome) => (
                <TableHead key={outcome.outcome} className="text-right">
                  {outcome.outcome_name}
                  {outcome.line != null && (
                    <span className="ml-1 text-xs text-muted-foreground">{outcome.line}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookmakers.map((slug) => (
              <TableRow key={slug}>
                <TableCell className="sticky left-0 bg-card font-medium">{slug}</TableCell>
                {outcomes.map((outcome) => {
                  const cell = outcome.bookmakers[slug]
                  const isBest = outcome.best_bookmaker_slug === slug
                  return (
                    <TableCell
                      key={outcome.outcome}
                      className={`text-right font-mono tabular-nums ${
                        isBest ? 'bg-emerald-500/10 text-emerald-300' : ''
                      }`}
                    >
                      {cell ? cell.decimal_odds.toFixed(2) : '—'}
                      {cell && (
                        <span className="ml-1 text-[10px]">
                          {cell.movement === 'SHORTENING' && <span className="text-red-400">▲</span>}
                          {cell.movement === 'DRIFTING' && <span className="text-emerald-400">▼</span>}
                        </span>
                      )}
                      {isBest && <span className="ml-1 text-[9px] uppercase text-emerald-500">best</span>}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {payout != null && (
          <p className="border-t border-white/5 px-4 py-2 text-xs text-muted-foreground">
            Highest payout:{' '}
            <span className="font-semibold text-emerald-300">{payout.toFixed(1)}%</span> ·{' '}
            {outcomes.map((o) => `${o.outcome_name} best ${o.best_bookmaker_name}`).join(' · ')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function PredictionView({ prediction }: { prediction: Prediction }) {
  const m = prediction.markets

  return (
    <div className="space-y-4">
      {m.expected_goals && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Scoreline probability heatmap (Poisson) — most likely{' '}
              <span className="font-mono">{m.score?.most_likely ?? '—'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScorelineHeatmap homeXg={m.expected_goals.home ?? 1.2} awayXg={m.expected_goals.away ?? 1.2} />
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
      {m.match_result && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Match result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ProbabilityRow label={`Home — ${prediction.event.home_team}`} value={m.match_result.prob_home} />
            <ProbabilityRow label="Draw" value={m.match_result.prob_draw} />
            <ProbabilityRow label={`Away — ${prediction.event.away_team}`} value={m.match_result.prob_away} />
            <p className="pt-1 text-xs text-muted-foreground">
              Model pick: <span className="font-semibold text-foreground uppercase">{m.match_result.predicted}</span>
              {' · '}confidence {(prediction.model.confidence * 100).toFixed(0)}% · v{prediction.model.version}
            </p>
          </CardContent>
        </Card>
      )}
      {m.expected_goals && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expected goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ProbabilityRow label={prediction.event.home_team} value={m.expected_goals.home} />
            <ProbabilityRow label={prediction.event.away_team} value={m.expected_goals.away} />
            {m.score?.most_likely && (
              <p className="pt-1 text-xs text-muted-foreground">
                Most likely scoreline: <span className="font-semibold text-foreground">{m.score.most_likely}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Over/Under + BTTS + corners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {m.over_under && (
            <>
              <ProbabilityRow label="Over 1.5" value={m.over_under.prob_over_15} />
              <ProbabilityRow label="Over 2.5" value={m.over_under.prob_over_25} />
              <ProbabilityRow label="Over 3.5" value={m.over_under.prob_over_35} />
            </>
          )}
          {m.btts && <ProbabilityRow label="BTTS yes" value={m.btts.prob_yes} />}
          {m.corners && (
            <>
              <ProbabilityRow label="Corners over 8.5" value={m.corners.prob_over_85} />
              <ProbabilityRow label="Corners over 9.5" value={m.corners.prob_over_95} />
              <ProbabilityRow label="Corners over 10.5" value={m.corners.prob_over_105} />
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <JsonView data={prediction.recommendations} compact />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

function ProbabilityRow({ label, value }: { label: string; value: number | undefined }) {
  if (value == null) return null
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 truncate text-sm">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="w-12 text-right text-sm font-semibold tabular-nums">{value.toFixed(0)}%</span>
    </div>
  )
}

function PolymarketView({ pm }: { pm: PolymarketResponse }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Implied probabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(pm.markets).map(([market, outcomes]) => (
              <div key={market}>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{market}</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(outcomes).map(([outcome, p]) => (
                    <span key={outcome} className="text-sm">
                      {outcome}: <span className="font-semibold tabular-nums">{(p * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Market depth</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <JsonView data={pm} compact />
        </CardContent>
      </Card>
    </div>
  )
}

function JsonView({ data, compact = false }: { data: unknown; compact?: boolean }) {
  const text = JSON.stringify(data, null, compact ? 0 : 2)
  return <pre className={`overflow-x-auto text-xs ${compact ? '' : 'p-3'}`}>{text}</pre>
}

function Empty({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{label}</p>
}