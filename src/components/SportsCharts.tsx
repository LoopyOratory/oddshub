import { Chart } from '@/components/Chart'
import type { EChartsOption } from 'echarts'

const axisLabel = { color: '#94a3b8' }
const splitLine = { lineStyle: { color: '#1e293b' } }
const legend = { textStyle: { color: '#94a3b8' }, top: 0 }

function factorial(n: number): number {
  let acc = 1
  for (let i = 2; i <= n; i++) acc *= i
  return acc
}

function poisson(lambda: number, k: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k)
}

export interface XgPoint {
  minute: number
  home: number
  away: number
}

export interface Shot {
  gm: { x: number; y: number }
  pos?: { x: number; y: number }
  xg: number
  min: number
  type: string
  home: boolean
  body?: string
  added?: number
  player_id?: number
}

// Scoreline probability matrix (independent Poisson on expected goals) — the standard football forecast chart.
export function ScorelineHeatmap({ homeXg, awayXg }: { homeXg: number; awayXg: number }) {
  const maxGoals = 7
  const data: [number, number, number][] = []
  let maxProb = 0
  for (let home = 0; home <= maxGoals; home++) {
    for (let away = 0; away <= maxGoals; away++) {
      const prob = poisson(Math.max(homeXg, 0.05), home) * poisson(Math.max(awayXg, 0.05), away)
      maxProb = Math.max(maxProb, prob)
      data.push([away, home, Number((prob * 100).toFixed(2))])
    }
  }

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const [away, home, prob] = (params as unknown as { value: [number, number, number] }).value
        return `${home} - ${away} → <b>${prob}%</b>`
      },
    },
    grid: { left: 44, right: 16, top: 24, bottom: 44 },
    xAxis: {
      type: 'category',
      name: 'Away goals',
      nameTextStyle: axisLabel,
      data: Array.from({ length: maxGoals + 1 }, (_, i) => String(i)),
      axisLabel,
      splitArea: { show: true, areaStyle: { color: ['rgba(148,163,184,0.03)', 'rgba(148,163,184,0.06)'] } },
    },
    yAxis: {
      type: 'category',
      name: 'Home goals',
      nameTextStyle: axisLabel,
      data: Array.from({ length: maxGoals + 1 }, (_, i) => String(i)),
      axisLabel,
      inverse: true,
      splitArea: { show: true, areaStyle: { color: ['rgba(148,163,184,0.03)', 'rgba(148,163,184,0.06)'] } },
    },
    visualMap: {
      min: 0,
      max: Number((maxProb * 100).toFixed(1)),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: '#94a3b8' },
      inRange: { color: ['#052e22', '#10b981', '#fbbf24', '#f97316'] },
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: { show: true, color: '#e2e8f0', fontSize: 10, formatter: '{c}' },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.4)' } },
      },
    ],
  }
  return <Chart option={option} />
}

// Cumulative expected-goals flow over match time — the FotMob/Understat-style timeline.
export function XgFlowChart({ points }: { points: XgPoint[] }) {
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { ...legend, data: ['Home xG', 'Away xG'] },
    grid: { left: 44, right: 16, top: 32, bottom: 40 },
    xAxis: { type: 'category', data: points.map((p) => `${p.minute}'`), axisLabel },
    yAxis: { type: 'value', name: 'xG', nameTextStyle: axisLabel, axisLabel, splitLine },
    series: [
      {
        name: 'Home xG',
        type: 'line',
        data: points.map((p) => Number(p.home.toFixed(3))),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#10b981', width: 2 },
        areaStyle: { color: 'rgba(16,185,129,0.18)' },
      },
      {
        name: 'Away xG',
        type: 'line',
        data: points.map((p) => Number(p.away.toFixed(3))),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#3b82f6', width: 2 },
        areaStyle: { color: 'rgba(59,130,246,0.18)' },
      },
    ],
  }
  return <Chart option={option} />
}

// Team stat comparison radar (possession, shots, xG, corners…) — two overlapping shapes.
export function StatRadar({
  home,
  away,
  homeLabel,
  awayLabel,
}: {
  home: Record<string, number>
  away: Record<string, number>
  homeLabel: string
  awayLabel: string
}) {
  const indicators = Object.keys(home).slice(0, 10)
  if (!indicators.length) return null

  function scale(names: string[], stats: Record<string, number>): number[] {
    return names.map((name) => {
      const max = Math.max(home[name] ?? 0, away[name] ?? 0)
      return max > 0 ? Number((((stats[name] ?? 0) / max) * 100).toFixed(1)) : 0
    })
  }

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { ...legend, data: [homeLabel, awayLabel] },
    radar: {
      indicator: indicators.map((name) => ({
        name: name.replace(/_/g, ' '),
        max: 100,
      })),
      radius: '62%',
      axisName: { color: '#94a3b8', fontSize: 10 },
      splitLine: splitLine,
      splitArea: { areaStyle: { color: ['rgba(148,163,184,0.04)', 'rgba(148,163,184,0.08)'] } },
    },
    series: [
      {
        type: 'radar',
        data: [
          { name: homeLabel, value: scale(indicators, home), areaStyle: { color: 'rgba(16,185,129,0.25)' }, lineStyle: { color: '#10b981' }, itemStyle: { color: '#10b981' } },
          { name: awayLabel, value: scale(indicators, away), areaStyle: { color: 'rgba(59,130,246,0.25)' }, lineStyle: { color: '#3b82f6' }, itemStyle: { color: '#3b82f6' } },
        ],
      },
    ],
  }
  return <Chart option={option} />
}

