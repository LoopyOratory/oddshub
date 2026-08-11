'use client'

import { useState, useEffect } from 'react'
import { submitVote, fetchVoteSummary, fetchUserVote } from '@/lib/features.functions'
import { Button } from '@/components/ui/button'

function getUserHash(): string {
  if (typeof window === 'undefined') return ''
  let hash = localStorage.getItem('oddshub_user_hash')
  if (!hash) {
    hash = crypto.randomUUID()
    localStorage.setItem('oddshub_user_hash', hash)
  }
  return hash
}

interface VoteSummary {
  total_votes: number
  home_votes: number
  draw_votes: number
  away_votes: number
}

export function VoteButtons({ eventId }: { eventId: number }) {
  const [summary, setSummary] = useState<VoteSummary | null>(null)
  const [userVote, setUserVote] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    const loadVotes = async () => {
      try {
        const hash = getUserHash()
        const [voteSummary, existingVote] = await Promise.all([
          fetchVoteSummary({ data: { eventId } }),
          hash ? fetchUserVote({ data: { eventId, userHash: hash } }) : null,
        ])
        setSummary(voteSummary as VoteSummary)
        setUserVote(existingVote as string | null)
      } catch {
        // Ignore errors
      }
    }
    loadVotes()
  }, [eventId])

  const handleVote = async (vote: 'home' | 'draw' | 'away') => {
    if (isVoting || userVote) return

    setIsVoting(true)
    try {
      const hash = getUserHash()
      await submitVote({ data: { eventId, vote, userHash: hash } })
      setUserVote(vote)

      // Refresh summary
      const newSummary = await fetchVoteSummary({ data: { eventId } })
      setSummary(newSummary as VoteSummary)
    } catch {
      // Ignore errors
    } finally {
      setIsVoting(false)
    }
  }

  if (!summary || summary.total_votes === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Be the first to vote!</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleVote('home')} disabled={isVoting}>
            Home
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleVote('draw')} disabled={isVoting}>
            Draw
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleVote('away')} disabled={isVoting}>
            Away
          </Button>
        </div>
      </div>
    )
  }

  const homePct = Math.round((summary.home_votes / summary.total_votes) * 100)
  const drawPct = Math.round((summary.draw_votes / summary.total_votes) * 100)
  const awayPct = Math.round((summary.away_votes / summary.total_votes) * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Community votes</span>
        <span>{summary.total_votes.toLocaleString()} votes</span>
      </div>

      {/* Vote bars */}
      <div className="space-y-1.5">
        <VoteBar label="Home" pct={homePct} selected={userVote === 'home'} />
        <VoteBar label="Draw" pct={drawPct} selected={userVote === 'draw'} />
        <VoteBar label="Away" pct={awayPct} selected={userVote === 'away'} />
      </div>

      {/* Vote buttons (if not voted yet) */}
      {!userVote && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleVote('home')} disabled={isVoting} className="flex-1">
            Home
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleVote('draw')} disabled={isVoting} className="flex-1">
            Draw
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleVote('away')} disabled={isVoting} className="flex-1">
            Away
          </Button>
        </div>
      )}

      {userVote && (
        <p className="text-xs text-emerald-400">✓ You voted {userVote}</p>
      )}
    </div>
  )
}

function VoteBar({
  label,
  pct,
  selected,
}: {
  label: string
  pct: number
  selected: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-2 rounded-full transition-all ${
            selected ? 'bg-emerald-400' : 'bg-emerald-500/60'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs font-medium tabular-nums">{pct}%</span>
    </div>
  )
}