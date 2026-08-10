import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransferCard } from '@/components/TransferCard'
import { fmtDate } from '@/lib/format'
import {
  playerCareer,
  playerDetail,
  playerNationalTeam,
  playerStats,
  playerTransfers,
} from '@/lib/bsd.functions'

export const Route = createFileRoute('/players/$playerId')({
  loader: async ({ params }) => {
    const id = Number(params.playerId)
    const [player, stats, transfersData, career, nationalTeam] = await Promise.all([
      playerDetail({ data: { id } }),
      playerStats({ data: { id, limit: 30 } }).catch(() => null),
      playerTransfers({ data: { id } }).catch(() => null),
      playerCareer({ data: { id } }).catch(() => null),
      playerNationalTeam({ data: { id } }).catch(() => null),
    ])
    const transfers = transfersData?.transfers ?? []
    return { player, stats, transfers, career, nationalTeam }
  },
  component: PlayerPage,
})

function PlayerPage() {
  const { player, stats, transfers, career, nationalTeam } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-lg font-bold text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
          {avatarText(player.name)}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{player.name}</h1>
          <p className="text-sm text-muted-foreground">
            {player.position ?? '—'} • {player.nationality_code ?? '—'} • {player.team_name ?? 'free agent'}
            {player.market_value != null && ` • €${player.market_value.toLocaleString()}`}
          </p>
        </div>
      </div>
      </div>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">Match log</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
          <TabsTrigger value="national">National team</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          {stats ? <JsonList rows={stats.results} /> : <p className="text-sm text-muted-foreground">No stats.</p>}
        </TabsContent>
        <TabsContent value="transfers">
          {transfers?.length ? (
            <div className="space-y-3">
              {transfers.map((transfer) => (
                <TransferCard key={transfer.id} transfer={transfer} showPlayer={false} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No transfers.</p>
          )}
        </TabsContent>
        <TabsContent value="career">
          {career?.length ? (
            <JsonList rows={career as Record<string, unknown>[]} />
          ) : (
            <p className="text-sm text-muted-foreground">No career data.</p>
          )}
        </TabsContent>
        <TabsContent value="national">
          {nationalTeam ? (
            <Card>
              <CardContent className="p-4 text-sm">
                <pre className="overflow-x-auto text-xs">{JSON.stringify(nationalTeam, null, 2)}</pre>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">No international record.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function avatarText(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function JsonList({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <Card>
      <CardContent className="divide-y p-0">
        {rows.map((row, i) => (
          <div key={i} className="px-4 py-2 text-sm">
            <span className="mr-2 text-xs text-muted-foreground">
              {typeof row.event_date === 'string' ? fmtDate(row.event_date) : '—'}
            </span>
            {Object.entries(row)
              .filter(([key]) => !['event_date'].includes(key))
              .slice(0, 6)
              .map(([key, value]) => (
                <span key={key} className="mr-3">
                  <span className="text-muted-foreground">{key}:</span> {String(value ?? '—')}
                </span>
              ))}
          </div>
        ))}
        {!rows.length && <p className="p-4 text-sm text-muted-foreground">Empty.</p>}
      </CardContent>
    </Card>
  )
}