import { createServerFn } from '@tanstack/react-start'
import type { AccaSelection } from '@/lib/acca'

// NOTE: db.server.ts uses bun:sqlite and must NEVER be statically imported from
// a module that can reach the client bundle. All DB access goes through dynamic
// imports inside handlers; TanStack Start stubs these calls client-side.

// Voting functions
export const submitVote = createServerFn({ method: 'POST' })
  .validator((data: { eventId: number; vote: string; userHash: string }) => data)
  .handler(async ({ data }) => {
    const { castVote } = await import('@/lib/db.server')
    return castVote(data.eventId, data.vote, data.userHash)
  })

export const fetchVoteSummary = createServerFn({ method: 'POST' })
  .validator((data: { eventId: number }) => data)
  .handler(async ({ data }) => {
    const { getVoteSummary } = await import('@/lib/db.server')
    return getVoteSummary(data.eventId)
  })

export const fetchUserVote = createServerFn({ method: 'POST' })
  .validator((data: { eventId: number; userHash: string }) => data)
  .handler(async ({ data }) => {
    const { getUserVote } = await import('@/lib/db.server')
    return getUserVote(data.eventId, data.userHash)
  })

// Accumulator functions
export const publishAcca = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      userName: string
      selections: AccaSelection[]
      totalOdds: number
      stake: number
      potentialReturn: number
    }) => data,
  )
  .handler(async ({ data }) => {
    const { createAccumulator, generateAccaCode } = await import('@/lib/db.server')
    const code = generateAccaCode()
    const success = createAccumulator(
      code,
      data.userName,
      data.selections,
      data.totalOdds,
      data.stake,
      data.potentialReturn,
    )
    return success ? { code, success: true } : { code: null, success: false }
  })

export const fetchAcca = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { getAccumulator } = await import('@/lib/db.server')
    return getAccumulator(data.code)
  })

export const fetchPublicAccas = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: { limit?: number; offset?: number }) => data)
  .handler(async ({ data }) => {
    const { listPublicAccas } = await import('@/lib/db.server')
    return listPublicAccas(data.limit ?? 20, data.offset ?? 0)
  })

export const fetchTopAccas = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: { period?: 'day' | 'week' | 'month'; limit?: number }) => data)
  .handler(async ({ data }) => {
    const { getTopAccas } = await import('@/lib/db.server')
    return getTopAccas(data.period ?? 'week', data.limit ?? 10)
  })

export const copyAcca = createServerFn({ method: 'POST' })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { copyAccumulator } = await import('@/lib/db.server')
    return copyAccumulator(data.code)
  })