// Deterministic function plots for the tutor — plain code sampling, never AI-generated.
// Pure (no compute-engine), so the node tests check the exact numbers the app draws.
import type { RealFn } from './realfn'

export interface GraphPoint { x: number; y: number | null }
export interface GraphSeries { points: GraphPoint[]; label: string }
export interface GraphSpec {
  varName: string
  /** y = null breaks the line (undefined there, or a jump/asymptote between neighbours) */
  points: GraphPoint[]
  xDomain: [number, number]
  yDomain: [number, number]
  /** x-intercepts to mark — given when solving an equation */
  roots?: number[]
  yIntercept?: number | null
  /** LaTeX caption, e.g. "f(x) = x^2 - 4" */
  label: string
  /** faint companion curve drawn behind (e.g. f(x) behind its derivative) */
  ghost?: GraphSeries
  /** label the x axis in multiples of π/2 (trig) */
  piTicks?: boolean
}

/** f(x), or NaN where it's undefined (huge values are still defined — e^30 is not a domain edge) */
const safe = (f: RealFn, x: number) => { try { const y = f(x); return Number.isFinite(y) ? y : NaN } catch { return NaN } }
const linspace = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))

/** Roots, turning points, y-intercept and edges of the real domain, scanned on [-50, 50] */
export function interestingPoints(f: RealFn): number[] {
  const xs = linspace(-50, 50, 2001)
  const ys = xs.map((x) => safe(f, x))
  const out: number[] = []
  if (!Number.isNaN(ys[1000])) out.push(0) // y-intercept
  const typical = ys.filter((y) => !Number.isNaN(y)).map(Math.abs).sort((a, b) => a - b)
  const small = (typical[Math.floor(typical.length / 2)] ?? 1) || 1
  for (let i = 1; i < xs.length; i++) {
    const a = ys[i - 1], b = ys[i]
    if (Number.isNaN(a) !== Number.isNaN(b)) { out.push(Number.isNaN(a) ? xs[i] : xs[i - 1]); continue } // domain edge
    if (Number.isNaN(a)) continue
    // root: sign change that is a real crossing, not a jump across an asymptote
    if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) if (Math.min(Math.abs(a), Math.abs(b)) < small) out.push(xs[i])
    if (i > 1 && !Number.isNaN(ys[i - 2])) {
      const s1 = a - ys[i - 2], s2 = b - a
      if (s1 * s2 < 0) out.push(xs[i - 1]) // turning point
    }
  }
  return out
}

/** Domain to plot: trig gets [−2π, 2π]; everything else centres on its interesting points */
export function chooseDomain(f: RealFn, trig: boolean, roots: number[] = []): [number, number] {
  if (trig) return [-2 * Math.PI, 2 * Math.PI]
  const pts = [...interestingPoints(f), ...roots].filter((x) => Math.abs(x) <= 50)
  let lo = pts.length ? Math.min(...pts) : -5
  let hi = pts.length ? Math.max(...pts) : 5
  const pad = Math.max((hi - lo) * 0.35, 2)
  lo -= pad
  hi += pad
  if (hi - lo < 10) { const c = (lo + hi) / 2; lo = c - 5; hi = c + 5 }
  // undefined to the left (√x, ln x): start where the function starts, keep the width
  const probe = linspace(lo, hi, 400)
  const firstDefined = probe.find((x) => !Number.isNaN(safe(f, x)))
  if (firstDefined !== undefined && firstDefined > lo + (hi - lo) * 0.02 && probe.slice(0, probe.indexOf(firstDefined)).every((x) => Number.isNaN(safe(f, x)))) {
    const w = hi - lo
    lo = Math.max(lo, firstDefined - w * 0.02)
    if (hi - lo < 10) hi = lo + 10
  }
  return [round(lo), round(hi)]
}
const round = (v: number) => Math.round(v * 1000) / 1000

