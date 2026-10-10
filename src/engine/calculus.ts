// Calculus for the tutor: derivatives, integrals, limits. Same rule as the rest of the engine —
// compute-engine computes symbolically, then plain numeric code RE-CHECKS the result before it may
// be shown (finite differences for derivatives and antiderivatives, Simpson's rule for definite
// integrals, one-sided approach for limits). The AI only ever explains these verified steps.
import { ce, clean, type Expr } from './ce'
import { compileReal, type RealFn } from './realfn'
import { makeGraph, type GraphSpec } from './graph'
import type { CalcResult, CalcStep } from './solver'

type J = unknown
const isArr = (j: J): j is unknown[] => Array.isArray(j)
const op = (j: J) => (isArr(j) && typeof j[0] === 'string' ? j[0] : null)
const hasOp = (j: J, names: string[]): boolean => isArr(j) && (names.includes(op(j) ?? '') || j.some((x) => hasOp(x, names)))
const tex = (j: J) => clean(ce.box(j as never).latex)
const isConst = (j: J, v: string) => !JSON.stringify(j).includes(`"${v}"`)
const TRIG = /"(Sin|Cos|Tan|Sec|Csc|Cot)"/

/** Add terms written separately: "a + -b" → "a - b", zero terms dropped */
const joinTerms = (ts: string[]) => (ts.filter((t) => t.trim() !== '0').join(' + ') || '0').replace(/\+\s*-/g, '- ')
/** compute-engine wraps some bodies as ["Function", ["Block", body], x] — get the body itself */
const unwrap = (j: J): J => (isArr(j) && (j[0] === 'Function' || (j[0] === 'Block' && j.length === 2)) ? unwrap(j[1]) : j)
/** Number → LaTeX without JS exponent notation (1e-7 → 1 \times 10^{-7}) */
function numLatex(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? '\\infty' : '-\\infty'
  const s = String(Number(n.toPrecision(6)))
  const m = s.match(/^(-?[\d.]+)e([+-]\d+)$/)
  return m ? `${m[1]} \\times 10^{${Number(m[2])}}` : s
}

function num(j: J): number {
  const r = ce.box(j as never).N().re
  return typeof r === 'number' ? r : NaN
}

/** Pretty value: exact LaTeX, plus a decimal when the exact form isn't already a plain number */
function valueTex(e: Expr): { exact: string; decimal: string | null; n: number } {
  const exact = clean(e.latex)
  const n = typeof e.N().re === 'number' ? (e.N().re as number) : NaN
  const decimal = Number.isFinite(n) && !/^-?\d+(\.\d+)?$/.test(exact) ? String(Number(n.toPrecision(8))) : null
  return { exact, decimal, n }
}

const TEST_X = [0.7, 1.3, 2.1, -0.6, -1.7, 3.3, 0.25, 4.6]
const close = (a: number, b: number, tol = 1e-3) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))

/** Numeric derivative (central differences) — the independent re-check */
function numDeriv(f: RealFn, x: number, order: number): number {
  const h = order === 1 ? 1e-5 * Math.max(1, Math.abs(x)) : 1e-3 * Math.max(1, Math.abs(x))
  return order === 1 ? (f(x + h) - f(x - h)) / (2 * h) : (f(x + h) - 2 * f(x) + f(x - h)) / (h * h)
}

/** true / false when checked; null when too few points were defined to check */
function derivMatches(f: RealFn, df: RealFn, order: number): boolean | null {
  let checked = 0
  for (const x of TEST_X) {
    const want = df(x), got = numDeriv(f, x, order)
    if (!Number.isFinite(want) || !Number.isFinite(got) || Math.abs(want) > 1e6) continue
    if (!close(got, want, order === 1 ? 1e-4 : 1e-2)) return false
    checked++
  }
  return checked >= 2 ? true : null
}

/** Composite Simpson's rule; NaN if the integrand is undefined anywhere on [a, b] */
function simpson(f: RealFn, a: number, b: number, n = 2000): number {
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return Number.isFinite(s) ? (s * h) / 3 : NaN
}

function graphFor(main: J, v: string, label: string, ghost?: { json: J; label: string }): GraphSpec | undefined {
  const f = compileReal(main, v)
  if (!f) return undefined
  const g = ghost ? compileReal(ghost.json, v) : null
  return makeGraph(f, { varName: v, label, trig: TRIG.test(JSON.stringify([main, ghost?.json ?? null])), ghost: g && ghost ? { f: g, label: ghost.label } : undefined }) ?? undefined
}

