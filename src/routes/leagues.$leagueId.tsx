import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { leagueCurrentSeason, leagueDetail, leagueStandings, leagueTop } from '@/lib/bsd.functions'
import type { StandingRow } from '@/lib/bsd'
import { PlayerLink, TeamCreat } from '@/components/TeamCreat'

export const Route = createFileRoute('/leagues/$leagueId')({
  loader: async ({ params }) => {
    const id = Number(params.leagueId)
    const [league, season] = await Promise.all([leagueDetail({ data: { id } }), leagueCurrentSeason({ data: { id } })])
    const [standings, scorers, assists] = await Promise.all([
      leagueStandings({ data: { id, season_id: season.id } }),
      leagueTop({ data: { id, stat: 'scorers', season_id: season.id, limit: 10 } }),
      leagueTop({ data: { id, stat: 'assists', season_id: season.id, limit: 10 } }),
    ])
    return { league, season, standings, scorers, assists }
  },
  component: LeaguePage,
})

function LeaguePage() {
  const { league, season, standings, scorers, assists } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{league.name}</h1>
          <p className="text-sm text-muted-foreground">
            {league.country} • {season.name}
          </p>
        </div>
        <Link to="/matches" search={{}} className="text-sm text-primary">
          Matches →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Standings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {standings.standings?.length ? (
              <StandingsTable rows={standings.standings} />
            ) : (
              <p className="p-4 text-sm text-muted-foreground">No standings data.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top scorers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scorers?.leaders?.map((row) => (
                <LeaderRow key={String(row.player_id)} row={row} />
              )) ?? null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top assists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assists?.leaders?.map((row) => (
                <LeaderRow key={String(row.player_id)} row={row} />
              )) ?? null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StandingsTable({ rows, title }: { rows: StandingRow[]; title?: string }) {
  return (
    <div>
      {title && <h3 className="px-4 pt-4 font-semibold">{title}</h3>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">P</TableHead>
            <TableHead className="text-right">W</TableHead>
            <TableHead className="text-right">D</TableHead>
            <TableHead className="text-right">L</TableHead>
            <TableHead className="text-right">GD</TableHead>
            <TableHead className="text-right">Pts</TableHead>
            <TableHead className="text-right hidden md:table-cell">Form</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.team_id}>
              <TableCell className="text-muted-foreground">{row.position}</TableCell>
              <TableCell className="font-medium">
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: String(row.team_id) }}
                  className="inline-flex items-center gap-2 hover:text-emerald-300"
                >
                  <TeamCreat teamId={row.team_id} name={row.team_name} size="sm" />
                  {row.team_name}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.played}</TableCell>
              <TableCell className="text-right tabular-nums">{row.won}</TableCell>
              <TableCell className="text-right tabular-nums">{row.drawn}</TableCell>
              <TableCell className="text-right tabular-nums">{row.lost}</TableCell>
              <TableCell className="text-right tabular-nums">{row.gd}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{row.pts}</TableCell>
              <TableCell className="text-right hidden md:table-cell">
                <span className="inline-flex gap-0.5" title={row.form}>
                  {formChips(row.form)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function LeaderRow({ row }: { row: Record<string, unknown> }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <PlayerLink
        playerId={Number(row.player_id)}
        name={String(row.player_name)}
        position={`#${Number(row.rank)}`}
      />
      <span className="ml-2 shrink-0 text-xs text-muted-foreground">({String(row.team_name)})</span>
      <Badge variant="outline" className="tabular-nums">
        {Number(row.value)}
      </Badge>
    </div>
  )
}

const formColors: Record<string, string> = {
  W: 'bg-emerald-500/80',
  D: 'bg-slate-500/60',
  L: 'bg-red-500/80',
}

function formChips(form: string | undefined): React.ReactNode[] {
  if (!form) return [<span key="none" className="text-xs text-muted-foreground">—</span>]
  return form.split('').map((result, i) => (
    <span
      key={i}
      className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] text-[8px] font-bold text-white ${formColors[result] ?? 'bg-slate-500/60'}`}
    >
      {result}
    </span>
  ))
}