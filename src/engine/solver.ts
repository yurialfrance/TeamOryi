// Deterministic math engine for the tutor. The CODE computes; the AI only explains.
import { ce, clean, type Expr } from './ce'
import { solveCalculus } from './calculus'
import { compileReal } from './realfn'
import { makeGraph, type GraphSpec } from './graph'

export type { GraphPoint, GraphSpec } from './graph'

export interface CalcStep { label: string; tex: string }

export interface CalcResult {
  kind: 'evaluate' | 'simplify' | 'solve' | 'derivative' | 'integral' | 'limit' | 'error'
  input: string
  steps: CalcStep[]
  answer: string // LaTeX
  plain: string // plain-text answer for the AI prompt
  /** Deterministically sampled from the verified expression (src/engine/graph.ts) — never AI-guessed. */
  graph?: GraphSpec
  /** Equivalent forms of the answer (e.g. factored), shown after it — never a step before it */
  also?: CalcStep[]
  /** What the learner asked for (kept so a re-check recomputes the same thing) */
  intent?: Intent
}

/**
 * Make messy-but-meaningful input parse the way a learner means it. MathLive input, chat
 * messages and pasted text all pass through here. compute-engine follows TeX rules, so
 * e.g. `x^10` would be x¹·0 and a bare `%` starts a comment (25% → 25) — both silently wrong.
 */
export function prepareLatex(latex: string): string {
  let s = latex.trim()
  s = s
    .replace(/[×✕]/g, '\\times ').replace(/÷/g, '\\div ').replace(/[−–—]/g, '-').replace(/[·⋅]/g, '\\cdot ')
    .replace(/²/g, '^{2}').replace(/³/g, '^{3}').replace(/π/g, '\\pi ')
    .replace(/√\s*(\d+(?:\.\d+)?|[a-z])/g, '\\sqrt{$1}')
  s = s.replace(/\\[dt]frac/g, '\\frac').replace(/\\(?:displaystyle|!|,|;|:|quad|qquad)/g, ' ')
  s = s.replace(/\\placeholder\{\}/g, '')
  s = s.replace(/(^|[^\\])%/g, '$1\\%') // bare % is a TeX comment
  s = s.replace(/(\d)\{,\}(\d{3})/g, '$1$2').replace(/(\d),(\d{3})(?!\d)/g, '$1$2') // 1,000
  // x^-2 is invalid TeX, so bracing it is safe. Multi-digit exponents are NOT braced here: MathLive
  // writes ∫₀² 3x² as \int_0^23x^2 (TeX: ^2 then 3x²) — hand-typed text goes through braceTypedExponents.
  s = s.replace(/\^\s*(-\d+(?:\.\d+)?|-[a-zA-Z])/g, '^{$1}')
  s = s.replace(/(\d)\s+[xX]\s+(\d)/g, '$1\\times $2') // "15 x 4" with spaces = times
  s = s.replace(/\*/g, '\\cdot ')
  // worksheet leftovers: "5 + 3 = ?" / "= 8" / trailing operator
  s = s.replace(/=\s*(\?|_+|\\_+|\\square|\\Box)?\s*$/, '').replace(/^\s*=/, '')
  s = s.replace(/(\+|-|\\times|\\div|\\cdot)\s*$/, '')
  // brackets the learner forgot to close (or open): balance ( ) and { }
  for (const [o, c] of [['(', ')'], ['{', '}']] as const) {
    let open = 0, extra = 0
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '\\' && (s[i + 1] === '{' || s[i + 1] === '}')) { i++; continue }
      if (s[i] === o) open++
      else if (s[i] === c) { if (open) open--; else extra++ }
    }
    if (o === '(') s = '('.repeat(extra) + s + ')'.repeat(open)
    else s = s + '}'.repeat(open)
  }
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * For LaTeX a person typed as plain text (chat messages): "x^10" means
 * x to the 10th, not TeX's x¹·0. Never apply this to MathLive output, which is already exact TeX.
 */
