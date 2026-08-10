import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listPredictions } from '@/lib/bsd.functions'
import { toParams } from '@/lib/bsd'
import { fmtDateTime } from '@/lib/format'

export const Route = createFileRoute('/predictions/')({
  head: () => ({ meta: [{ title: 'Model predictions | OddsHub' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    ...(search.recommended === 'true' ? { recommended: true } : {}),
    ...(typeof search.min_confidence === 'string' && Number.isFinite(Number(search.min_confidence))
      ? { min_confidence: Number(search.min_confidence) }
      : {}),
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const { recommended, min_confidence } = deps.search
    return listPredictions({
      data: toParams({ upcoming: true, recommended, min_confidence, limit: 50 }),
    })
  },
  component: Predictions,
})

function Predictions() {
  const { results } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  function toggleRecommended() {
    navigate({ search: (prev) => ({ ...prev, recommended: !prev.recommended }) })
  }

  function setConfidence(min: number | undefined) {
    navigate({ search: (prev) => ({ ...prev, min_confidence: min }) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Model predictions</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={search.recommended ? 'default' : 'outline'}
            size="sm"
            onClick={toggleRecommended}
          >
            ★ value picks only
          </Button>
          <Button
            variant={search.min_confidence === 0.7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setConfidence(search.min_confidence === 0.7 ? undefined : 0.7)}
          >
            conf ≥ 70%
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((prediction) => {
          const m = prediction.markets
          const result = m.match_result
          return (
            <Card key={prediction.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{prediction.event.league_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {fmtDateTime(prediction.event.event_date)}
                  </span>
                </div>
                <div>
                  <p className="font-medium leading-tight">
                    {prediction.event.home_team} vs {prediction.event.away_team}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Event #{prediction.event.id} • confidence{' '}
                    <span className="font-semibold text-foreground">
                      {(prediction.model.confidence * 100).toFixed(0)}%
                    </span>{' '}
                    • {prediction.model.version}
                  </p>
                </div>
                {result && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <Prob label="Home" value={result.prob_home} />
                    <Prob label="Draw" value={result.prob_draw} />
                    <Prob label="Away" value={result.prob_away} />
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  {m.expected_goals?.home != null && (
                    <span>xG {m.expected_goals.home.toFixed(1)}–{m.expected_goals.away?.toFixed(1) ?? '—'}</span>
                  )}
                  {m.over_under?.prob_over_25 != null && <span>O2.5 {m.over_under.prob_over_25.toFixed(0)}%</span>}
                  {m.btts?.prob_yes != null && <span>BTTS {m.btts.prob_yes.toFixed(0)}%</span>}
                  {m.score?.most_likely && <span>score {m.score.most_likely}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="uppercase">
                    {result?.predicted ?? '—'}
                  </Badge>
                  {prediction.recommendations.recommended === true && (
                    <Badge className="bg-emerald-500/15 text-emerald-500">★ value</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {!results.length && (
        <p className="text-sm text-muted-foreground">No predictions match the filters.</p>
      )}
    </div>
  )
}

function Prob({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-md bg-muted/60 p-1.5">
      <div className="font-semibold tabular-nums">{(value ?? 0).toFixed(0)}%</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
}