// ---------------------------------------------------------------- derivative rules (for the steps)

/** Plain-text names for step labels (labels are text, not LaTeX) */
const FN_NAME: Record<string, string> = { Sin: 'sin x', Cos: 'cos x', Tan: 'tan x', Ln: 'ln x', Sqrt: '√x' }

function derivRule(body: J, v: string): CalcStep | null {
  const d = `\\frac{d}{d${v}}`
  const o = op(body)
  if (body === v) return { label: 'Derivative ng variable', tex: `${d}${v} = 1` }
  if (isConst(body, v)) return { label: 'Derivative ng constant', tex: `${d}\\,c = 0` }
  if (!isArr(body)) return null
  const args = body.slice(1)
  if (o === 'Power' && args[0] === v && isConst(args[1], v)) return { label: 'Power rule', tex: `${d}${v}^{n} = n${v}^{n-1}` }
  if (o === 'Power' && args[0] === 'ExponentialE' && args[1] === v) return { label: 'Derivative ng eˣ', tex: `${d}e^{${v}} = e^{${v}}` }
  if (o === 'Multiply' && args.some((a) => isConst(a, v))) return { label: 'Constant multiple rule', tex: `${d}\\left[c\\,f(${v})\\right] = c\\,f'(${v})` }
  if (o === 'Multiply') return { label: 'Product rule', tex: `(fg)' = f'g + fg'` }
  if (o === 'Divide') return { label: 'Quotient rule', tex: `\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}` }
  const simple: Record<string, string> = { Sin: `\\cos ${v}`, Cos: `-\\sin ${v}`, Tan: `\\sec^2 ${v}`, Ln: `\\frac{1}{${v}}`, Sqrt: `\\frac{1}{2\\sqrt{${v}}}` }
  if (o && simple[o] && args[0] === v) return { label: `Derivative ng ${FN_NAME[o]}`, tex: `${d}${tex(body)} = ${simple[o]}` }
  return { label: 'Chain rule', tex: `${d}f(g(${v})) = f'(g(${v}))\\,g'(${v})` }
}

function integralRule(body: J, v: string): CalcStep | null {
  const o = op(body)
  const dx = `\\,d${v}`
  if (isConst(body, v)) return { label: 'Integral ng constant', tex: `\\int k${dx} = k${v} + C` }
  if (body === v || (o === 'Power' && isArr(body) && body[1] === v && isConst(body[2], v)))
    return { label: 'Power rule (integral)', tex: `\\int ${v}^{n}${dx} = \\frac{${v}^{n+1}}{n+1} + C,\\; n \\ne -1` }
  if (o === 'Divide' && isArr(body) && body[1] === 1 && body[2] === v) return { label: 'Integral ng 1/x', tex: `\\int \\frac{1}{${v}}${dx} = \\ln|${v}| + C` }
  if (o === 'Multiply' && isArr(body) && body.slice(1).some((a) => isConst(a, v))) return { label: 'Constant multiple rule', tex: `\\int k\\,f(${v})${dx} = k\\int f(${v})${dx}` }
  const simple: Record<string, string> = { Sin: `-\\cos ${v}`, Cos: `\\sin ${v}` }
  if (o && simple[o] && isArr(body) && body[1] === v) return { label: `Integral ng ${FN_NAME[o]}`, tex: `\\int ${tex(body)}${dx} = ${simple[o]} + C` }
  if (o === 'Power' && isArr(body) && body[1] === 'ExponentialE' && body[2] === v) return { label: 'Integral ng eˣ', tex: `\\int e^{${v}}${dx} = e^{${v}} + C` }
  return null
}

const termsOf = (body: J): J[] => (op(body) === 'Add' && isArr(body) ? body.slice(1) : [body])

// ---------------------------------------------------------------- solvers

type Fail = (msg: string) => CalcResult

