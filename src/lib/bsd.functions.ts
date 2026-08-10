import { createServerFn } from '@tanstack/react-start'

import { bsdGet } from './bsd.server'
import type { BsdParams } from './bsd'
import type {
  Bookmaker,
  Broadcast,
  ComparisonResponse,
  EventDetail,
  EventSummary,
  H2H,
  League,
  LeagueLeaderboard,
  LiveEventsResponse,
  Manager,
  MatchLineup,
  OddsRow,
  Page,
  PlayerProfile,
  PolymarketResponse,
  Prediction,
  Referee,
  Season,
  SocialPost,
  SquadResponse,
  Standings,
  TeamProfile,
  Transfer,
  TvChannel,
  Venue,
  WorldCupSquad,
} from './bsd'

interface IdParams {
  id: number
}

// ---- Leagues & seasons ----

export const listLeagues = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<League>>('/leagues/', data))

export const leagueDetail = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<League>(`/leagues/${data.id}/`))

export const leagueSeasons = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Season>>(`/leagues/${data.id}/seasons/`))

export const leagueCurrentSeason = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Season>(`/leagues/${data.id}/season/`))

export const leagueStandings = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number }) => data)
  .handler(async ({ data }) => {
    const { id, ...params } = data
    return bsdGet<Standings>(`/leagues/${id}/standings/`, params)
  })

export const leagueTop = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number; stat: string }) => data)
  .handler(async ({ data }) => {
    const { id, stat, ...params } = data
    return bsdGet<LeagueLeaderboard>(`/leagues/${id}/top/${stat}/`, params)
  })

// ---- Events & live ----

export const listEvents = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<EventSummary>>('/events/', data))

export const liveEvents = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<LiveEventsResponse>('/events/live/', data))

export const eventDetail = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<EventDetail>(`/events/${data.id}/`))

export const eventStats = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Record<string, unknown>>(`/events/${data.id}/stats/`))

export const eventLineups = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<MatchLineup>(`/events/${data.id}/lineups/`))

export const eventIncidents = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Record<string, unknown>>>(`/events/${data.id}/incidents/`))

export const eventH2h = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<H2H>(`/events/${data.id}/h2h/`))

export const eventOdds = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) =>
    bsdGet<{ event_id: number; odds: Record<string, number | null> }>(`/events/${data.id}/odds/`),
  )

export const eventOddsComparison = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) =>
    bsdGet<ComparisonResponse>(`/events/${data.id}/odds/comparison/`),
  )

export const eventPolymarket = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<PolymarketResponse>(`/events/${data.id}/polymarket/`))

export const eventPrediction = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Prediction>(`/events/${data.id}/prediction/`))

export const eventMetadata = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Record<string, unknown>>(`/events/${data.id}/metadata/`))

export const eventBroadcasts = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number }) => data)
  .handler(async ({ data }) => {
    const { id, ...params } = data
    return bsdGet<Page<Broadcast>>(`/events/${id}/broadcasts/`, params)
  })

export const eventSocial = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number }) => data)
  .handler(async ({ data }) => {
    const { id, ...params } = data
    return bsdGet<Page<SocialPost>>(`/events/${id}/social/`, params)
  })

// ---- Odds ----

export const oddsFeed = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<OddsRow>>('/odds/', data))

export const oddsBest = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<OddsRow>>('/odds/best/', data))

export const bookmakers = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Bookmaker>>('/bookmakers/', data))

// ---- Predictions ----

export const listPredictions = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Prediction>>('/predictions/', data))

export const predictionDetail = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Prediction>(`/predictions/${data.id}/`))

// ---- Teams ----

export const listTeams = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<TeamProfile>>('/teams/', data))

export const teamDetail = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<TeamProfile>(`/teams/${data.id}/`))

export const teamSquad = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<SquadResponse>(`/teams/${data.id}/squad/`))

export const teamFixtures = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number }) => data)
  .handler(async ({ data }) => {
    const { id, ...params } = data
    return bsdGet<Page<EventSummary>>(`/teams/${id}/fixtures/`, params)
  })

export const teamSocial = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number }) => data)
  .handler(async ({ data }) => {
    const { id, ...params } = data
    return bsdGet<Page<SocialPost>>(`/teams/${id}/social/`, params)
  })

// ---- Players ----

export const listPlayers = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<PlayerProfile>>('/players/', data))

export const playerDetail = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<PlayerProfile>(`/players/${data.id}/`))

export const playerStats = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number }) => data)
  .handler(async ({ data }) => {
    const { id, ...params } = data
    return bsdGet<Page<Record<string, unknown>>>(`/players/${id}/stats/`, params)
  })

export const playerTransfers = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) =>
    bsdGet<{ player_id: number; count: number; transfers: Transfer[] }>(
      `/players/${data.id}/transfers/`,
    ),
  )

export const playerCareer = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<unknown[]>(`/players/${data.id}/career/`))

export const playerNationalTeam = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<unknown>(`/players/${data.id}/national-team/`))

// ---- Transfers feed ----

export const listTransfers = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Transfer>>('/transfers/', data))

// ---- People: managers, referees, venues ----

export const listManagers = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Manager>>('/managers/', data))

export const managerDetail = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Manager>(`/managers/${data.id}/`))

export const managerCareer = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<unknown[]>(`/managers/${data.id}/career/`))

export const managerMatches = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number }) => data)
  .handler(async ({ data }) => {
    const { id, ...params } = data
    return bsdGet<Page<EventSummary>>(`/managers/${id}/matches/`, params)
  })

export const listReferees = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Referee>>('/referees/', data))

export const refereeDetail = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Referee>(`/referees/${data.id}/`))

export const refereeMatches = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams & { id: number }) => data)
  .handler(async ({ data }) => {
    const { id, ...params } = data
    return bsdGet<Page<EventSummary>>(`/referees/${id}/matches/`, params)
  })

export const listVenues = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Venue>>('/venues/', data))

export const venueDetail = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<Venue>(`/venues/${data.id}/`))

export const venueCompetitions = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: IdParams) => data)
  .handler(async ({ data }) => bsdGet<unknown[]>(`/venues/${data.id}/competitions/`))

// ---- Media: TV, broadcasts, social ----

export const listTvChannels = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<TvChannel>>('/tv-channels/', data))

export const listBroadcasts = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<Broadcast>>('/broadcasts/', data))

export const listSocial = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<SocialPost>>('/social/', data))

// ---- World Cup ----

export const worldcupSquads = createServerFn({ method: 'POST', strict: { output: false } })
  .validator((data: BsdParams) => data)
  .handler(async ({ data }) => bsdGet<Page<WorldCupSquad>>('/worldcup/squads/', data))