import { useId } from 'react'
import type { GraphSpec, GraphPoint } from '../engine/solver'
import { Tex } from '../lib/math'
import { Icon } from './Icon'

const W = 320
const H = 200
const PAD = 12

/** Readable grid step (1/2/5 × 10^n) for a span */
function niceStep(span: number, target = 6): number {
  if (span <= 0) return 1
  const raw = span / target
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
}

const fmt = (n: number) => (Math.abs(n) < 1e-9 ? '0' : String(Number(n.toPrecision(3))))

/** k·π/2 as a label: π/2, π, 3π/2, −2π … */
function piLabel(k: number): string {
  if (k === 0) return '0'
  const sign = k < 0 ? '−' : ''
  const a = Math.abs(k)
  if (a % 2 === 0) return `${sign}${a / 2 === 1 ? '' : a / 2}π`
  return `${sign}${a === 1 ? '' : a}π/2`
}

function ticks(lo: number, hi: number, step: number): number[] {
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toFixed(9)))
  return out
}

/**
 * Deterministic function plot. Every point, root and range comes from src/engine/graph.ts
 * (code-sampled from the verified expression) — this component only draws it.
 */
export function GraphView({ graph }: { graph: GraphSpec }) {
  const clip = `graphclip${useId().replace(/[^a-zA-Z0-9_-]/g, '')}` // useId has chars url(#…) can't hold
  const [x0, x1] = graph.xDomain
  const [y0, y1] = graph.yDomain
  const sx = (x: number) => PAD + ((x - x0) / (x1 - x0)) * (W - 2 * PAD)
  const sy = (y: number) => H - PAD - ((y - y0) / (y1 - y0)) * (H - 2 * PAD)

  /** points → path, lifting the pen at every null (undefined / asymptote) */
  const path = (pts: GraphPoint[]) => {
    let d = ''
    let pen = false
    for (const p of pts) {
      if (p.y === null) { pen = false; continue }
      d += `${pen ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`
      pen = true
    }
    return d
  }

  const xTickVals = graph.piTicks ? ticks(x0, x1, Math.PI / 2) : ticks(x0, x1, niceStep(x1 - x0))
  const yTickVals = ticks(y0, y1, niceStep(y1 - y0, 5))
  const xAxisY = y0 <= 0 && y1 >= 0 ? sy(0) : y0 > 0 ? H - PAD : PAD
  const yAxisX = x0 <= 0 && x1 >= 0 ? sx(0) : x0 > 0 ? PAD : W - PAD
  const zeroVisible = y0 <= 0 && y1 >= 0
  const inView = (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1
  const roots = (graph.roots ?? []).filter((r) => zeroVisible && inView(r, 0))
  const yInt = graph.yIntercept != null && inView(0, graph.yIntercept) ? graph.yIntercept : null
  const label = (v: number) => (graph.piTicks ? piLabel(Math.round(v / (Math.PI / 2))) : fmt(v))

  return (
    <div className="rounded-2xl bg-white border-2 border-sky/40 overflow-hidden mb-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-soft text-sky-dark text-[11px] font-black uppercase tracking-wider">
        <Icon name="chartUp" size={18} /> Graph
        <span className="ml-auto flex items-center gap-1 normal-case tracking-normal"><Icon name="shield" size={14} /> code-computed</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block bg-paper" role="img" aria-label={`Graph ng ${graph.label}`}>
        <defs>
          <clipPath id={clip}>
            <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} rx="6" />
          </clipPath>
        </defs>
        <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} rx="6" fill="var(--color-cloud)" />
        {xTickVals.map((v) => (
          <line key={`gx${v}`} x1={sx(v)} y1={PAD} x2={sx(v)} y2={H - PAD} stroke="var(--color-line)" strokeWidth="1" />
        ))}
        {yTickVals.map((v) => (
          <line key={`gy${v}`} x1={PAD} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--color-line)" strokeWidth="1" />
        ))}
        {/* axes (pinned to the edge when 0 is off-screen) */}
        <line x1={PAD} y1={xAxisY} x2={W - PAD} y2={xAxisY} stroke="var(--color-ink-soft)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1={yAxisX} y1={PAD} x2={yAxisX} y2={H - PAD} stroke="var(--color-ink-soft)" strokeWidth="1.8" strokeLinecap="round" />
        {xTickVals.filter((v) => Math.abs(v) > 1e-9).map((v) => (
          <text key={`xt${v}`} x={sx(v)} y={Math.min(H - 3, xAxisY + 11)} fontSize="8" fontWeight={800} fill="var(--color-ink-soft)" textAnchor="middle">
            {label(v)}
          </text>
        ))}
        {yTickVals.filter((v) => Math.abs(v) > 1e-9).map((v) => (
          <text key={`yt${v}`} x={Math.min(W - PAD - 2, yAxisX + 4)} y={sy(v) + 3} fontSize="8" fontWeight={800} fill="var(--color-ink-soft)" textAnchor={yAxisX > W - 40 ? 'end' : 'start'}>
            {fmt(v)}
          </text>
        ))}
        <g clipPath={`url(#${clip})`}>
          {graph.ghost && (
            <path d={path(graph.ghost.points)} fill="none" stroke="var(--color-grape)" strokeOpacity=".55" strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {/* white halo under the curve: the app's chunky, sticker-like line */}
          <path d={path(graph.points)} fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path(graph.points)} fill="none" stroke="var(--color-sky)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          {yInt !== null && <circle cx={sx(0)} cy={sy(yInt)} r="4.2" fill="var(--color-sun)" stroke="#fff" strokeWidth="1.6" />}
          {roots.map((r, i) => (
            <circle key={i} cx={sx(r)} cy={sy(0)} r="4.6" fill="var(--color-heart)" stroke="#fff" strokeWidth="1.6" />
          ))}
        </g>
      </svg>
      <div className="px-3 py-2 space-y-1 text-[12px] font-bold text-ink">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="w-4 h-1 rounded-full bg-sky shrink-0" /> <Tex tex={graph.label} />
        </div>
        {graph.ghost && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-ink-soft">
            <span className="w-4 h-0 border-t-2 border-dashed border-grape shrink-0" /> <Tex tex={graph.ghost.label} />
          </div>
        )}
        {(roots.length > 0 || yInt !== null) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-soft">
            {roots.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-heart" /> x-intercept{roots.length > 1 ? 's' : ''}: {roots.map(fmt).join(', ')}
              </span>
            )}
            {yInt !== null && (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sun" /> y-intercept: (0, {fmt(yInt)})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