function solveDerivative(expr: Expr, input: string, fail: Fail): CalcResult {
  let node: J = expr.json, order = 0, v: J = null
  while (op(node) === 'D' && isArr(node)) { order++; v = node[2]; node = unwrap(node[1]) }
  if (typeof v !== 'string' || order > 2) return fail('Una o ikalawang derivative lang ang kaya ko')
  const body = node
  const result = expr.evaluate() as Expr
  if (hasOp(result.json, ['D', 'Derivative'])) return fail('Hindi ko ma-compute ang derivative na ito')
  const ans = clean(result.latex)
  const prime = order === 1 ? "f'" : "f''"

  // code re-checks the symbolic derivative with finite differences
  const f = compileReal(body, v), df = compileReal(result.json, v)
  if (f && df && derivMatches(f, df, order) === false) return fail('Hindi tugma ang derivative sa numeric check — hindi ko ito ipapakita')

  const steps: CalcStep[] = [{ label: 'Ibinigay', tex: input }]
  const d = `\\frac{d}{d${v}}`
  if (order === 1) {
    const terms = termsOf(body)
    if (terms.length > 1) {
      steps.push({ label: 'Sum rule: hatiin bawat term', tex: joinTerms(terms.map((t) => `${d}\\left(${tex(t)}\\right)`)) })
      steps.push({ label: 'I-derive ang bawat term', tex: joinTerms(terms.map((t) => clean((ce.box(['D', t, v] as never).evaluate() as Expr).latex))) })
    } else {
      const rule = derivRule(body, v)
      if (rule) steps.push(rule)
    }
  } else {
    const first = clean((ce.box(['D', body, v] as never).evaluate() as Expr).latex)
    steps.push({ label: 'Unang derivative', tex: `f'(${v}) = ${first}` })
    steps.push({ label: 'I-derive ulit', tex: `f''(${v}) = ${d}\\left(${first}\\right)` })
  }
  const answer = `${prime}(${v}) = ${ans}`
  steps.push({ label: 'Sagot', tex: answer })
  return {
    kind: 'derivative', input, steps, answer, plain: answer,
    graph: graphFor(result.json, v, `${prime}(${v}) = ${ans}`, { json: body, label: `f(${v}) = ${tex(body)}` }),
  }
}

function solveIntegral(expr: Expr, input: string, fail: Fail): CalcResult {
  const j = expr.json as unknown as J[]
  const lim = j[2] as J[]
  if (op(lim) !== 'Limits') return fail('Hindi ko maintindihan ang integral na ito')
  // ["Integrate", ["Function", body, x], …] — or just ["Integrate", "x", …] when the body is a bare symbol
  const wrapped = op(j[1]) === 'Function'
  const v = wrapped ? (j[1] as J[])[2] : lim[1]
  if (typeof v !== 'string') return fail('Hindi ko makita ang variable ng integral')
  const body = unwrap(j[1])
  const fn: J = wrapped ? j[1] : ['Function', body, v]
  const [lo, hi] = [lim[2], lim[3]]
  const dx = `\\,d${v}`
  const f = compileReal(body, v)
  const antiJson = (ce.box(['Integrate', fn, ['Limits', v, 'Nothing', 'Nothing']] as never).evaluate() as Expr).json
  const anti = hasOp(antiJson, ['Integrate']) ? null : antiJson
  const steps: CalcStep[] = [{ label: 'Ibinigay', tex: input }]
  const terms = termsOf(body)

  // ---- indefinite
  if (lo === 'Nothing') {
    if (!anti) return fail('Hindi ko pa kayang i-integrate ito')
    const F = compileReal(anti, v)
    // re-check: the derivative of the antiderivative must give back the integrand
    if (f && F && derivMatches(F, f, 1) === false) return fail('Hindi tugma ang integral sa numeric check — hindi ko ito ipapakita')
    if (terms.length > 1) {
      steps.push({ label: 'Sum rule: hatiin bawat term', tex: joinTerms(terms.map((t) => `\\int ${tex(t)}${dx}`)) })
      steps.push({ label: 'I-integrate ang bawat term', tex: joinTerms(terms.map((t) => clean((ce.box(['Integrate', ['Function', t, v], ['Limits', v, 'Nothing', 'Nothing']] as never).evaluate() as Expr).latex))) })
    } else {
      const rule = integralRule(body, v)
      if (rule) steps.push(rule)
    }
    const Ftex = tex(anti)
    steps.push({ label: 'Idagdag ang constant of integration', tex: `${Ftex} + C` })
    const answer = `${Ftex} + C`
    steps.push({ label: 'Sagot', tex: answer })
    return {
      kind: 'integral', input, steps, answer, plain: answer,
      graph: graphFor(anti, v, `F(${v}) = ${Ftex}\\;(C = 0)`, { json: body, label: `f(${v}) = ${tex(body)}` }),
    }
  }

  // ---- definite
  const a = num(lo), b = num(hi)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return fail('Finite na limits lang muna (walang ∞) ang kaya ko')
  // the integrand must be defined on all of [a, b], or the "answer" could be nonsense (∫₋₁¹ 1/x dx)
  const numeric = f ? simpson(f, Math.min(a, b), Math.max(a, b)) * (a <= b ? 1 : -1) : NaN
  if (f && Number.isNaN(numeric)) return fail('Hindi defined ang function sa buong [a, b] — hindi ko ito masasagot nang sigurado')
  const value = expr.evaluate() as Expr
  const exact = hasOp(value.json, ['Integrate']) ? null : valueTex(value)
  if (exact && Number.isFinite(numeric) && !close(exact.n, numeric, 1e-6)) return fail('Hindi tugma ang integral sa numeric check — hindi ko ito ipapakita')
  const aTex = tex(lo), bTex = tex(hi)
  if (anti) {
    const Ftex = tex(anti)
    const at = (bound: J) => clean((ce.box(anti as never).subs({ [v]: ce.box(bound as never) }).evaluate() as Expr).latex)
    steps.push({ label: 'Hanapin ang antiderivative', tex: `F(${v}) = ${Ftex}` })
    steps.push({ label: 'Fundamental Theorem of Calculus', tex: `\\int_{${aTex}}^{${bTex}} f(${v})${dx} = F(${bTex}) - F(${aTex})` })
    steps.push({ label: 'I-substitute ang limits', tex: `= \\left(${at(hi)}\\right) - \\left(${at(lo)}\\right)` })
  } else if (Number.isFinite(numeric)) {
    steps.push({ label: "Numerical integration (Simpson's rule)", tex: `\\approx ${numLatex(numeric)}` })
  } else return fail('Hindi ko ma-compute ang integral na ito')
  const answer = exact ? exact.exact : `\\approx ${numLatex(numeric)}`
  if (exact?.decimal) steps.push({ label: 'Decimal', tex: `\\approx ${exact.decimal}` })
  steps.push({ label: 'Sagot', tex: answer })
  return { kind: 'integral', input, steps, answer, plain: exact?.decimal ? `${answer} (≈ ${exact.decimal})` : answer }
}

