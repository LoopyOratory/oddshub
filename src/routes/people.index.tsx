import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listManagers, listReferees, listVenues } from '@/lib/bsd.functions'

export const Route = createFileRoute('/people/')({
  loader: async () => {
    const [managers, referees, venues] = await Promise.all([
      listManagers({ data: { limit: 100 } }),
      listReferees({ data: { limit: 100 } }),
      listVenues({ data: { limit: 100 } }),
    ])
    return { managers, referees, venues }
  },
  component: People,
})

function People() {
  const { managers, referees, venues } = Route.useLoaderData()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">People &amp; places</h1>
      <Tabs defaultValue="managers">
        <TabsList>
          <TabsTrigger value="managers">Managers</TabsTrigger>
          <TabsTrigger value="referees">Referees</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
        </TabsList>

        <TabsContent value="managers">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manager</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Nation</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead className="text-right">Matches</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.results.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell className="font-medium">{manager.name}</TableCell>
                      <TableCell>{manager.team_name ?? '—'}</TableCell>
                      <TableCell>{manager.nationality_code ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {manager.preferred_formation ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {manager.matches_managed ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referees">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referee</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Matches</TableHead>
                    <TableHead className="text-right">YC/match</TableHead>
                    <TableHead className="text-right">RC/match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referees.results.map((referee) => (
                    <TableRow key={referee.id}>
                      <TableCell className="font-medium">{referee.name}</TableCell>
                      <TableCell>{referee.country_code ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {referee.matches_officiated ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {referee.yellow_cards_avg ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {referee.red_cards_avg ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venues">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {venues.results.map((venue) => (
              <Card key={venue.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{venue.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {venue.city ?? '—'} {venue.country_code ? `· ${venue.country_code}` : ''}
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Capacity</span>
                    <Badge variant="outline" className="tabular-nums">
                      {venue.capacity?.toLocaleString() ?? '—'}
                    </Badge>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}