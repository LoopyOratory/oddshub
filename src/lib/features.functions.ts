import { createServerFn } from '@tanstack/react-start'
import {
  castVote,
  getVoteSummary,
  getUserVote,
  createAccumulator,
  getAccumulator,
  listPublicAccas,
  getTopAccas,
  copyAccumulator,
  generateAccaCode,
} from '@/lib/db.server'
import type { AccaSelection } from '@/lib/acca'

// Voting functions
export const submitVote = createServerFn({ method: 'POST' })
  .validator((data: { eventId: number; vote: string; userHash: string }) => data)
  .handler(async ({ data }) => {
    return castVote(data.eventId, data.vote, data.userHash)
  })

export const fetchVoteSummary = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => data)
  .handler(async ({ data }) => {
    return getVoteSummary(data.eventId)
  })

export const fetchUserVote = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number; userHash: string }) => data)
  .handler(async ({ data }) => {
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

export const fetchAcca = createServerFn({ method: 'GET' })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    return getAccumulator(data.code)
  })

export const fetchPublicAccas = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: { limit?: number; offset?: number }) => data)
  .handler(async ({ data }) => {
    return listPublicAccas(data.limit ?? 20, data.offset ?? 0) as unknown
  })

export const fetchTopAccas = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: { period?: 'day' | 'week' | 'month'; limit?: number }) => data)
  .handler(async ({ data }) => {
    return getTopAccas(data.period ?? 'week', data.limit ?? 10) as unknown
  })

export const copyAcca = createServerFn({ method: 'POST' })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    return copyAccumulator(data.code)
  })