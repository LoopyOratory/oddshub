import { z } from 'zod'

export const accaSelectionSchema = z.object({
  eventId: z.number(),
  eventLabel: z.string(),
  market: z.string(),
  outcome: z.string(),
  outcomeLabel: z.string(),
  odds: z.number(),
  stake: z.number().default(0),
})

export type AccaSelection = z.infer<typeof accaSelectionSchema>

export const rootSearchSchema = z.object({
  acca: z.array(accaSelectionSchema).default([]),
})

export type RootSearch = z.infer<typeof rootSearchSchema>

export function combinedOdds(selections: AccaSelection[]): number {
  return selections.reduce((product, s) => product * s.odds, 1)
}

export function potentialReturn(selections: AccaSelection[]): number {
  const totalStake = selections.reduce((sum, s) => sum + s.stake, 0)
  return totalStake * combinedOdds(selections)
}

export function selectionKey(s: AccaSelection): string {
  return `${s.eventId}:${s.market}:${s.outcome}`
}
