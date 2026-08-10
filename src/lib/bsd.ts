export type BsdParams = Record<string, string | number | boolean>

export function toParams(
  input: Record<string, string | number | boolean | undefined>,
): BsdParams {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as BsdParams
}

export interface Page<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Season {
  id: number
  name: string
  year: number
  start_date: string
  end_date: string
  is_current: boolean
}

export interface League {
  id: number
  name: string
  country: string
  is_women: boolean
  is_active: boolean
  current_season: Season | null
}

export interface StandingRow {
  position: number
  team_id: number
  team_name: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
  xgf: number
  xga: number
  xgd: number
  xg_games: number
  form: string
  live: boolean
}

export interface Standings {
  league_id: number
  season: Season
  grouped: boolean
  standings: StandingRow[]
  groups?: { name: string; standings: StandingRow[] }[]
}

export interface EventSummary {
  id: number
  league_id: number
  league_name?: string
  season_id?: number
  home_team_id: number
  home_team: string
  away_team_id: number
  away_team: string
  event_date: string
  status: string
  period?: string | null
  current_minute?: number | null
  home_score?: number | null
  away_score?: number | null
  home_score_ht?: number | null
  away_score_ht?: number | null
  penalty_shootout?: unknown
  extra_time_score?: unknown
  round_number?: number
  round_name?: string
  group_name?: string | null
  live_websocket?: boolean
  websocket_plus?: boolean
}

export interface LiveEventsResponse {
  count: number
  events: EventSummary[]
}

export interface EventDetail extends EventSummary {
  home_coach_id: number | null
  away_coach_id: number | null
  referee_id: number | null
  venue_id: number | null
  replaced_by: string | null
  is_local_derby: boolean
  is_neutral_ground: boolean
  travel_distance_km: number | null
  weather: {
    code: string | null
    description: string | null
    wind_speed: number | null
    temperature_c: number | null
  }
  pitch_condition: string | null
  attendance: number | null
  has_xg: boolean
  previous_leg_event_id: number | null
  highlights: unknown[]
}

export interface OddsRow {
  id: number
  event_id: number
  market: string
  outcome: string
  outcome_name: string
  line: number | null
  bookmaker_slug: string
  bookmaker_name: string
  decimal_odds: number | null
  previous_decimal_odds: number | null
  implied_probability: number | null
  movement: string
  is_max_quote: boolean
  updated_at: string
}

export interface ComparisonBookmakerOdds {
  decimal_odds: number
  movement: string
  updated_at: string
}

export interface ComparisonOutcome {
  outcome: string
  line: number | null
  outcome_name: string
  best_odds: number
  best_bookmaker_slug: string
  best_bookmaker_name: string
  bookmakers: Record<string, ComparisonBookmakerOdds>
}

export interface ComparisonResponse {
  event_id: number
  event_date: string
  league_id: number
  league_name: string
  home_team: string
  away_team: string
  bookmakers_count: number
  total_odds: number
  markets: Record<string, Record<string, ComparisonOutcome>>
}

export interface Bookmaker {
  slug: string
  name: string
}

export interface PredictionMarkets {
  match_result?: { prob_home: number; prob_draw: number; prob_away: number; predicted: string }
  expected_goals?: { home: number; away: number }
  over_under?: { prob_over_15?: number; prob_over_25?: number; prob_over_35?: number }
  btts?: { prob_yes: number }
  score?: { most_likely: string }
  draw_no_bet?: { prob_home: number }
  corners?: { prob_over_85?: number; prob_over_95?: number; prob_over_105?: number }
}

export interface Prediction {
  id: number
  created_at: string
  event: {
    id: number
    event_date: string
    status: string
    home_team_id: number
    home_team: string
    away_team_id: number
    away_team: string
    league_id: number
    league_name: string
  }
  markets: PredictionMarkets
  recommendations: Record<string, string | number | boolean>
  model: { confidence: number; version: string }
}

export interface PolymarketResponse {
  event_id: number
  markets: Record<string, Record<string, number>>
  liquidity: Record<string, number> | null
  pricing: Record<string, number> | null
  goalscorers?: unknown
  exact_scores?: unknown
  updated_at: string
}

export interface TeamProfile {
  id: number
  name: string
  short_name?: string
  country_code?: string
  venue_id?: number | null
  coach_id?: number | null
  colors?: string
  season_id?: number
  logo?: string
}

export interface SquadPlayerRaw {
  id: number
  name: string
  short_name: string
  position: string
  jersey_number: number
  nationality: string
  date_of_birth: string | null
}

export interface SquadResponse {
  team_id: number
  count: number
  players: SquadPlayerRaw[]
}

export interface LeagueLeaderboard {
  league_id: number
  season: Season
  stat: string
  label: string
  leaders: Record<string, unknown>[]
}

export interface SquadPlayer {
  player_id: number
  player_name: string
  position: string
  number?: number
  captain?: boolean
  ai_score?: number
}

export interface PlayerProfile {
  id: number
  name: string
  full_name?: string
  nationality_code?: string
  date_of_birth?: string
  position?: string
  team_id?: number | null
  team_name?: string
  market_value?: number
  image?: string
}

export interface Transfer {
  id: number
  player: { id: number; name: string }
  from_team_id: number
  from_team_name?: string
  to_team_id: number
  to_team_name?: string
  fee_eur?: number
  fee_description?: string
  transfer_type?: number
  transfer_date: string
  season_id?: number
}

export interface Incident {
  id: number
  minute: number
  period_second?: number
  type: string
  team_id: number | null
  player_id: number | null
  player_name?: string
  assist_player_id?: number | null
  assist_player_name?: string
  rescinded?: boolean
  score_home?: number
  score_away?: number
}

export interface MatchLineup {
  event_id?: number
  lineup_status?: string
  home: { team_id?: number; formation?: string; players: SquadPlayer[] }
  away: { team_id?: number; formation?: string; players: SquadPlayer[] }
}

export interface H2H {
  event_id?: number
  home_team_id?: number
  away_team_id?: number
  total_matches?: number
  home_wins?: number
  draws?: number
  away_wins?: number
  home_goals?: number
  away_goals?: number
  meetings?: {
    id: number
    event_date: string
    league_name?: string
    home_team: string
    away_team: string
    home_score: number | null
    away_score: number | null
  }[]
}

export interface Manager {
  id: number
  name: string
  nationality_code?: string | null
  team_id?: number | null
  team_name?: string
  preferred_formation?: string
  tactical_profile?: string | null
  team_style?: string | null
  matches_managed?: number
}

export interface Referee {
  id: number
  name: string
  country_code?: string | null
  matches_officiated?: number
  yellow_cards_avg?: number
  red_cards_avg?: number
}

export interface Venue {
  id: number
  name: string
  country_code?: string | null
  city?: string | null
  capacity?: number | null
  team_id?: number | null
  coordinates?: { lat?: number; lon?: number }
}

export interface TvChannel {
  id: number
  name: string
  country_code?: string | null
}

export interface Broadcast {
  id: number
  event_id: number
  channel_id: number
  channel_name?: string
  country_code?: string
  event_date?: string
  home_team?: string
  away_team?: string
}

export interface SocialPost {
  id: number
  type: string
  author?: string
  text?: string
  url?: string
  published_at?: string
  team_id?: number | null
  event_id?: number | null
  player_id?: number | null
  manager_id?: number | null
  account_verified?: boolean
}

export interface WorldCupSquad {
  team_id: number
  team_name?: string
  group?: string
  status?: string
  players?: unknown[]
}