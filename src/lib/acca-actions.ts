import { selectionKey, type AccaSelection } from '@/lib/acca'

export function addToAcca(selection: Omit<AccaSelection, 'stake'>) {
  const params = new URLSearchParams(window.location.search)
  const current: AccaSelection[] = JSON.parse(params.get('acca') || '[]')
  const key = selectionKey({ ...selection, stake: 0 })
  const exists = current.some((s) => selectionKey(s) === key)

  if (exists) {
    // Remove (toggle off)
    const next = current.filter((s) => selectionKey(s) !== key)
    params.set('acca', JSON.stringify(next))
  } else {
    // Add with default stake of 1
    params.set('acca', JSON.stringify([...current, { ...selection, stake: 1 }]))
  }

  window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function isInAcca(eventId: number, market: string, outcome: string): boolean {
  const params = new URLSearchParams(window.location.search)
  const current: AccaSelection[] = JSON.parse(params.get('acca') || '[]')
  return current.some(
    (s) => s.eventId === eventId && s.market === market && s.outcome === outcome,
  )
}