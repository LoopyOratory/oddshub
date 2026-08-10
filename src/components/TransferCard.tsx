import { Badge } from '@/components/ui/badge'
import { TeamCreat } from '@/components/TeamCreat'
import type { Transfer } from '@/lib/bsd'
import { fmtDate } from '@/lib/format'

export function TransferCard({
  transfer,
  showPlayer = true,
}: {
  transfer: Transfer
  showPlayer?: boolean
}) {
  const playerName = transfer.player?.name ?? 'Unknown player'
  const playerId = transfer.player?.id
  const fromName = transfer.from_team_name ?? '—'
  const toName = transfer.to_team_name ?? '—'

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/5 bg-card/80 p-4 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5">
      {/* Player avatar (only on team page) */}
      {showPlayer && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
          {playerName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w: string) => w[0]?.toUpperCase() ?? '')
            .join('')}
        </div>
      )}

      {/* Player name + transfer date */}
      <div className="min-w-0 flex-1">
        {showPlayer && (
          <p className="truncate text-sm font-medium group-hover:text-emerald-300">
            {playerId ? (
              <a href={`/players/${playerId}`}>{playerName}</a>
            ) : (
              playerName
            )}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{fmtDate(transfer.transfer_date)}</p>
      </div>

      {/* From → To */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1 truncate max-w-32">
          <TeamCreat teamId={transfer.from_team_id} name={fromName} size="sm" link={false} />
          <span className="truncate">{fromName}</span>
        </span>
        <span className="shrink-0 text-emerald-500">→</span>
        <span className="inline-flex items-center gap-1 truncate max-w-32">
          <TeamCreat teamId={transfer.to_team_id} name={toName} size="sm" link={false} />
          <span className="truncate">{toName}</span>
        </span>
      </div>

      {/* Fee badge */}
      <div className="shrink-0">
        {transfer.fee_eur != null && transfer.fee_eur > 0 ? (
          <Badge variant="outline" className="font-mono tabular-nums">
            €{transfer.fee_eur.toLocaleString()}
          </Badge>
        ) : transfer.fee_description && transfer.fee_description !== '-' ? (
          <Badge variant="outline">{transfer.fee_description}</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">Free</Badge>
        )}
      </div>
    </div>
  )
}