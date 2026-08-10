'use client'

import { useEffect, useRef } from 'react'

interface InfographicProps {
  syntax: string
  className?: string
  width?: string | number
  height?: string | number
}

export function InfographicRenderer({
  syntax,
  className = '',
  width = '100%',
  height = 400,
}: InfographicProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const render = async () => {
      try {
        const { Infographic } = await import('@antv/infographic')

        if (instanceRef.current) {
          instanceRef.current.destroy()
        }

        instanceRef.current = new Infographic({
          container: containerRef.current!,
          width,
          height,
          editable: false,
        })

        instanceRef.current.render(syntax)
      } catch (error) {
        console.error('Infographic render error:', error)
      }
    }

    render()

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy()
        instanceRef.current = null
      }
    }
  }, [syntax, width, height])

  return (
    <div
      ref={containerRef}
      className={`infographic-container ${className}`}
      style={{ width, minHeight: height }}
    />
  )
}

// Pre-built templates for OddsHub

export function MatchPreviewInfographic({
  homeTeam,
  awayTeam,
  homeForm,
  awayForm,
  prediction,
  confidence,
  odds,
}: {
  homeTeam: string
  awayTeam: string
  homeForm: string
  awayForm: string
  prediction: string
  confidence: number
  odds: number
}) {
  const syntax = `
infographic list-row-simple-horizontal-arrow
data
  lists
    - label ${homeTeam}
      desc Form: ${homeForm}
    - label Prediction
      desc ${prediction} @ ${odds}
    - label Confidence
      desc ${confidence}%
    - label ${awayTeam}
      desc Form: ${awayForm}
  `

  return <InfographicRenderer syntax={syntax} height={300} />
}

export function PredictionCardInfographic({
  match,
  prediction,
  confidence,
  odds,
  valueBet,
}: {
  match: string
  prediction: string
  confidence: number
  odds: number
  valueBet?: boolean
}) {
  const syntax = `
infographic stat-card-gradient
data
  stats
    - label Match
      value ${match}
    - label Pick
      value ${prediction}
    - label Odds
      value ${odds}
    - label Confidence
      value ${confidence}%
    ${valueBet ? '- label Value Bet\n      value ★ YES' : ''}
  `

  return <InfographicRenderer syntax={syntax} height={250} />
}

export function AccaSummaryInfographic({
  selections,
  totalOdds,
  potentialReturn,
}: {
  selections: Array<{
    match: string
    pick: string
    odds: number
  }>
  totalOdds: number
  potentialReturn: number
}) {
  const selectionLines = selections
    .map(
      (s, i) =>
        `    - label ${i + 1}. ${s.match}\n      desc ${s.pick} @ ${s.odds}`,
    )
    .join('\n')

  const syntax = `
infographic list-row-simple-horizontal-arrow
data
  lists
${selectionLines}
    - label Total Odds
      desc ${totalOdds.toFixed(2)}
    - label Potential Return
      desc €${potentialReturn.toFixed(2)}
  `

  return <InfographicRenderer syntax={syntax} height={400} />
}

export function StatsInfographic({
  stats,
}: {
  stats: Array<{
    label: string
    value: string | number
  }>
}) {
  const statLines = stats
    .map((s) => `    - label ${s.label}\n      value ${s.value}`)
    .join('\n')

  const syntax = `
infographic stat-card-gradient
data
  stats
${statLines}
  `

  return <InfographicRenderer syntax={syntax} height={200} />
}