/**
 * Where f goes as x approaches a from one side (or ±∞): a number, ±Infinity, or NaN when the
 * values don't settle. Uses shrinking steps and requires the last ones to agree.
 */
function approach(g: RealFn, a: number, side: 1 | -1): number {
  const xs = Number.isFinite(a)
    ? [1e-2, 1e-3, 1e-4, 1e-5, 1e-6].map((h) => a + side * h * Math.max(1, Math.abs(a)))
    : [1e3, 1e4, 1e5, 1e6, 1e7].map((x) => (a > 0 ? x : -x))
  const ys = xs.map((x) => g(x))
  if (ys.some((y) => Number.isNaN(y))) return NaN
  const [, , y2, y3, y4] = ys
  // blowing up: big, same sign, still growing
  if (Math.abs(y4) > 1e4 && Math.sign(y4) === Math.sign(y3) && Math.abs(y4) > Math.abs(y2)) return y4 > 0 ? Infinity : -Infinity
  if (Math.abs(y4 - y3) <= 1e-2 * Math.max(1, Math.abs(y4)) && Math.abs(y3 - y2) <= 1e-1 * Math.max(1, Math.abs(y3))) return y4
  return NaN
}

function solveLimit(expr: Expr, input: string, fail: Fail): CalcResult {
  const j = expr.json as unknown as J[]
  const fn = j[1] as J[]
  const v = isArr(fn) ? fn[2] : null
  if (op(fn) !== 'Function' || typeof v !== 'string') return fail('Hindi ko maintindihan ang limit na ito')
  const body = unwrap(fn[1])
  const pointJ = j[2]
  const a = num(pointJ)
  const g = compileReal(body, v)
  const aTex = tex(pointJ)
  const steps: CalcStep[] = [{ label: 'Ibinigay', tex: input }]

  // numeric approach from each side — computed independently of compute-engine
  const left = g ? approach(g, a, -1) : NaN
  const right = g ? approach(g, a, 1) : NaN

  const value = expr.evaluate() as Expr
  const symbolic = hasOp(value.json, ['Limit']) ? null : valueTex(value)

  // direct substitution first, the way a learner would
  const direct = g && Number.isFinite(a) ? g(a) : NaN
  if (Number.isFinite(direct) && close(left, direct, 1e-3) && close(right, direct, 1e-3)) {
    steps.push({ label: 'Direct substitution', tex: `f(${aTex}) = ${clean((ce.box(body as never).subs({ [v]: ce.box(pointJ as never) }).evaluate() as Expr).latex)}` })
  } else if (Number.isFinite(a) && op(body) === 'Divide' && isArr(body)) {
    const n0 = compileReal(body[1], v)?.(a), d0 = compileReal(body[2], v)?.(a)
    if (n0 !== undefined && d0 !== undefined && Math.abs(n0) < 1e-12 && Math.abs(d0) < 1e-12) {
      steps.push({ label: 'Indeterminate form', tex: `f(${aTex}) = \\frac{0}{0}` })
      const dn = clean((ce.box(['D', body[1], v] as never).evaluate() as Expr).latex)
      const dd = clean((ce.box(['D', body[2], v] as never).evaluate() as Expr).latex)
      steps.push({ label: "L'Hôpital's rule", tex: `\\lim_{${v}\\to ${aTex}} \\frac{${dn}}{${dd}}` })
    } else if (Number.isFinite(d0 ?? NaN) && Math.abs(d0!) < 1e-12) {
      steps.push({ label: 'Tingnan ang left at right', tex: `f(${aTex}^-) \\to ${left > 0 ? '+' : '-'}\\infty,\\; f(${aTex}^+) \\to ${right > 0 ? '+' : '-'}\\infty` })
    }
  } else if (!Number.isFinite(a)) {
    steps.push({ label: a > 0 ? `Tingnan habang lumalaki ang ${v}` : `Tingnan habang lumiliit ang ${v}`, tex: `f(${a > 0 ? '' : '-'}10^{7}) \\approx ${numLatex(left)}` })
  }

  let answer: string
  let plain: string
  if (Number.isNaN(left) || Number.isNaN(right)) {
    // doesn't settle (sin x as x→∞, sin(1/x) at 0) or undefined on a side
    return fail('Hindi ko ma-determine ang limit na ito nang sigurado')
  } else if (Number.isFinite(left) && Number.isFinite(right) && !close(left, right, 1e-2)) {
    answer = '\\text{Walang limit (magkaiba ang left at right)}'
    plain = 'does not exist (left and right limits differ)'
  } else if (!Number.isFinite(left) || !Number.isFinite(right)) {
    if (left === right) { answer = left > 0 ? '\\infty' : '-\\infty'; plain = left > 0 ? 'infinity' : '-infinity' }
    else if (Math.abs(left) === Infinity && Math.abs(right) === Infinity) { answer = '\\text{Walang limit (+∞ sa isang side, −∞ sa kabila)}'; plain = 'does not exist (one side +inf, other -inf)' }
    else return fail('Hindi ko ma-determine ang limit na ito nang sigurado')
  } else if (symbolic && Number.isFinite(symbolic.n)) {
    // code re-checks compute-engine's answer against the numeric approach
    if (!close(symbolic.n, (left + right) / 2, 1e-2)) return fail('Hindi tugma ang limit sa numeric check — hindi ko ito ipapakita')
    answer = symbolic.exact
    plain = symbolic.decimal ? `${answer} (≈ ${symbolic.decimal})` : answer
  } else {
    // numbers alone only tell us roughly where it goes — not good enough to state as the answer
    return fail('Hindi ko ma-compute nang eksakto ang limit na ito')
  }
  steps.push({ label: 'Sagot', tex: answer })
  return { kind: 'limit', input, steps, answer, plain }
}

/** Route calculus input; null when the expression has no calculus in it */
export function solveCalculus(expr: Expr, input: string, fail: Fail): CalcResult | null {
  const j = expr.json
  if (!hasOp(j, ['D', 'Integrate', 'Limit'])) return null
  const top = op(j)
  if (top === 'D') return solveDerivative(expr, input, fail)
  if (top === 'Integrate') return solveIntegral(expr, input, fail)
  if (top === 'Limit') return solveLimit(expr, input, fail)
  return fail('Isang derivative, integral, o limit lang muna bawat tanong')
}