export const braceTypedExponents = (s: string) => s.replace(/\^(-?\d+(?:\.\d+)?)/g, '^{$1}')

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

/** Graph of a one-variable expression, or undefined when it isn't something we can plot exactly */
function graphOf(f: Expr, v: string, label: string, roots?: number[]): GraphSpec | undefined {
  try {
    const fn = compileReal(f.json, v)
    if (!fn) return undefined
    const trig = /"(Sin|Cos|Tan|Sec|Csc|Cot)"/.test(JSON.stringify(f.json))
    return makeGraph(fn, { varName: v, label, trig, roots: roots?.filter(Number.isFinite) }) ?? undefined
  } catch {
    return undefined
  }
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
  return braceTypedExponents(best.replace(/\*/g, '\\cdot ').replace(/×/g, '\\times ').replace(/÷/g, '\\div '))
}

/** What the learner asked the calculator to do, from their message ("i-factor mo ito", "expand") */
export type Intent = 'factor' | 'expand' | 'simplify'

export function detectIntent(text: string): Intent | undefined {
  const t = text.toLowerCase()
  if (/\b(i-?)?factor|factori[sz]|\bgcf\b/.test(t)) return 'factor'
  if (/\b(i-?)?expand|palawakin|i-multiply out/.test(t)) return 'expand'
  if (/\b(i-?)?simplif|pasimplehin|pinakasimple/.test(t)) return 'simplify'
  return undefined
}

/** Same LaTeX up to braces/spacing (x^{2} vs x^2) */
const sameTex = (a: string, b: string) => a.replace(/[{}\s]/g, '') === b.replace(/[{}\s]/g, '')

/** What the Tutor runs for a chat turn: the typed math (or math in the text) plus the learner's request */
export function solveChat(typedMath: string, userText: string): CalcResult | undefined {
  const src = typedMath || extractMath(userText) || ''
  if (!src) return undefined
  const intent = detectIntent(userText)
  return { ...solveLatex(src, { intent }), intent }
}

