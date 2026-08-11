import { useState, useEffect } from 'react'
import { combinedOdds, potentialReturn, selectionKey } from '@/lib/acca'
import type { AccaSelection } from '@/lib/acca'
import { publishAcca } from '@/lib/features.functions'
import { Button } from '@/components/ui/button'

function getSelectionsFromURL(): AccaSelection[] {
  if (typeof window === 'undefined') return []
  const params = new URLSearchParams(window.location.search)
  try {
    return JSON.parse(params.get('acca') || '[]')
  } catch {
    return []
  }
}

function updateURL(selections: AccaSelection[]) {
  const params = new URLSearchParams(window.location.search)
  if (selections.length === 0) {
    params.delete('acca')
  } else {
    params.set('acca', JSON.stringify(selections))
  }
  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params : ''}`
  window.history.replaceState(null, '', newUrl)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function AccaWidget() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selections, setSelections] = useState<AccaSelection[]>([])

  // Sync with URL on mount and popstate
  useEffect(() => {
    setSelections(getSelectionsFromURL())
    const handlePop = () => setSelections(getSelectionsFromURL())
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const totalOdds = combinedOdds(selections)
  const totalStake = selections.reduce((sum, s) => sum + s.stake, 0)
  const potential = potentialReturn(selections)

  const removeSelection = (key: string) => {
    const next = selections.filter((s) => selectionKey(s) !== key)
    setSelections(next)
    updateURL(next)
  }

  const updateStake = (key: string, stake: number) => {
    const next = selections.map((s) =>
      selectionKey(s) === key ? { ...s, stake } : s,
    )
    setSelections(next)
    updateURL(next)
  }

  const clearAll = () => {
    setSelections([])
    updateURL([])
    setOpen(false)
  }

  const shareAcca = async () => {
    // Publish the slip and share a link to its /predictions/<code> page
    try {
      const totalOdds = combinedOdds(selections)
      const stake = selections.reduce((sum, s) => sum + s.stake, 0)
      const result = await publishAcca({
        data: {
          userName: 'Anonymous',
          selections,
          totalOdds,
          stake,
          potentialReturn: stake * totalOdds,
        },
      })
      if (result.success && result.code) {
        const shareUrl = `${window.location.origin}/predictions/${result.code}`
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // fallback: copy raw acca payload instead
      const url = new URL(window.location.href)
      url.searchParams.set('acca', JSON.stringify(selections))
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!selections.length) return null

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/40 active:scale-95"
      >
        <span className="text-lg font-bold">{selections.length}</span>
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
          {selections.length}
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-card shadow-2xl md:inset-x-auto md:bottom-6 md:right-6 md:w-96 md:rounded-2xl">
          <div className="sticky top-0 z-10 border-b border-white/5 bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="font-heading text-base font-bold">
                Betslip
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {selections.length} {selections.length === 1 ? 'pick' : 'picks'}
                </span>
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/5 p-4">
            {selections.map((sel) => (
              <SelectionRow
                key={selectionKey(sel)}
                selection={sel}
                onRemove={() => removeSelection(selectionKey(sel))}
                onUpdateStake={(stake) => updateStake(selectionKey(sel), stake)}
              />
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-white/5 bg-card/95 p-4 backdrop-blur-sm">
            <div className="mb-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total odds</span>
                <span className="font-mono font-bold tabular-nums text-emerald-300">
                  {totalOdds.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total stake</span>
                <span className="font-mono font-bold tabular-nums">
                  {totalStake > 0 ? `€${totalStake.toFixed(2)}` : '—'}
                </span>
              </div>
              {totalStake > 0 && (
                <div className="flex justify-between text-base">
                  <span className="font-medium">Potential return</span>
                  <span className="font-mono font-bold text-emerald-300">
                    €{potential.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareAcca}
                className="flex-1"
              >
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearAll}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SelectionRow({
  selection,
  onRemove,
  onUpdateStake,
}: {
  selection: AccaSelection
  onRemove: () => void
  onUpdateStake: (stake: number) => void
}) {
  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{selection.eventLabel}</p>
          <p className="text-sm font-medium">
            {selection.outcomeLabel}
            <span className="ml-1 text-xs text-muted-foreground">
              ({selection.market})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-emerald-300">
            {selection.odds.toFixed(2)}
          </span>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Stake €</label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={selection.stake || ''}
          onChange={(e) => onUpdateStake(Number(e.target.value))}
          placeholder="0.00"
          className="w-20 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs font-mono tabular-nums focus:border-emerald-500 focus:outline-none"
        />
      </div>
    </div>
  )
}