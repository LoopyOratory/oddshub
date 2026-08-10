import { useState } from 'react'
import { Link } from '@tanstack/react-router'

const IMG = 'https://sports.bzzoiro.com/img/team'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function TeamCreat({
  teamId,
  name,
  size = 'md',
  link = true,
}: {
  teamId?: number | null
  name: string
  size?: 'sm' | 'md'
  link?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const dims = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'

  const crest = failed || teamId == null ? (
    <span
      className={`${dims} inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-500/20`}
    >
      {initials(name) || '?'}
    </span>
  ) : (
    <img
      src={`${IMG}/${teamId}/`}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${dims} shrink-0 rounded-full object-contain`}
    />
  )

  if (!link) return crest
  return (
    <Link to="/teams/$teamId" params={{ teamId: String(teamId) }} title={name}>
      {crest}
    </Link>
  )
}

export function PlayerLink({
  playerId,
  name,
  position,
}: {
  playerId?: number | null
  name: string
  position?: string
}) {
  const initialsText = initials(name) || '?'
  return (
    <Link
      to="/players/$playerId"
      params={{ playerId: String(playerId) }}
      className="group inline-flex max-w-full items-center gap-2"
      title={name}
    >
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
        {initialsText}
      </span>
      <span className="truncate group-hover:text-emerald-300">
        {name}
        {position ? <span className="ml-1 text-xs text-muted-foreground">{position}</span> : null}
      </span>
    </Link>
  )
}