// Shot map on a schematic pitch — team-colored dots sized by xG, ringed by result.
export function ShotMap({ shots }: { shots: Shot[] }) {
  if (!shots.length) return null

  const homeShots = shots.filter((s) => s.home)
  const awayShots = shots.filter((s) => !s.home)
  const toPlot = (s: Shot) => [
    Number(((s.gm.x / 100) * 105).toFixed(1)),
    Number(((s.gm.y / 100) * 68).toFixed(1)),
  ]

  function seriesData(list: Shot[]) {
    return list.map((s) => ({
      value: toPlot(s),
      symbolSize: Math.max(5, Math.min(16, Math.round(Math.sqrt(s.xg) * 22))),
      itemStyle: {
        color: s.home ? '#10b981' : '#3b82f6',
        borderColor: s.type === 'goal' ? '#f97316' : 'rgba(148,163,184,0.7)',
        borderWidth: s.type === 'goal' ? 2 : 1,
      },
    }))
  }

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (params) => {
        const item = (params as unknown as { data: { value: [number, number] } }).data
        const shot = shots.find(
          (s) => toPlot(s)[0] === item.value[0] && toPlot(s)[1] === item.value[1],
        )
        if (!shot) return ''
        return `${shot.type} · ${shot.min}'${shot.added ? `+${shot.added}` : ''} · xG ${shot.xg.toFixed(3)}${shot.body ? ` · ${shot.body}` : ''}${shot.player_id ? ` · player ${shot.player_id}` : ''}`
      },
    },
    legend: {
      ...legend,
      data: [{ name: 'Home', icon: 'circle' }, { name: 'Away', icon: 'circle' }],
      left: 'center',
      top: 0,
    },
    grid: { left: 30, right: 30, top: 34, bottom: 24 },
    xAxis: { type: 'value', min: 0, max: 105, show: false },
    yAxis: { type: 'value', min: 0, max: 68, show: false },
    graphic: {
      elements: [
        { type: 'rect', left: 'center', top: 'middle', shape: { x: -52.25, y: -33.75, width: 104.5, height: 67.5 }, style: { fill: 'rgba(16,185,129,0.05)', stroke: '#334155', lineWidth: 1 } },
        { type: 'line', shape: { x1: 0, y1: -33.75, x2: 0, y2: 33.75 }, style: { stroke: '#334155', lineWidth: 1 } },
        { type: 'circle', shape: { cx: 0, cy: 0, r: 9.15 }, style: { stroke: '#334155', fill: 'transparent', lineWidth: 1 } },
        { type: 'rect', shape: { x: -52.25, y: -11.84, width: 16.5, height: 23.68 }, style: { stroke: '#334155', fill: 'transparent', lineWidth: 1 } },
        { type: 'rect', shape: { x: 35.75, y: -11.84, width: 16.5, height: 23.68 }, style: { stroke: '#334155', fill: 'transparent', lineWidth: 1 } },
        { type: 'rect', shape: { x: -52.25, y: -2.66, width: 5.5, height: 5.32 }, style: { stroke: '#334155', fill: 'transparent', lineWidth: 1 } },
        { type: 'rect', shape: { x: 46.75, y: -2.66, width: 5.5, height: 5.32 }, style: { stroke: '#334155', fill: 'transparent', lineWidth: 1 } },
      ],
    },
    series: [
      { name: 'Home', type: 'scatter', data: seriesData(homeShots) },
      { name: 'Away', type: 'scatter', data: seriesData(awayShots) },
    ],
  }
  return <Chart option={option} />
}

// Bookmaker odds comparison per outcome — grouped bars, OddsPortal style.
export function BookmakerOddsChart({
  bookmakers,
  outcomes,
  values,
}: {
  bookmakers: string[]
  outcomes: string[]
  values: Record<string, (number | null)[]>
}) {
  if (!bookmakers.length || !outcomes.length) return null

  const colorMap = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#e11d48', '#14b8a6', '#f97316']

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => (typeof value === 'number' ? value.toFixed(2) : String(value ?? '—')),
    },
    legend: { ...legend, data: outcomes },
    grid: { left: 48, right: 16, top: 32, bottom: 56 },
    xAxis: {
      type: 'category',
      data: bookmakers,
      axisLabel: { color: '#94a3b8', rotate: 30 },
    },
    yAxis: { type: 'value', name: 'Decimal odds', nameTextStyle: axisLabel, axisLabel, splitLine },
    series: outcomes.map((outcome, i) => ({
      name: outcome,
      type: 'bar',
      data: values[outcome],
      itemStyle: { color: colorMap[i % colorMap.length], borderRadius: [3, 3, 0, 0] },
      emphasis: { focus: 'series' },
    })),
  }
  return <Chart option={option} />
}