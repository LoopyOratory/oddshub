import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listLeagues } from '@/lib/bsd.functions'

export const Route = createFileRoute('/leagues/')({
  loader: async () => listLeagues({ data: { limit: 200 } }),
  component: Leagues,
})

function Leagues() {
  const { results: leagues } = Route.useLoaderData()
  const [query, setQuery] = useState('')

  const filtered = leagues.filter((league) =>
    `${league.name} ${league.country}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Leagues</h1>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search league or country…"
          className="max-w-xs"
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>League</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Season</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((league) => (
                <TableRow key={league.id}>
                  <TableCell>
                    <Link
                      to="/leagues/$leagueId"
                      params={{ leagueId: String(league.id) }}
                      className="font-medium hover:underline"
                    >
                      {league.name}
                    </Link>
                  </TableCell>
                  <TableCell>{league.country}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {league.current_season?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={league.is_active ? 'default' : 'outline'}>
                      {league.is_active ? 'active' : 'inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}