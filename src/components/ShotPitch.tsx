import { useState } from 'react'
import type { Shot } from '@/components/SportsCharts'

interface PlacedShot {
  shot: Shot
  x: number
  y: number
  r: number
  isGoal: boolean
}

const GRASS_A = '#2f8f58'
const GRASS_B = '#2a8552'
const LINE = 'rgba(255,255,255,0.92)'
const HOME_FILL = '#10b981'
const AWAY_FILL = '#e2e8f0'

function placeShot(shot: Shot): PlacedShot {
  // BSD's gm.x is a degenerate field (always 0) — the real shot location is pos,
  // where pos.x is the distance % from the goal being attacked (always < 50).
  // Convention: home attacks the right goal, away the left.
  const source = shot.pos ?? shot.gm
  const pct = Math.min(Math.max(source.x, 0), 100) / 100
  const x = shot.home ? (1 - pct) * 105 : pct * 105
  const y = (Math.min(Math.max(source.y, 0), 100) / 100) * 68
  const r = Math.min(2.6, Math.max(1.1, 1.0 + Math.sqrt(shot.xg) * 1.4))
  return { shot, x, y, r, isGoal: shot.type === 'goal' }
}

function GrassStripes() {
  const stripes = []
  for (let i = 0; i < 10; i++) {
    stripes.push(
      <rect
        key={i}
        x={i * 10.5}
        y={0}
        width={10.5}
        height={68}
        fill={i % 2 === 0 ? GRASS_A : GRASS_B}
      />,
    )
  }
  return <>{stripes}</>
}

function Markings() {
  const line = { stroke: LINE, strokeWidth: 0.35, fill: 'none' }
  return (
    <g {...line}>
      <rect x={0.5} y={0.5} width={104} height={67} />
      <line x1={52.5} y1={0.5} x2={52.5} y2={67.5} />
      <circle cx={52.5} cy={34} r={9.15} />
      <circle cx={52.5} cy={34} r={0.5} fill={LINE} />
      {/* penalty areas */}
      <rect x={0.5} y={13.84} width={16} height={40.32} />
      <rect x={88.5} y={13.84} width={16} height={40.32} />
      {/* goal boxes */}
      <rect x={0.5} y={24.84} width={5} height={18.32} />
      <rect x={99.5} y={24.84} width={5} height={18.32} />
      {/* penalty spots + arcs (bulge into the field) */}
      <circle cx={11} cy={34} r={0.5} fill={LINE} />
      <path d="M 16.5 26.69 A 9.15 9.15 0 0 1 16.5 41.31" />
      <circle cx={94} cy={34} r={0.5} fill={LINE} />
      <path d="M 88.5 26.69 A 9.15 9.15 0 0 0 88.5 41.31" />
      {/* corner arcs */}
      <path d="M 0.5 2 A 1.5 1.5 0 0 1 2 0.5" />
      <path d="M 103 0.5 A 1.5 1.5 0 0 1 104.5 2" />
      <path d="M 104.5 66 A 1.5 1.5 0 0 1 103 67.5" />
      <path d="M 2 67.5 A 1.5 1.5 0 0 1 0.5 66" />
      {/* goals */}
      <line x1={0.5} y1={28.34} x2={-1.2} y2={28.34} />
      <line x1={0.5} y1={39.66} x2={-1.2} y2={39.66} />
      <line x1={-1.2} y1={28.34} x2={-1.2} y2={39.66} />
      <line x1={104.5} y1={28.34} x2={106.2} y2={28.34} />
      <line x1={104.5} y1={39.66} x2={106.2} y2={39.66} />
      <line x1={106.2} y1={28.34} x2={106.2} y2={39.66} />
    </g>
  )
}

export function ShotPitch({ shots }: { shots: Shot[] }) {
  const [active, setActive] = useState<PlacedShot | null>(null)
  const placed = shots.map(placeShot).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))

  if (!placed.length) return null

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: HOME_FILL }} />
          Home
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-900" style={{ background: AWAY_FILL }} />
          Away
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-amber-500" />
          Goal
        </span>
        <span>dot size = xG</span>
      </div>

      <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
        <svg viewBox="-3 -1.5 111 71" className="block w-full">
          <GrassStripes />
          <Markings />
          {placed.map((item, i) => (
            <g
              key={i}
              onMouseEnter={() => setActive(item)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer"
            >
              {item.isGoal && (
                <circle cx={item.x} cy={item.y} r={item.r + 0.8} fill="none" stroke="#f59e0b" strokeWidth={0.55} />
              )}
              <circle
                cx={item.x}
                cy={item.y}
                r={item.r}
                fill={item.shot.home ? HOME_FILL : AWAY_FILL}
                stroke={item.shot.home ? '#064e3b' : '#0f172a'}
                strokeWidth={0.35}
              />
              {item.isGoal && (
                <text
                  x={item.x}
                  y={item.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={1.3}
                  fontWeight={700}
                  fill={item.shot.home ? '#052e16' : '#0f172a'}
                >
                  {item.shot.min}
                </text>
              )}
            </g>
          ))}
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-slate-900/95 px-3 py-1.5 text-xs shadow-xl"
            style={{
              left: `${(active.x / 105) * 100}%`,
              top: `${(active.y / 68) * 100}%`,
            }}
          >
            <p className="font-semibold capitalize">
              {active.shot.type}
              <span className="ml-1.5 font-normal text-muted-foreground">
                {active.shot.min}'{active.shot.added ? `+${active.shot.added}` : ''}
              </span>
            </p>
            <p className="text-muted-foreground">
              xG {active.shot.xg.toFixed(3)}
              {active.shot.body ? ` · ${active.shot.body}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}