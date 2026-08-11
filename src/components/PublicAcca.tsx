'use client'

import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { publishAcca, fetchPublicAccas, fetchTopAccas, copyAcca } from '@/lib/features.functions'
import type { AccaSelection } from '@/lib/acca'

interface PublicAcca {
  id: number
  code: string
  user_name: string
  total_odds: number
  stake: number
  potential_return: number
  status: string
  views: number
  copies: number
  created_at: string
}

export function PublishAccaButton({
  selections,
  totalOdds,
  stake,
  potentialReturn,
}: {
  selections: AccaSelection[]
  totalOdds: number
  stake: number
  potentialReturn: number
}) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishedCode, setPublishedCode] = useState<string | null>(null)

  const handlePublish = async () => {
    if (isPublishing || selections.length === 0) return

    setIsPublishing(true)
    try {
      const result = await publishAcca({
        data: {
          userName: 'Anonymous',
          selections,
          totalOdds,
          stake,
          potentialReturn,
        },
      })
      if (result.success) {
        setPublishedCode(result.code)
      }
    } catch {
      // Ignore errors
    } finally {
      setIsPublishing(false)
    }
  }

  if (publishedCode) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono">
          {publishedCode}
        </Badge>
        <Link to="/predictions/$code" params={{ code: publishedCode }}>
          <Button size="sm" variant="outline">
            View Public
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handlePublish}
      disabled={isPublishing || selections.length === 0}
    >
      {isPublishing ? 'Publishing...' : 'Share Publicly'}
    </Button>
  )
}

export function PublicAccaList({ limit = 10 }: { limit?: number }) {
  const [accas, setAccas] = useState<PublicAcca[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchPublicAccas({ data: { limit } })
        setAccas((result as unknown as PublicAcca[]) || [])
      } catch {
        // Ignore errors
      }
    }
    load()
  }, [limit])

  if (accas.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        No public accumulators yet. Create one and share!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {accas.map((acca) => (
        <PublicAccaCard key={acca.id} acca={acca} />
      ))}
    </div>
  )
}

export function PublicAccaCard({ acca }: { acca: PublicAcca }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyAcca({ data: { code: acca.code } })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {acca.code}
              </Badge>
              <span className="text-xs text-muted-foreground">{acca.user_name}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total odds</span>
                <span className="font-mono font-bold text-emerald-300">
                  {acca.total_odds.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential return</span>
                <span className="font-mono font-bold">
                  €{acca.potential_return.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={handleCopy} disabled={copied}>
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
            <Link to="/predictions/$code" params={{ code: acca.code }}>
              <Button size="sm" variant="outline" className="w-full">
                View
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>👁 {acca.views}</span>
          <span>📋 {acca.copies}</span>
          <span>{new Date(acca.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function TopAccas({ period = 'week' }: { period?: 'day' | 'week' | 'month' }) {
  const [accas, setAccas] = useState<PublicAcca[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchTopAccas({ data: { period } })
        setAccas((result as unknown as PublicAcca[]) || [])
      } catch {
        // Ignore errors
      }
    }
    load()
  }, [period])

  if (accas.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">🏆 Top Accumulators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {accas.slice(0, 5).map((acca, i) => (
          <div key={acca.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">#{i + 1}</span>
              <Link
                to="/predictions/$code"
                params={{ code: acca.code }}
                className="font-mono text-xs hover:text-emerald-300"
              >
                {acca.code}
              </Link>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono font-bold text-emerald-300">
                {acca.total_odds.toFixed(1)}x
              </span>
              <span>📋 {acca.copies}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}