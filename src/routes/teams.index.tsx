import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listTeams } from '@/lib/bsd.functions'

export const Route = createFileRoute('/teams/')({
  loader: async () => listTeams({ data: { limit: 200 } }),
  component: Teams,
})

function Teams() {
  const { results: teams } = Route.useLoaderData()
  const [query, setQuery] = useState('')

  const filtered = teams.filter(
    (team) =>
      `${team.name} ${team.country_code ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team…"
          className="max-w-xs"
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Coach</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <Link
                      to="/teams/$teamId"
                      params={{ teamId: String(team.id) }}
                      className="font-medium hover:underline"
                    >
                      {team.name}
                    </Link>
                  </TableCell>
                  <TableCell>{team.country_code ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{team.coach_id ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}