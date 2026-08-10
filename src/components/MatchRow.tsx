import { Badge } from '@/components/ui/badge'
import { TeamCreat } from '@/components/TeamCreat'
import { OddsButton } from '@/components/OddsButton'
import type { EventSummary } from '@/lib/bsd'
import { fmtTime } from '@/lib/format'
import { Link } from '@tanstack/react-router'

export type EventOddsMap = Map<number, { home?: number; draw?: number; away?: number }>

const statusStyles: Record<string, string> = {
  live: 'bg-red-500/15 text-red-500 border-red-500/30 animate-pulse',
  upcoming: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  finished: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  cancelled: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  postponed: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
}

export function StatusBadge({ event }: { event: Pick<EventSummary, 'status' | 'period' | 'current_minute' | 'event_date'> }) {
  const label =
    event.status === 'live'
      ? `${event.current_minute ?? ''}'`
      : event.status === 'upcoming'
        ? fmtTime(event.event_date)
        : event.status
  return (
    <Badge variant="outline" className={statusStyles[event.status] ?? ''}>
      {label}
    </Badge>
  )
}

export function MatchRow({ event, odds }: { event: EventSummary; odds?: EventOddsMap }) {
  const oddsFor = odds?.get(event.id)
  const score =
    event.home_score != null && event.away_score != null
      ? `${event.home_score} : ${event.away_score}`
      : '--'
  const status = event.status
  const scoreClassName =
    status === 'finished'
      ? 'text-foreground'
      : status === 'live'
        ? 'text-red-400'
        : 'text-muted-foreground'

  return (
    <Link
      to="/matches/$eventId"
      params={{ eventId: String(event.id) }}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
    >
      <span className="w-14 shrink-0">
        <StatusBadge event={event} />
      </span>
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="flex min-w-0 items-center justify-end gap-1.5">
          <span className="truncate font-medium group-hover:text-emerald-300">
            {event.home_team}
          </span>
          <TeamCreat teamId={event.home_team_id} name={event.home_team} size="sm" link={false} />
        </span>
        <span
          className={`w-16 text-center font-mono text-lg font-bold tabular-nums ${scoreClassName}`}
        >
          {score}
        </span>
        <span className="flex min-w-0 items-center justify-start gap-1.5">
          <TeamCreat teamId={event.away_team_id} name={event.away_team} size="sm" link={false} />
          <span className="truncate font-medium group-hover:text-emerald-300">{event.away_team}</span>
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1">
        <OddsButton
          eventId={event.id}
          eventLabel={`${event.home_team} vs ${event.away_team}`}
          market="1x2"
          outcome="home"
          outcomeLabel="H"
          odds={oddsFor?.home}
        />
        <OddsButton
          eventId={event.id}
          eventLabel={`${event.home_team} vs ${event.away_team}`}
          market="1x2"
          outcome="draw"
          outcomeLabel="D"
          odds={oddsFor?.draw}
        />
        <OddsButton
          eventId={event.id}
          eventLabel={`${event.home_team} vs ${event.away_team}`}
          market="1x2"
          outcome="away"
          outcomeLabel="A"
          odds={oddsFor?.away}
        />
      </span>
    </Link>
  )
}

export function LeagueGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/5 bg-card/60">
      <header className="sticky top-[52px] z-[1] flex items-center justify-between border-b border-white/5 bg-card/95 px-4 py-2 backdrop-blur">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h3>
      </header>
      <div className="divide-y divide-white/[0.03]">{children}</div>
    </section>
  )
}