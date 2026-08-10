import { useState, useEffect } from 'react'
import { addToAcca, isInAcca } from '@/lib/acca-actions'

interface OddsButtonProps {
  eventId: number
  eventLabel: string
  market: string
  outcome: string
  outcomeLabel: string
  odds: number | null | undefined
}

export function OddsButton({
  eventId,
  eventLabel,
  market,
  outcome,
  outcomeLabel,
  odds,
}: OddsButtonProps) {
  const [selected, setSelected] = useState(false)

  // Sync with URL state
  useEffect(() => {
    const check = () => setSelected(isInAcca(eventId, market, outcome))
    check()
    window.addEventListener('popstate', check)
    return () => window.removeEventListener('popstate', check)
  }, [eventId, market, outcome])

  if (odds == null) {
    return (
      <span className="inline-flex h-9 w-16 items-center justify-center rounded bg-white/5 text-xs text-muted-foreground">
        —
      </span>
    )
  }

  return (
    <button
      onClick={() =>
        addToAcca({ eventId, eventLabel, market, outcome, outcomeLabel, odds })
      }
      className={`inline-flex h-9 w-16 flex-col items-center justify-center rounded transition-all ${
        selected
          ? 'bg-emerald-500/20 ring-2 ring-emerald-400 text-emerald-300'
          : 'bg-white/5 hover:bg-white/10 text-foreground'
      }`}
    >
      <span className="text-xs text-muted-foreground">{outcomeLabel}</span>
      <span className="font-mono text-sm font-bold tabular-nums">{odds.toFixed(2)}</span>
    </button>
  )
}