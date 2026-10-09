// Deterministic math engine for the tutor. The CODE computes; the AI only explains.
import { ComputeEngine } from '@cortex-js/compute-engine'

const ce = new ComputeEngine()
type Expr = NonNullable<ReturnType<typeof ce.parse>>

export interface CalcStep { label: string; tex: string }
export interface CalcResult {
  kind: 'evaluate' | 'simplify' | 'solve' | 'error'
  input: string
  steps: CalcStep[]
  answer: string // LaTeX
  plain: string // plain-text answer for the AI prompt
}

const clean = (tex: string) => tex.replace(/\\,/g, '').replace(/\\overline\{(\d+)\}/g, '$1$1$1…')

/** Number → nice LaTeX (integer, small fraction, or rounded decimal) */
export function numTex(n: number): string {
  if (!Number.isFinite(n)) return '\\text{undefined}'
  if (Math.abs(n - Math.round(n)) < 1e-10) return String(Math.round(n))
  for (let d = 2; d <= 100; d++) {
    const k = n * d
    if (Math.abs(k - Math.round(k)) < 1e-9) {
      const num = Math.round(k)
      return num < 0 ? `-\\frac{${-num}}{${d}}` : `\\frac{${num}}{${d}}`
    }
  }
  return String(Number(n.toPrecision(8)))
}

/** Polynomial term with sign handling: term(-1,'x',false) → "- x" */
function term(a: number, v: string, first: boolean): string {
  if (Math.abs(a) < 1e-12) return ''
  const abs = Math.abs(a)
  const coef = v && Math.abs(abs - 1) < 1e-12 ? '' : numTex(abs)
  const sign = a < 0 ? (first ? '-' : ' - ') : first ? '' : ' + '
  return `${sign}${coef}${v}`
}
const poly = (terms: [number, string][]) => {
  let out = ''
  for (const [a, v] of terms) out += term(a, v, out === '')
  return out || '0'
}

const dec = (n: number) => String(Number(n.toPrecision(8)))

function valueAt(f: Expr, v: string, x: number): number {
  const r = f.subs({ [v]: x }).N().re
  return typeof r === 'number' ? r : NaN
}

/** Pull a math expression out of a plain-text message, e.g. "solve 2x+3=11" or "25% ng 80" */
export function extractMath(text: string): string | null {
  let t = text.replace(/(\d+(?:\.\d+)?)\s*%\s*(?:ng|of)\s*(\d+(?:\.\d+)?)/gi, '$1\\% \\cdot $2')
  t = t.replace(/√\s*\(?(\d+(?:\.\d+)?)\)?/g, '\\sqrt{$1}')
  const parts = t.match(/(?:\\%|\\cdot|\\sqrt\{[\d.]+\}|[\d.]+|\b[xyn]\b|(?<=\d)[xyn]|[+\-*/^()=×÷ ])+/g) ?? []
  const best = parts
    .map((p) => p.trim())
    .filter((p) => /\d/.test(p) && /[+\-*/^=×÷%]|\\cdot|\\sqrt/.test(p) && p.length >= 3)
    .sort((a, b) => b.length - a.length)[0]
  if (!best) return null
  return best.replace(/\*/g, '\\cdot ').replace(/×/g, '\\times ').replace(/÷/g, '\\div ')
}

