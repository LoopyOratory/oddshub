import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchAcca, copyAcca } from '@/lib/features.functions'
import { useState } from 'react'

interface SlipSelection {
  eventLabel: string
  outcomeLabel: string
  market: string
  odds: number
}

interface SlipData {
  code: string
  user_name: string
  selections: string | SlipSelection[]
  total_odds: number
  stake: number
  potential_return: number
  views: number
  copies: number
  created_at: string
}

function daysRemaining(createdAt: string): number {
  const created = new Date(createdAt)
  const expiry = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000)
  const now = new Date()
  return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
}

export const Route = createFileRoute('/predictions/$code')({
  head: ({ params }) => ({
    meta: [
      { title: `Prediction slip ${params.code} | OddsHub` },
      {
        name: 'description',
        content: 'Shared football prediction slip with combined odds and potential returns.',
      },
    ],
    links: [{ rel: 'canonical', href: `https://oddshub.example.com/predictions/${params.code}` }],
  }),
  loader: async ({ params }) => {
    const acca = await fetchAcca({ data: { code: params.code } })
    return { acca }
  },
  component: SlipPage,
})

function SlipPage() {
  const { acca } = Route.useLoaderData() as { acca: SlipData | null }
  const [copied, setCopied] = useState(false)

  if (!acca) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-2xl font-bold">Slip expired or not found</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Prediction slips live for 7 days, then expire automatically. Share links stop working
          after that period.
        </p>
        <Link to="/predictions">
          <Button className="mt-6">Browse Predictions</Button>
        </Link>
      </div>
    )
  }

  const selections: SlipSelection[] =
    typeof acca.selections === 'string' ? JSON.parse(acca.selections) : acca.selections
  const daysLeft = daysRemaining(acca.created_at)

  const handleCopy = async () => {
    await copyAcca({ data: { code: acca.code } })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const text = `🎯 Prediction slip ${acca.code} — ${acca.total_odds.toFixed(2)}x acca on OddsHub!\n\n${selections
      .map((s) => `• ${s.eventLabel}: ${s.outcomeLabel} @ ${s.odds.toFixed(2)}`)
      .join('\n')}\n\nPotential return: €${acca.potential_return.toFixed(2)}\nView: https://oddshub.example.com/predictions/${acca.code}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
  }

  const shareTwitter = () => {
    const text = `🔥 ${acca.total_odds.toFixed(2)}x prediction slip on OddsHub!`
    const url = `https://oddshub.example.com/predictions/${acca.code}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Prediction Slip</h1>
          <p className="text-muted-foreground">shared by {acca.user_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {acca.code}
          </Badge>
          <Badge
            variant={daysLeft <= 2 ? 'destructive' : 'outline'}
            className={daysLeft > 2 ? 'text-amber-400' : ''}
          >
            ⏳ expires in {daysLeft}d
          </Badge>
        </div>
      </div>

      {/* Selections */}
      <Card>
        <CardHeader>
          <CardTitle>
            Selections ({selections.length} fold)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selections.map((sel, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 border-b pb-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{sel.eventLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {sel.outcomeLabel}
                  {sel.market && <span> ({sel.market})</span>}
                </p>
              </div>
              <span className="shrink-0 font-mono font-bold text-emerald-300">
                {sel.odds.toFixed(2)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Returns */}
      <Card>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-lg">
            <span className="font-medium">Combined odds</span>
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

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCopy} disabled={copied} className="flex-1">
          {copied ? '✓ Copied to Betslip' : 'Copy to My Betslip'}
        </Button>
        <Button variant="outline" onClick={shareWhatsApp}>
          WhatsApp
        </Button>
        <Button variant="outline" onClick={shareTwitter}>
          Twitter
        </Button>
      </div>

      {/* Stats */}
      <div className="text-center text-sm text-muted-foreground">
        👁 {acca.views} views · 📋 {acca.copies} copies · created{' '}
        {new Date(acca.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}