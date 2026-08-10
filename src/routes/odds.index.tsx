import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { bookmakers, oddsBest, oddsFeed } from '@/lib/bsd.functions'
import { toParams } from '@/lib/bsd'
import { fmtOdds, fmtPct, fmtTime } from '@/lib/format'
import { BookmakerOddsChart } from '@/components/SportsCharts'

const markets = [
  '1x2',
  'over_under_15',
  'over_under_25',
  'over_under_35',
  'btts',
  'double_chance',
  'draw_no_bet',
  'total_corners',
  'total_red_cards',
] as const

const outcomes = ['home', 'draw', 'away', 'over', 'under', 'yes', 'no'] as const

export const Route = createFileRoute('/odds/')({
  head: () => ({ meta: [{ title: 'Odds — live decimal feed | OddsHub' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.market === 'string' && (markets as readonly string[]).includes(search.market)
      ? { market: search.market as (typeof markets)[number] }
      : {}),
    ...(typeof search.outcome === 'string' && (outcomes as readonly string[]).includes(search.outcome)
      ? { outcome: search.outcome as (typeof outcomes)[number] }
      : {}),
    ...(search.best === 'true' ? { best: true } : {}),
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const { market = '1x2', outcome, best } = deps.search
    const params = { market, outcome, limit: 100 }
    const [feed, books] = await Promise.all([
      best ? oddsBest({ data: toParams(params) }) : oddsFeed({ data: toParams(params) }),
      bookmakers({ data: {} }),
    ])
    return { feed, books }
  },
  component: OddsPage,
})

function OddsPage() {
  const { feed, books } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const bookmakerCount = new Map<string, number>()
  for (const row of feed.results) {
    bookmakerCount.set(row.bookmaker_name, (bookmakerCount.get(row.bookmaker_name) ?? 0) + 1)
  }
  const bookmakersAxis = [...bookmakerCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([name]) => name)
  const outcomesAxis = [...new Set(feed.results.map((row) => row.outcome_name))].slice(0, 6)
  const grouped: Record<string, (number | null)[]> = {}
  for (const outcome of outcomesAxis) {
    grouped[outcome] = bookmakersAxis.map((bookie) => {
      const row = feed.results.find((r) => r.bookmaker_name === bookie && r.outcome_name === outcome)
      return row?.decimal_odds ?? null
    })
  }

  function setParam(key: string, value: string | undefined) {
    navigate({ search: (prev) => ({ ...prev, [key]: value }) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Odds feed</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={search.market ?? '1x2'} onValueChange={(value) => setParam('market', value ?? undefined)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {markets.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={search.outcome ?? 'all'} onValueChange={(v) => setParam('outcome', v === 'all' ? undefined : (v ?? undefined))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all outcomes</SelectItem>
              {outcomes.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={search.best ? 'default' : 'outline'}
            size="sm"
            onClick={() => navigate({ search: (prev) => ({ ...prev, best: !prev.best }) })}
          >
            {search.best ? 'Best prices on' : 'Best prices off'}
          </Button>
        </div>
      </div>

      {outcomesAxis.length > 0 && bookmakersAxis.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Bookmaker comparison — {search.market ?? '1x2'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BookmakerOddsChart
              bookmakers={bookmakersAxis}
              outcomes={outcomesAxis}
              values={grouped}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Bookmaker</TableHead>
                  <TableHead className="text-right">Odds</TableHead>
                  <TableHead className="text-right">Imp.</TableHead>
                  <TableHead className="text-right">Move</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feed.results.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      #{row.event_id}
                    </TableCell>
                    <TableCell>
                      {row.outcome_name}
                      {row.line != null && (
                        <span className="ml-1 text-muted-foreground">{row.line}</span>
                      )}
                      {row.is_max_quote && (
                        <Badge className="ml-2 bg-emerald-500/15 text-emerald-500">max</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.bookmaker_name}</TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {fmtOdds(row.decimal_odds)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {fmtPct(row.implied_probability)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.movement === 'up' && <span className="text-emerald-500">↑</span>}
                      {row.movement === 'down' && <span className="text-red-500">↓</span>}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {fmtTime(row.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookmakers ({books.count})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {books.results.map((b) => (
              <Badge key={b.slug} variant="outline" className="font-normal">
                {b.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}