// Small builders shared by the grade generators: one place for choice shuffling, distractors and
// number formatting, so each generator is just "make the numbers, say it in Taglish".
import type { ChoiceQuestion, Generator, InputQuestion, Visual } from '../engine/types'
import type { TopicId } from '../engine/topics'
import { gcd, ri, shuffle, uid } from '../engine/rand'

/** A generator plus the topic it practises — every Landas stage is built from these */
export interface TaggedGen { topic: TopicId; make: Generator }
export const tag = (topic: TopicId, ...gens: Generator[]): TaggedGen[] => gens.map((make) => ({ topic, make }))

interface Common { latex?: string; visual?: Visual; hints: string[]; solution: string[]; /** overrides the stage's tag for this question */ topic?: TopicId }

/** Typed-answer question. `answer` is LaTeX (or a number); `also` lists other accepted forms. */
export function input(
  prompt: string,
  answer: string | number,
  o: Common & { display?: string; prefix?: string; suffix?: string; tolerance?: number; also?: string[]; simplest?: boolean; placeholder?: string },
): InputQuestion {
  const a = typeof answer === 'number' ? numStr(answer) : answer
  return {
    id: uid(), kind: 'input', prompt, latex: o.latex, visual: o.visual, topic: o.topic,
    answers: [a, ...(o.also ?? [])],
    answerDisplay: o.display ?? `${o.prefix && o.prefix !== '₱' ? `${o.prefix} ` : o.prefix ?? ''}${typeof answer === 'number' ? fmt(answer) : answer}${o.suffix ? ` ${o.suffix}` : ''}`,
    prefix: o.prefix, suffix: o.suffix, tolerance: o.tolerance, requireSimplest: o.simplest, placeholder: o.placeholder,
    hints: o.hints, solution: o.solution,
  }
}

/**
 * Multiple choice. Wrong options are de-duplicated against each other and the answer; at most
 * `max - 1` are kept. `tex: true` renders options as math.
 */
export function choice(
  prompt: string,
  correct: string | number,
  wrong: (string | number)[],
  o: Common & { tex?: boolean; display?: string; keepOrder?: boolean; max?: number },
): ChoiceQuestion {
  const c = String(correct)
  const ws = [...new Set(wrong.map(String))].filter((w) => w !== c).slice(0, (o.max ?? 4) - 1)
  const opts = o.keepOrder ? [c, ...ws] : shuffle([c, ...ws])
  return {
    id: uid(), kind: 'choice', prompt, latex: o.latex, visual: o.visual, topic: o.topic,
    choices: opts.map((x) => (o.tex ? { latex: x } : { text: x })),
    correctIndex: opts.indexOf(c),
    answerDisplay: o.display ?? c,
    hints: o.hints, solution: o.solution,
  }
}

/** Distinct numbers near n (never n itself). Negative values only if allowNeg. */
export function near(n: number, count = 3, spread = 5, allowNeg = false, step = 1): number[] {
  const out = new Set<number>()
  let guard = 0
  while (out.size < count && guard++ < 300) {
    const d = round(n + ri(-spread, spread) * step, 6)
    if (d !== n && (allowNeg || d >= 0)) out.add(d)
  }
  return [...out]
}

export const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp
/** Plain number string for answers (no thousands separators, no float noise) */
export const numStr = (n: number) => String(round(n, 6))
/** Readable number with thousands separators: 12,345.5 */
export const fmt = (n: number) => round(n, 6).toLocaleString('en-PH', { maximumFractionDigits: 6 })
/** Same, for LaTeX (MathLive wants {,}) */
export const tnum = (n: number) => fmt(n).replace(/,/g, '{,}')
export const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`

/** Fraction in lowest terms as LaTeX (whole numbers stay whole; sign in front) */
export function frac(n: number, d: number): string {
  if (d < 0) { n = -n; d = -d }
  const g = gcd(Math.abs(n), d) || 1
  const a = n / g, b = d / g
  if (b === 1) return String(a)
  return `${a < 0 ? '-' : ''}\\frac{${Math.abs(a)}}{${b}}`
}
/** Plain-text fraction for prompts: 3/4 */
export function fracText(n: number, d: number): string {
  const g = gcd(Math.abs(n), Math.abs(d)) || 1
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`
}
/** "+ 3" / "- 3" for building expressions */
export const signed = (n: number) => (n < 0 ? `- ${-n}` : `+ ${n}`)
/** coefficient × variable: 1x → x, -1x → -x */
export const coef = (a: number, v = 'x') => (a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`)
/** (-3) for negatives inside an operation */
export const par = (n: number) => (n < 0 ? `(${n})` : String(n))