export function solveLatex(latex: string): CalcResult {
  const input = latex.trim()
  const fail = (msg: string): CalcResult => ({ kind: 'error', input, steps: [], answer: `\\text{${msg}}`, plain: msg })
  try {
    const expr = ce.parse(input)
    if (!expr || !expr.isValid) return fail('Kulang o mali ang expression')
    const unknowns = expr.unknowns

    // ---- Equation ----
    if (input.includes('=') && expr.operator === 'Equal') {
      if (unknowns.length !== 1) return fail('Isang variable lang ang kaya kong i-solve')
      const v = unknowns[0]
      const [lhs, rhs] = (expr as unknown as { ops: Expr[] }).ops
      const f = ce.box(['Subtract', lhs.json, rhs.json]).simplify() as Expr
      const f0 = valueAt(f, v, 0), f1 = valueAt(f, v, 1), fm = valueAt(f, v, -1), f2 = valueAt(f, v, 2), f3 = valueAt(f, v, 3)
      const c = f0
      const a2 = (f1 + fm) / 2 - c
      const b1 = (f1 - fm) / 2
      const isPoly2 = [2, 3].every((x, i) => Math.abs(a2 * x * x + b1 * x + c - [f2, f3][i]) < 1e-7)
      const sols = (expr.solve(v) as unknown as Expr[] | null) ?? []
      const solTex = sols.map((s) => clean(s.latex))
      const steps: CalcStep[] = [{ label: 'Ibinigay', tex: input }]

      if (isPoly2 && Math.abs(a2) < 1e-12 && Math.abs(b1) > 1e-12) {
        // linear: b1·v + c = 0
        steps.push({ label: 'Pagsamahin ang like terms', tex: `${poly([[b1, v], [c, '']])} = 0` })
        steps.push({ label: 'Ilipat ang constant sa kanan', tex: `${poly([[b1, v]])} = ${numTex(-c)}` })
        const inv = 1 / b1
        if (Math.abs(b1 - 1) > 1e-12) {
          if (Math.abs(inv - Math.round(inv)) < 1e-9 && Math.abs(inv) > 1)
            steps.push({ label: `I-multiply sa ${Math.round(inv)}`, tex: `${v} = ${numTex(-c)} \\cdot ${Math.round(inv)}` })
          else steps.push({ label: `I-divide sa ${numTex(b1).replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2')}`, tex: `${v} = \\frac{${numTex(-c)}}{${numTex(b1)}}` })
        }
        const ans = `${v} = ${numTex(-c / b1)}`
        steps.push({ label: 'Sagot', tex: ans })
        return { kind: 'solve', input, steps, answer: ans, plain: ans.replace(/\\frac\{(-?\d+)\}\{(\d+)\}/g, '$1/$2') }
      }
      if (isPoly2 && Math.abs(a2) > 1e-12) {
        const D = b1 * b1 - 4 * a2 * c
        steps.push({ label: 'Standard form', tex: `${poly([[a2, `${v}^2`], [b1, v], [c, '']])} = 0` })
        steps.push({ label: 'Mga coefficient', tex: `a = ${numTex(a2)},\\; b = ${numTex(b1)},\\; c = ${numTex(c)}` })
        steps.push({ label: 'Discriminant', tex: `D = b^2 - 4ac = ${numTex(D)}` })
        if (D < 0) {
          steps.push({ label: 'Sagot', tex: '\\text{Walang real solution (D < 0)}' })
          return { kind: 'solve', input, steps, answer: '\\text{Walang real solution}', plain: 'no real solution (D < 0)' }
        }
        steps.push({ label: 'Quadratic formula', tex: `${v} = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${numTex(-b1)} \\pm \\sqrt{${numTex(D)}}}{${numTex(2 * a2)}}` })
        const ans = solTex.length ? solTex.map((s) => `${v} = ${s}`).join(',\\; ') : `${v} = ${numTex((-b1 + Math.sqrt(D)) / (2 * a2))},\\; ${v} = ${numTex((-b1 - Math.sqrt(D)) / (2 * a2))}`
        steps.push({ label: 'Sagot', tex: ans })
        return { kind: 'solve', input, steps, answer: ans, plain: ans.replace(/\\;/g, ' ') }
      }
      if (!solTex.length) return fail('Hindi ko ma-solve ito')
      const ans = solTex.map((s) => `${v} = ${s}`).join(',\\; ')
      steps.push({ label: 'Sagot', tex: ans })
      return { kind: 'solve', input, steps, answer: ans, plain: ans }
    }

    // ---- Expression with variables ----
    if (unknowns.length > 0) {
      const steps: CalcStep[] = [{ label: 'Ibinigay', tex: input }]
      const simp = clean(expr.simplify().latex)
      let answer = simp
      if (simp !== input) steps.push({ label: 'I-simplify', tex: simp })
      try {
        const ex = clean((ce.box(['Expand', expr.json]).evaluate() as Expr).latex)
        if (ex !== simp && ex !== input) { steps.push({ label: 'I-expand', tex: ex }); answer = ex }
      } catch { /* not expandable */ }
      try {
        const fa = clean((ce.box(['Factor', expr.json]).evaluate() as Expr).latex)
        if (fa !== simp && fa !== answer && fa.includes('(')) steps.push({ label: 'I-factor', tex: fa })
      } catch { /* not factorable */ }
      steps.push({ label: 'Sagot', tex: answer })
      return { kind: 'simplify', input, steps, answer, plain: answer }
    }

    // ---- Pure number ----
    const exact = clean(expr.simplify().latex)
    const n = expr.N().re
    const steps: CalcStep[] = [{ label: 'Ibinigay', tex: input }]
    const decimal = typeof n === 'number' ? dec(n) : null
    const exactIsDecimal = /^-?[\d.]+$/.test(exact)
    let answer = exactIsDecimal && decimal ? decimal : exact
    if (!exactIsDecimal && exact !== input) steps.push({ label: 'Exact na value', tex: exact })
    if (decimal && decimal !== exact && !exactIsDecimal) steps.push({ label: 'Decimal', tex: `\\approx ${decimal}` })
    if (answer === input && decimal) answer = decimal
    steps.push({ label: 'Sagot', tex: answer })
    return { kind: 'evaluate', input, steps, answer, plain: `${answer}${decimal && !exactIsDecimal ? ` (≈ ${decimal})` : ''}` }
  } catch {
    return fail('Hindi ko ma-compute ito')
  }
}

/**
 * Safety net: find simple numeric equalities inside $...$ in the AI's text and fix any wrong result.
 * e.g. "$12 \times 4 = 46$" → "$12 \times 4 = 48$"
 */
export function verifyAiMath(text: string): { text: string; fixed: number } {
  let fixed = 0
  const out = text.replace(/\$([^$]+)\$/g, (m, body: string) => {
    const sides = body.split('=')
    if (sides.length !== 2 || /[a-zA-Z](?<!\\[a-zA-Z]*)/.test(body.replace(/\\[a-zA-Z]+/g, ''))) return m
    try {
      const L = ce.parse(sides[0]).N().re
      const R = ce.parse(sides[1]).N().re
      if (typeof L === 'number' && typeof R === 'number' && Number.isFinite(L) && Math.abs(L - R) > 1e-6 * Math.max(1, Math.abs(L))) {
        fixed++
        return `$${sides[0].trim()} = ${numTex(L)}$`
      }
    } catch { /* ignore */ }
    return m
  })
  return { text: out, fixed }
}
