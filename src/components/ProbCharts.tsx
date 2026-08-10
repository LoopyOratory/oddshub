import { Chart } from '@/components/Chart'
import type { EChartsOption } from 'echarts'

const axisLabel = { color: '#94a3b8' }
const splitLine = { lineStyle: { color: '#1e293b' } }

export interface ProbItem {
  label: string
  home: number
  draw: number
  away: number
}

export function ProbStackChart({ items }: { items: ProbItem[] }) {
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['Home', 'Draw', 'Away'],
      textStyle: { color: '#94a3b8' },
      top: 0,
    },
    grid: { left: 48, right: 16, top: 36, bottom: 72 },
    xAxis: {
      type: 'category',
      data: items.map((item) => item.label),
      axisLabel: {
        color: '#94a3b8',
        rotate: items.length > 6 ? 35 : 0,
        width: 110,
        overflow: 'truncate',
      },
    },
    yAxis: { type: 'value', max: 100, axisLabel, splitLine },
    series: [
      {
        name: 'Home',
        type: 'bar',
        stack: 'total',
        data: items.map((item) => item.home),
        itemStyle: { color: '#10b981' },
      },
      {
        name: 'Draw',
        type: 'bar',
        stack: 'total',
        data: items.map((item) => item.draw),
        itemStyle: { color: '#94a3b8' },
      },
      {
        name: 'Away',
        type: 'bar',
        stack: 'total',
        data: items.map((item) => item.away),
        itemStyle: { color: '#3b82f6' },
      },
    ],
  }
  return <Chart option={option} />
}

export function ValueBars({
  categories,
  values,
  colors,
  name,
}: {
  categories: string[]
  values: number[]
  colors?: string[]
  name?: string
}) {
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: { left: 48, right: 16, top: 24, bottom: 56 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#94a3b8', rotate: categories.length > 7 ? 30 : 0 },
    },
    yAxis: { type: 'value', axisLabel, splitLine },
    series: [
      {
        name: name ?? 'value',
        type: 'bar',
        data: values.map((value, i) => ({
          value,
          itemStyle: colors ? { color: colors[i % colors.length] } : undefined,
        })),
        label: { show: true, position: 'top', formatter: '{c}', color: '#cbd5e1' },
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
  return <Chart option={option} />
}