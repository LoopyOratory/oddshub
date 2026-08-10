export function fmtOdds(value: number | null | undefined): string {
  return value == null ? '—' : value.toFixed(2)
}

export function fmtPct(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${(value * 100).toFixed(1)}%`
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return `${fmtDate(iso)} ${fmtTime(iso)}`
}

export function formatForm(form: string | undefined): string {
  if (!form) return '—'
  return form
}

export function minuteLabel(current_minute: number | null | undefined, period?: string | null): string {
  if (current_minute == null) return period ?? '—'
  return `${current_minute}'`
}