import { createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Chart } from '@/components/Chart'
import { fmtOdds } from '@/lib/format'
import type { EChartsOption } from 'echarts'

interface AccaLeg {
  id: number
  match: string
  market: string
  selection: string
  odds: number
  void: boolean
}

export const Route = createFileRoute('/acca')({
  component: AccaBuilder,
})

function AccaBuilder() {
  const [legs, setLegs] = useState<AccaLeg[]>([])
  const [match, setMatch] = useState('')
  const [market, setMarket] = useState('1X2')
  const [selection, setSelection] = useState('')
  const [oddsInput, setOddsInput] = useState('')
  const [stake, setStake] = useState(10)

  const activeLegs = legs.filter((leg) => !leg.void)
  const combined = activeLegs.reduce((acc, leg) => acc * leg.odds, 1)
  const returns = stake * combined
  const profit = returns - stake

  function addLeg(e: FormEvent) {
    e.preventDefault()
    const odds = Number(oddsInput)
    if (!match.trim() || !selection.trim() || !Number.isFinite(odds) || odds <= 1) return
    setLegs((prev) => [
      ...prev,
      { id: Date.now(), match: match.trim(), market, selection: selection.trim(), odds, void: false },
    ])
    setMatch('')
    setSelection('')
    setOddsInput('')
  }

  function toggleVoid(id: number) {
    setLegs((prev) => prev.map((leg) => (leg.id === id ? { ...leg, void: !leg.void } : leg)))
  }

  function removeLeg(id: number) {
    setLegs((prev) => prev.filter((leg) => leg.id !== id))
  }

  const stakeCurve = Array.from({ length: 21 }, (_, i) => {
    const s = i * 10
    return { stake: s, returns: Number((s * combined).toFixed(2)) }
  })

  const oddsBarOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 40 },
    xAxis: {
      type: 'category',
      data: activeLegs.map((_, i) => `Leg ${i + 1}`),
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [
      {
        type: 'bar',
        data: activeLegs.map((leg) => leg.odds),
        itemStyle: { color: '#10b981', borderRadius: 4 },
        label: { show: true, position: 'top', formatter: '{c}' },
      },
    ],
  }

  const returnsOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 16, top: 24, bottom: 40 },
    xAxis: {
      type: 'value',
      name: 'Stake',
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: { type: 'value', name: 'Returns', nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [
      {
        type: 'line',
        data: stakeCurve.map((p) => [p.stake, p.returns]),
        smooth: true,
        lineStyle: { color: '#3b82f6', width: 2 },
        symbol: 'none',
        areaStyle: { color: 'rgba(59,130,246,0.15)' },
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Acca builder</h1>
        <p className="text-sm text-muted-foreground">
          Combine selections — decimal odds multiply. Void/push a leg and the acca re-prices automatically.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Selections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={addLeg} className="grid gap-2 sm:grid-cols-4">
              <Input
                value={match}
                onChange={(e) => setMatch(e.target.value)}
                placeholder="Match (e.g. Real Madrid vs Barcelona)"
                className="sm:col-span-2"
              />
              <Input value={market} onChange={(e) => setMarket(e.target.value)} placeholder="Market" />
              <Input
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
                placeholder="Selection"
              />
              <Input
                value={oddsInput}
                onChange={(e) => setOddsInput(e.target.value)}
                placeholder="Decimal odds"
                type="number"
                step="0.01"
                min="1.01"
              />
              <Button type="submit" className="sm:col-span-4">
                Add leg
              </Button>
            </form>

            <div className="divide-y rounded-lg border">
              {legs.map((leg, index) => (
                <div key={leg.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-8 text-muted-foreground">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className={leg.void ? 'line-through opacity-50' : ''}>{leg.match}</p>
                    <p className="text-xs text-muted-foreground">
                      {leg.market} • {leg.selection}
                    </p>
                  </div>
                  <span className={`font-mono font-semibold tabular-nums ${leg.void ? 'line-through opacity-50' : ''}`}>
                    {fmtOdds(leg.odds)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => toggleVoid(leg.id)}>
                    {leg.void ? 'Reactivate' : 'Void'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeLeg(leg.id)}>
                    ✕
                  </Button>
                </div>
              ))}
              {!legs.length && (
                <p className="p-4 text-sm text-muted-foreground">
                  No legs yet — add your first selection above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active legs</span>
                <Badge variant="outline">
                  {activeLegs.length} / {legs.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Combined odds</span>
                <span className="font-mono text-xl font-bold tabular-nums">{fmtOdds(combined)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stake</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={String(stake)}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="w-28 text-right font-mono tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground">Potential returns</span>
                <span className="font-mono text-xl font-bold tabular-nums text-emerald-500">
                  {returns.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profit</span>
                <span className={`font-mono tabular-nums ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {profit >= 0 ? '+' : ''}
                  {profit.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leg odds</CardTitle>
            </CardHeader>
            <CardContent>
              {activeLegs.length ? (
                <Chart option={oddsBarOption} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No active legs to chart.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Returns vs stake</CardTitle>
        </CardHeader>
        <CardContent>
          {activeLegs.length ? (
            <Chart option={returnsOption} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Add legs to see the payout curve.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}