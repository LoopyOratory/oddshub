import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MatchRow } from '@/components/MatchRow'
import { PlayerLink, TeamCreat } from '@/components/TeamCreat'
import { TransferCard } from '@/components/TransferCard'
import { teamDetail, teamFixtures, teamSocial, teamSquad, listTransfers } from '@/lib/bsd.functions'
import { toParams } from '@/lib/bsd'
import type { SquadPlayerRaw, Transfer } from '@/lib/bsd'

export const Route = createFileRoute('/teams/$teamId')({
  loader: async ({ params }) => {
    const id = Number(params.teamId)
    const today = new Date().toISOString().slice(0, 10)
    const [team, squad, fixtures, social, transfers] = await Promise.all([
      teamDetail({ data: { id } }),
      teamSquad({ data: { id } }).catch(() => null),
      teamFixtures({ data: { id, status: 'upcoming', limit: 20 } }).catch(() => null),
      teamSocial({ data: { id, limit: 10 } }).catch(() => null),
      listTransfers({ data: toParams({ team_id: id, date_to: today, limit: 20, ordering: '-transfer_date' }) }).catch(
        () => null,
      ),
    ])
    return { team, squad, fixtures, social, transfers }
  },
  component: TeamPage,
})

function groupByPosition(players: SquadPlayerRaw[]): [string, SquadPlayerRaw[]][] {
  const groups = new Map<string, SquadPlayerRaw[]>()
  for (const player of players) {
    const key = player.position || 'Other'
    const bucket = groups.get(key) ?? []
    bucket.push(player)
    groups.set(key, bucket)
  }
  return [...groups.entries()]
}

function TeamPage() {
  const { team, squad, fixtures, social, transfers } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TeamCreat teamId={team.id} name={team.name} />
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            {team.country_code ?? '—'} • coach {team.coach_id ?? '—'} • venue {team.venue_id ?? '—'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="squad">
        <TabsList>
          <TabsTrigger value="squad">Squad</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>
        <TabsContent value="squad">
          {squad ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {groupByPosition(squad.players).map(([position, players]) => (
                <Card key={position}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{position}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    {players.map((player: SquadPlayerRaw) => (
                      <div key={player.id} className="flex items-center justify-between gap-2">
                        <PlayerLink playerId={player.id} name={player.name} />
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {player.nationality} {player.jersey_number ? ` · #${player.jersey_number}` : ''}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No squad data.</p>
          )}
        </TabsContent>
        <TabsContent value="fixtures" className="space-y-3">
          {fixtures?.results.length ? (
            fixtures.results.map((event) => <MatchRow key={event.id} event={event} />)
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming fixtures.</p>
          )}
        </TabsContent>
        <TabsContent value="transfers">
          {transfers?.results.length ? (
            <div className="space-y-3">
              {transfers.results.map((transfer: Transfer) => (
                <TransferCard key={transfer.id} transfer={transfer} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent transfers.</p>
          )}
        </TabsContent>
        <TabsContent value="social">
          {social?.results.length ? (
            <div className="space-y-2">
              {social.results.map((post) => (
                <div key={post.id} className="rounded-lg border p-3 text-sm">
                  <span className="mr-2 text-xs uppercase text-muted-foreground">{post.type}</span>
                  {post.text}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No social posts.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}