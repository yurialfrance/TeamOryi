import { ComputeEngine } from '@cortex-js/compute-engine'
import type { InputQuestion, Question, TilesQuestion } from './types'
import { gcd } from './rand'

const ce = new ComputeEngine()

export type Verdict = 'correct' | 'wrong' | 'notSimplest' | 'empty'

/** Clean up what a learner typed so equivalent answers compare equal */
export function normalize(latex: string): string {
  let s = latex.trim()
  s = s.replace(/\\placeholder\{[^}]*\}/g, '')
  s = s.replace(/\\(?:,|;|:|!|quad|qquad)/g, '') // spacing
  s = s.replace(/\\(?:text|mathrm)\{₱\}|₱|\\text\{P\}/g, '')
  s = s.replace(/\\left|\\right/g, '')
  s = s.replace(/(\d)\{,\}(\d{3})/g, '$1$2') // MathLive thousands {,}
  s = s.replace(/(\d),(\d{3})(?!\d)/g, '$1$2') // 1,000 → 1000
  s = s.replace(/\\%|%/g, '')
  s = s.replace(/\\times/g, '\\cdot')
  s = s.replace(/\s+/g, '')
  return s
}

/** Drop a leading "x=" / "n=" so "x=5" and "5" both work */
function stripLhs(s: string): string {
  const m = s.match(/^([a-zA-Z](?:_\{?[a-zA-Z0-9]+\}?)?)=(.+)$/)
  return m ? m[2] : s
}

function num(expr: NonNullable<ReturnType<typeof ce.parse>>): number | null {
  try {
    const v = expr.N().re
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

function equivalent(a: string, b: string, tol: number): boolean {
  const A = ce.parse(a)
  const B = ce.parse(b)
  if (!A || !B || !A.isValid || !B.isValid) return false
  const vars = [...new Set([...(A.unknowns ?? []), ...(B.unknowns ?? [])])]
  if (vars.length === 0) {
    const x = num(A)
    const y = num(B)
    if (x === null || y === null) return false
    return Math.abs(x - y) <= Math.max(tol, 1e-9 * Math.max(1, Math.abs(y)))
  }
  // Symbolic: compare at several random points
  const samples = [0.37, 1.91, -2.43, 3.17]
  for (const t of samples) {
    const sub: Record<string, number> = {}
    vars.forEach((v, i) => (sub[v] = t + i * 0.731))
    const x = num(A.subs(sub))
    const y = num(B.subs(sub))
    if (x === null || y === null) return false
    if (Math.abs(x - y) > 1e-6 * Math.max(1, Math.abs(y))) return false
  }
  return true
}

function isUnsimplifiedFraction(s: string): boolean {
  const m = s.match(/\\frac\{(-?\d+)\}\{(\d+)\}/)
  if (!m) return false
  const n = Number(m[1])
  const d = Number(m[2])
  return gcd(n, d) > 1 || d === 1
}

export function checkInput(q: InputQuestion, typed: string): Verdict {
  const raw = normalize(typed)
  if (!raw) return 'empty'
  const tol = q.tolerance ?? 1e-9
  for (const ans of q.answers) {
    const want = normalize(ans)
    const target = stripLhs(want)
    const got = stripLhs(raw)
    const hasEq = target.includes('=')
    let ok = false
    if (hasEq) {
      // compare both sides separately
      const [gl, gr] = got.split('=')
      const [wl, wr] = target.split('=')
      ok = gr !== undefined && gl === wl && equivalent(gr, wr, tol)
      if (!ok && gr !== undefined) ok = equivalent(`(${gl})-(${gr})`, `(${wl})-(${wr})`, tol)
    } else {
      ok = got === target || equivalent(got, target, tol)
    }
    if (ok) {
      if (q.requireSimplest && isUnsimplifiedFraction(got)) return 'notSimplest'
      return 'correct'
    }
  }
  return 'wrong'
}

export function checkTiles(q: TilesQuestion, seq: string[]): Verdict {
  if (seq.length === 0) return 'empty'
  const s = seq.join('|')
  return q.answerSeq.some((a) => a.join('|') === s) ? 'correct' : 'wrong'
}

export function checkAnswer(q: Question, value: unknown): Verdict {
  switch (q.kind) {
    case 'choice':
      return value === null || value === undefined ? 'empty' : value === q.correctIndex ? 'correct' : 'wrong'
    case 'numberline':
      return value === null || value === undefined ? 'empty' : value === q.answerIndex ? 'correct' : 'wrong'
    case 'input':
      return checkInput(q, String(value ?? ''))
    case 'tiles':
      return checkTiles(q, (value as string[]) ?? [])
  }
}
