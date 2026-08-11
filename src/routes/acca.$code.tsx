import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchAcca, copyAcca } from '@/lib/features.functions'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/acca/$code')({
  head: ({ params }) => ({
    meta: [{ title: `Acca ${params.code} | OddsHub` }],
  }),
  loader: async ({ params }) => {
    const acca = await fetchAcca({ data: { code: params.code } })
    return { acca }
  },
  component: AccaDetail,
})

function AccaDetail() {
  const { acca } = Route.useLoaderData() as { acca: {
    code: string
    user_name: string
    selections: string | unknown[]
    total_odds: number
    stake: number
    potential_return: number
    views: number
    copies: number
    created_at: string
  } | null }
  const [copied, setCopied] = useState(false)

  if (!acca) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-2xl font-bold">Accumulator not found</h1>
        <p className="mt-2 text-muted-foreground">This code doesn&apos;t exist or has expired.</p>
        <Link to="/acca">
          <Button className="mt-6">Create New Acca</Button>
        </Link>
      </div>
    )
  }

  const selections = typeof acca.selections === 'string'
    ? JSON.parse(acca.selections)
    : acca.selections

  const handleCopy = async () => {
    await copyAcca({ data: { code: acca.code } })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Public Accumulator</h1>
          <p className="text-muted-foreground">by {acca.user_name}</p>
        </div>
        <Badge variant="outline" className="font-mono text-lg">
          {acca.code}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selections ({selections.length} folds)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selections.map((sel: { eventLabel: string; outcomeLabel: string; odds: number }, i: number) => (
            <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div>
                <p className="font-medium">{sel.eventLabel}</p>
                <p className="text-sm text-muted-foreground">{sel.outcomeLabel}</p>
              </div>
              <span className="font-mono font-bold text-emerald-300">
                {sel.odds.toFixed(2)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="font-medium">Total odds</span>
            <span className="font-mono font-bold text-emerald-300">
              {acca.total_odds.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stake</span>
            <span className="font-mono">€{acca.stake.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-medium">Potential return</span>
            <span className="font-mono font-bold text-emerald-300">
              €{acca.potential_return.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleCopy} disabled={copied} className="flex-1">
          {copied ? '✓ Copied to Betslip' : 'Copy to My Betslip'}
        </Button>
        <Link to="/acca">
          <Button variant="outline">Create New</Button>
        </Link>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        👁 {acca.views} views · 📋 {acca.copies} copies ·{' '}
        {new Date(acca.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}