export function solveLatex(latex: string, opts: { intent?: Intent } = {}): CalcResult {
  const input = prepareLatex(latex)
  const fail = (msg: string): CalcResult => ({ kind: 'error', input, steps: [], answer: `\\text{${msg}}`, plain: msg })
  try {
    const expr = ce.parse(input)
    if (!expr || !expr.isValid) return fail('Kulang o mali ang expression')
    const unknowns = expr.unknowns

    // ---- Calculus (derivative / integral / limit) — computed, then numerically re-checked ----
    const calc = solveCalculus(expr, input, fail)
    if (calc) return calc

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
        const result: CalcResult = { kind: 'solve', input, steps, answer: ans, plain: ans.replace(/\\frac\{(-?\d+)\}\{(\d+)\}/g, '$1/$2') }
        result.graph = graphOf(f, v, `f(${v}) = ${poly([[b1, v], [c, '']])}`, [-c / b1])
        return result
      }
      if (isPoly2 && Math.abs(a2) > 1e-12) {
        const D = b1 * b1 - 4 * a2 * c
        steps.push({ label: 'Standard form', tex: `${poly([[a2, `${v}^2`], [b1, v], [c, '']])} = 0` })
        steps.push({ label: 'Mga coefficient', tex: `a = ${numTex(a2)},\\; b = ${numTex(b1)},\\; c = ${numTex(c)}` })
        steps.push({ label: 'Discriminant', tex: `D = b^2 - 4ac = ${numTex(D)}` })
        if (D < 0) {
          steps.push({ label: 'Sagot', tex: '\\text{Walang real solution (D < 0)}' })
          const result: CalcResult = { kind: 'solve', input, steps, answer: '\\text{Walang real solution}', plain: 'no real solution (D < 0)' }
          result.graph = graphOf(f, v, `f(${v}) = ${poly([[a2, `${v}^2`], [b1, v], [c, '']])}`)
          return result
        }
        steps.push({ label: 'Quadratic formula', tex: `${v} = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${numTex(-b1)} \\pm \\sqrt{${numTex(D)}}}{${numTex(2 * a2)}}` })
        const ans = solTex.length ? solTex.map((s) => `${v} = ${s}`).join(',\\; ') : `${v} = ${numTex((-b1 + Math.sqrt(D)) / (2 * a2))},\\; ${v} = ${numTex((-b1 - Math.sqrt(D)) / (2 * a2))}`
        steps.push({ label: 'Sagot', tex: ans })
        const result: CalcResult = { kind: 'solve', input, steps, answer: ans, plain: ans.replace(/\\;/g, ' ') }
        const roots = D === 0 ? [-b1 / (2 * a2)] : [(-b1 + Math.sqrt(D)) / (2 * a2), (-b1 - Math.sqrt(D)) / (2 * a2)]
        result.graph = graphOf(f, v, `f(${v}) = ${poly([[a2, `${v}^2`], [b1, v], [c, '']])}`, roots)
        return result
      }
      if (!solTex.length) return fail('Hindi ko ma-solve ito')
      const ans = solTex.map((s) => `${v} = ${s}`).join(',\\; ')
      steps.push({ label: 'Sagot', tex: ans })
      const result: CalcResult = { kind: 'solve', input, steps, answer: ans, plain: ans }
      const numericRoots = sols.map((s) => s.N().re).filter((r): r is number => typeof r === 'number' && Number.isFinite(r))
      result.graph = graphOf(f, v, `f(${v}) = ${clean(f.latex)}`, numericRoots)
      return result
    }

    // ---- Expression with variables ----
    // The answer is always the result of the LAST step shown before it. Other equivalent forms go in
    // `also` (shown after the answer), never as a step that the answer then contradicts.
    if (unknowns.length > 0) {
      const steps: CalcStep[] = [{ label: 'Ibinigay', tex: input }]
      const simp = clean(expr.simplify().latex)
      if (!sameTex(simp, input)) steps.push({ label: 'I-simplify', tex: simp })
      let expanded: string | null = null
      try {
        const ex = clean((ce.box(['Expand', expr.json]).evaluate() as Expr).latex)
        if (!sameTex(ex, simp) && !sameTex(ex, input)) expanded = ex
      } catch { /* not expandable */ }
      let factored: string | null = null
      try {
        const fa = clean((ce.box(['Factor', expr.json]).evaluate() as Expr).latex)
        if (fa.includes('(') && !sameTex(fa, simp) && !sameTex(fa, expanded ?? '')) factored = fa
      } catch { /* not factorable */ }
      const also: CalcStep[] = []
      let answer: string
      if (opts.intent === 'factor') {
        if (factored) {
          const gcf = factored.match(/^(-?\d+)\(/)?.[1]
          if (gcf) steps.push({ label: 'Hanapin ang common factor (GCF)', tex: `\\text{GCF} = ${gcf}` })
          steps.push({ label: 'I-factor', tex: factored })
          answer = factored
        } else {
          steps.push({ label: 'Hindi na ma-factor', tex: expanded ?? simp })
          answer = expanded ?? simp
        }
        if (expanded && factored) also.push({ label: 'Expanded form', tex: expanded })
      } else {
        if (expanded) steps.push({ label: 'I-expand', tex: expanded })
        answer = expanded ?? simp
        if (factored) also.push({ label: 'Factored form', tex: factored })
      }
      steps.push({ label: 'Sagot', tex: answer })
      const result: CalcResult = { kind: 'simplify', input, steps, answer, plain: answer, also: also.length ? also : undefined }
      if (unknowns.length === 1) result.graph = graphOf(expr, unknowns[0], `f(${unknowns[0]}) = ${input}`)
      return result
    }

    // ---- Pure number ----
    const exact = clean(expr.simplify().latex)
    const n = expr.N().re
    if ((typeof n === 'number' && !Number.isFinite(n)) || /infty|NaN/.test(exact)) return fail('Undefined — bawal mag-divide sa 0')
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
 * Deterministic Math Guardrail ("Code Computes, AI Explains")
 * Extracts and verifies every numerical equation and variable statement written
 * in the AI's response against ground truth computation.
 * If the model hallucinates a wrong number, the deterministic code catches and fixes it.
 */
export function verifyAiMath(
  text: string,
  groundTruth?: string[] | { answer?: string; targetVar?: string }
): { text: string; fixed: number; corrected: string[] } {
  let fixed = 0
  const corrected: string[] = []

  // Extract ground truth targets if provided
  let expectedVarVal: { varName: string; val: string } | null = null
  let expectedAnswer: string | null = null
  if (Array.isArray(groundTruth)) {
    for (const src of groundTruth) {
      const m = src.match(/([a-zA-Z])\s*=\s*(-?\d+(?:\.\d+)?|\\frac\{[^}]+\}\{[^}]+\})/)
      if (m) expectedVarVal = { varName: m[1], val: m[2] }
      else if (/^-?\d+(?:\.\d+)?$/.test(src.trim()) || /\\frac\{/.test(src)) expectedAnswer = src.trim()
    }
  } else if (groundTruth) {
    if (groundTruth.answer) expectedAnswer = groundTruth.answer.trim()
    if (groundTruth.targetVar && groundTruth.answer) {
      expectedVarVal = { varName: groundTruth.targetVar, val: groundTruth.answer.trim() }
    }
  }

  // 1. Verify formulas inside $...$
  let out = text.replace(/\$([^$]+)\$/g, (m, body: string) => {
    const sides = body.split('=')
    if (sides.length !== 2) return m

    const left = sides[0].trim()
    const right = sides[1].trim()

    // Variable check against ground truth: e.g. $x = 6$ when expected is $x = 4$
    const varMatch = left.match(/^([a-zA-Z])$/)
    if (varMatch && expectedVarVal && varMatch[1].toLowerCase() === expectedVarVal.varName.toLowerCase()) {
      if (right !== expectedVarVal.val) {
        fixed++
        corrected.push(`$${left} = ${right}$ → $${left} = ${expectedVarVal.val}$`)
        return `$${left} = ${expectedVarVal.val}$`
      }
      return m
    }

    // Pure numerical expression check: e.g. $12 \times 4 = 46$ or $\frac{1}{2} + \frac{1}{3} = \frac{2}{5}$
    if (/[a-zA-Z](?<!\\[a-zA-Z]*)/.test(body.replace(/\\[a-zA-Z]+/g, ''))) return m
    try {
      const L = ce.parse(left).N().re
      const R = ce.parse(right).N().re
      if (typeof L === 'number' && typeof R === 'number' && Number.isFinite(L) && Math.abs(L - R) > 1e-6 * Math.max(1, Math.abs(L))) {
        fixed++
        const fixedTex = `$${left} = ${numTex(L)}$`
        corrected.push(`${m} → ${fixedTex}`)
        return fixedTex
      }
    } catch { /* ignore */ }
    return m
  })

  // 2. Safety check: if ground truth answer was given and AI asserted a different final answer
  if (expectedAnswer) {
    out = out.replace(/(?:ang sagot ay|sagot:\s*|answer is\s*|kaya\s*|so\s*)\$(-?\d+(?:\.\d+)?)\$/gi, (m, numVal: string) => {
      if (expectedAnswer && numVal !== expectedAnswer && /^-?\d+(?:\.\d+)?$/.test(expectedAnswer)) {
        fixed++
        corrected.push(`${m} → (corrected to $${expectedAnswer}$)`)
        return m.replace(`$${numVal}$`, `$${expectedAnswer}$`)
      }
      return m
    })
  }

  return { text: out, fixed, corrected }
}