/** Sample, then add points toward asymptotes / domain edges so the curve runs off-chart properly */
function sample(f: RealFn, [lo, hi]: [number, number], n: number): GraphPoint[] {
  const pts: GraphPoint[] = linspace(lo, hi, n).map((x) => { const y = safe(f, x); return { x, y: Number.isNaN(y) ? null : y } })
  const extra: GraphPoint[] = []
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    if ((a.y === null) === (b.y === null)) continue
    // bisect toward the undefined side
    let good = a.y === null ? b.x : a.x, bad = a.y === null ? a.x : b.x
    for (let k = 0; k < 10; k++) {
      const m = (good + bad) / 2
      const y = safe(f, m)
      if (Number.isNaN(y)) bad = m
      else { extra.push({ x: m, y }); good = m }
    }
  }
  return [...pts, ...extra].sort((p, q) => p.x - q.x)
}

/** Robust y-range: 5th–95th percentile so an asymptote can't flatten the rest of the curve */
function yRange(ys: number[], include: number[]): [number, number] {
  const s = [...ys].sort((a, b) => a - b)
  if (!s.length) return [-5, 5]
  let lo = s[Math.floor(s.length * 0.05)]
  let hi = s[Math.min(s.length - 1, Math.ceil(s.length * 0.95) - 1)]
  const span0 = Math.max(hi - lo, 1e-9)
  for (const v of include) if (v >= lo - span0 * 0.6 && v <= hi + span0 * 0.6) { lo = Math.min(lo, v); hi = Math.max(hi, v) }
  if (hi - lo < 2) { const c = (lo + hi) / 2; lo = c - 1; hi = c + 1 }
  const pad = (hi - lo) * 0.12
  return [round(lo - pad), round(hi + pad)]
}

/**
 * Break the line where neighbours aren't connected by the function: a big jump whose midpoint
 * value isn't between them (tan x at π/2, 1/x at 0) is an asymptote, not a steep slope.
 */
function breakJumps(f: RealFn, pts: GraphPoint[], [y0, y1]: [number, number]): GraphPoint[] {
  const span = y1 - y0
  const out: GraphPoint[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    if (a && a.y !== null && b.y !== null && Math.abs(a.y - b.y) > 0.4 * span) {
      const m = safe(f, (a.x + b.x) / 2)
      const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y)
      if (Number.isNaN(m) || m < lo - 0.05 * span || m > hi + 0.05 * span) out.push({ x: (a.x + b.x) / 2, y: null })
    }
    // keep path coordinates sane; anything this far out is clipped by the view anyway
    out.push(b.y === null ? b : { x: b.x, y: Math.max(y0 - 3 * span, Math.min(y1 + 3 * span, b.y)) })
  }
  return out
}

export interface GraphOptions {
  varName: string
  label: string
  trig: boolean
  roots?: number[]
  ghost?: { f: RealFn; label: string }
  samples?: number
}

/** Build a graph, or null when the function is mostly undefined (not worth a chart) */
export function makeGraph(f: RealFn, o: GraphOptions): GraphSpec | null {
  const n = o.samples ?? 141
  const xDomain = chooseDomain(f, o.trig, o.roots)
  const raw = sample(f, xDomain, n)
  // y-range from the evenly spaced samples only: the extra points crowd toward asymptotes
  const even = linspace(xDomain[0], xDomain[1], n).map((x) => safe(f, x)).filter((y) => !Number.isNaN(y))
  if (even.length < n * 0.25) return null
  const ghostRaw = o.ghost ? sample(o.ghost.f, xDomain, n) : null
  const ghostEven = o.ghost ? linspace(xDomain[0], xDomain[1], n).map((x) => safe(o.ghost!.f, x)).filter((y) => !Number.isNaN(y)) : []
  const y0 = xDomain[0] <= 0 && xDomain[1] >= 0 ? safe(f, 0) : NaN
  const yIntercept = Number.isNaN(y0) ? null : y0
  const roots = o.roots?.filter((r) => r >= xDomain[0] && r <= xDomain[1])
  const yDomain = yRange([...even, ...ghostEven], [0, ...(yIntercept !== null ? [yIntercept] : [])])
  return {
    varName: o.varName,
    label: o.label,
    points: breakJumps(f, raw, yDomain),
    xDomain,
    yDomain,
    roots: roots?.length ? roots : undefined,
    yIntercept,
    ghost: o.ghost && ghostRaw ? { label: o.ghost.label, points: breakJumps(o.ghost.f, ghostRaw, yDomain) } : undefined,
    piTicks: o.trig || undefined,
  }
}
