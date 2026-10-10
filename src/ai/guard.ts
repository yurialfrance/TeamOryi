// Guardrails: the CODE decides whether an AI explanation can be shown.
// Small on-device models sometimes copy examples or invent numbers; if that happens we
// replace the reply with a deterministic explanation built from the verified calculator steps.
import type { CalcResult } from '../engine/solver'
import type { AiLang } from './llm'

const nums = (s: string) =>
  (s.replace(/\\frac\{(\d+)\}\{(\d+)\}/g, ' $1 $2 ').match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n)))

/** Is every number and variable the AI used grounded in the verified material? */
export function isGrounded(aiText: string, sources: string[]): boolean {
  const allowed = new Set<string>(['0', '1', '2', '3', '10', '100'])
  for (const src of sources) nums(src).forEach((n) => allowed.add(n))
  const used = nums(aiText)
  if (used.some((n) => !allowed.has(n))) return false
  // variables inside $…$ must exist in the sources
  const vars = new Set((sources.join(' ').replace(/\\[a-zA-Z]+/g, '').match(/[a-zA-Z]/g) ?? []).map((v) => v.toLowerCase()))
  for (const m of aiText.matchAll(/\$([^$]+)\$/g)) {
    const letters = m[1].replace(/\\[a-zA-Z]+/g, '').match(/[a-zA-Z]/g) ?? []
    if (letters.some((l) => !vars.has(l.toLowerCase()))) return false
  }
  if (aiText.trim().length < 8) return false
  return true
}

// ---------------------------------------------------------------- operation check
// isGrounded only checks numbers and letters, so "the integral of 2a² + 2a + 4" passed it: every
// number is right, the OPERATION is invented. The AI may only name operations the calculator did.

const OPERATIONS: Record<string, RegExp> = {
  integral: /integra|antiderivative|\\int\b/i,
  derivative: /derivative|differentiat|i-derive|\\frac\{d\}/i,
  limit: /\blimit|\\lim\b/i,
  factor: /factor/i,
  expand: /expand/i,
  quadratic: /quadratic formula|discriminant/i,
  square: /square root|\\sqrt/i,
}

/** Operations the calculator actually performed, read from its kind, step labels, input and extra forms */
function operationsDone(calc: CalcResult): Set<string> {
  const done = new Set<string>()
  const text = [calc.kind, calc.input, calc.answer, ...calc.steps.flatMap((s) => [s.label, s.tex]), ...(calc.also ?? []).map((s) => s.label)].join(' ')
  for (const [op, re] of Object.entries(OPERATIONS)) if (re.test(text)) done.add(op)
  if (calc.kind === 'integral') done.add('integral')
  if (calc.kind === 'derivative') done.add('derivative')
  if (calc.kind === 'limit') done.add('limit')
  return done
}

/** Operations the AI talks about that the calculator never did (empty = consistent) */
export function foreignOperations(aiText: string, calc: CalcResult): string[] {
  const done = operationsDone(calc)
  return Object.entries(OPERATIONS).filter(([op, re]) => !done.has(op) && re.test(aiText)).map(([op]) => op)
}

// ---------------------------------------------------------------- language check
// Small models drift into English even when asked for Taglish. Taglish keeps English math words
// (factor, term, equation) but its grammar words are Filipino — so we count grammar words only.

const FIL = new Set(('ang ng mga sa si ni ay na nang ito iyan yan iyon yun yung dito diyan natin naten tayo kami mo ko ka kayo siya sila niya nila ' +
  'kasi tapos kaya lang din rin pa po ba diba naman muna para pag kung kapag hindi oo sige galing tama mali una unang pangalawa sunod susunod ' +
  'pagkatapos isang dalawa tatlo ating iyong nating ibig sabihin gamit gawin hanapin kunin ilipat bawat lahat may wala ganito ganyan dahil ' +
  'parehong pareho ulit sagot tingnan alamin makikita nakuha nating natin\'g kailangan').split(' '))
const ENG = new Set(('the is are was were be been to of and in on for with this that these those it its we you your our first then next so because ' +
  'by from each into as an a can will would should do does let lets us here there what which when how all both also step steps get gives means').split(' '))

export function languageCounts(text: string): { fil: number; eng: number } {
  const words = text.replace(/\$[^$]*\$/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').toLowerCase().match(/[a-zñ'-]+/g) ?? []
  let fil = 0, eng = 0
  for (const w of words) { if (FIL.has(w)) fil++; else if (ENG.has(w)) eng++ }
  return { fil, eng }
}

/** Is this text in the selected language? (Too short to judge → true; the final check decides.) */
export function isLanguage(text: string, lang: AiLang): boolean {
  const { fil, eng } = languageCounts(text)
  if (fil + eng < 4) return true
  const filShare = fil / (fil + eng)
  return lang === 'taglish' ? filShare >= 0.35 : filShare <= 0.35
}

// ---------------------------------------------------------------- one verdict for an AI explanation

export interface AiVerdict { ok: boolean; reasons: string[] }

export function checkAiExplanation(aiText: string, opts: { sources: string[]; lang: AiLang; calc?: CalcResult }): AiVerdict {
  const reasons: string[] = []
  if (!isGrounded(aiText, opts.sources)) reasons.push('ungrounded')
  if (opts.calc) for (const op of foreignOperations(aiText, opts.calc)) reasons.push(`operation:${op}`)
  if (!isLanguage(aiText, opts.lang)) reasons.push(`language:${opts.lang}`)
  return { ok: reasons.length === 0, reasons }
}

/**
 * Wraps the streaming callback so rejected text never reaches the screen: nothing is shown until
 * enough words exist to confirm the language, and streaming freezes the moment the text drifts
 * into the other language or names an operation the calculator didn't do.
 */
export function streamGate(lang: AiLang, show: (text: string) => void, calc?: CalcResult) {
  let confirmed = false
  let checked = 0 // complete sentences already checked
  let blocked: string | null = null
  /** a sentence entirely in the other language (judged on its grammar words) */
  const offLanguage = (sentence: string) => {
    const { fil, eng } = languageCounts(sentence)
    return lang === 'taglish' ? fil === 0 && eng >= 3 : eng === 0 && fil >= 3
  }
  return {
    onText(text: string) {
      if (blocked) return
      if (calc) {
        const foreign = foreignOperations(text, calc)
        if (foreign.length) { blocked = `operation:${foreign[0]}`; return }
      }
      if (!confirmed) {
        const { fil, eng } = languageCounts(text)
        if (fil + eng < 6) return // hold back (typing dots stay) until there's enough to judge
        if (!isLanguage(text, lang)) { blocked = `language:${lang}`; return }
        confirmed = true
      }
      // only finished sentences that passed are shown, so an English sentence can't flash on screen
      const parts = text.split(/(?<=[.!?])\s+/)
      const complete = /[.!?]\s*$/.test(text) ? parts : parts.slice(0, -1)
      for (; checked < complete.length; checked++) {
        if (offLanguage(complete[checked])) { blocked = `language:${lang}`; return }
      }
      if (complete.length) show(complete.join(' '))
    },
    get blocked() { return blocked },
  }
}

/**
 * What the Tutor finally shows: the AI's text only if it passed every check; otherwise the
 * deterministic explanation built from the calculator steps (always in the selected language).
 */
export function chooseExplanation(o: {
  aiText: string
  calc: CalcResult
  lang: AiLang
  userText: string
  aiAnswered: boolean
  blocked: string | null
}): { text: string; source: 'ai' | 'verified'; reasons: string[] } {
  const verified = templateExplain(o.calc, o.lang)
  if (!o.aiAnswered) return { text: verified, source: 'verified', reasons: [] }
  const sources = [o.calc.input, o.calc.answer, ...o.calc.steps.map((s) => s.tex), ...(o.calc.also ?? []).map((s) => s.tex), o.userText]
  const v = checkAiExplanation(o.aiText, { sources, lang: o.lang, calc: o.calc })
  const reasons = [...(o.blocked ? [o.blocked] : []), ...v.reasons]
  return reasons.length ? { text: verified, source: 'verified', reasons } : { text: o.aiText, source: 'ai', reasons }
}

const LABEL_EN: Record<string, string> = {
  Ibinigay: 'Given',
  'Pagsamahin ang like terms': 'Combine like terms',
  'Ilipat ang constant sa kanan': 'Move the constant to the right',
  'Exact na value': 'Exact value',
  Decimal: 'Decimal',
  'I-simplify': 'Simplify',
  'I-expand': 'Expand',
  'I-factor': 'Factor',
  'Standard form': 'Standard form',
  'Mga coefficient': 'Coefficients',
  Discriminant: 'Discriminant',
  'Quadratic formula': 'Quadratic formula',
  Sagot: 'Answer',
  // calculus (src/engine/calculus.ts)
  'Sum rule: hatiin bawat term': 'Sum rule: split into terms',
  'I-derive ang bawat term': 'Differentiate each term',
  'Derivative ng variable': 'Derivative of the variable',
  'Derivative ng constant': 'Derivative of a constant',
  'Unang derivative': 'First derivative',
  'I-derive ulit': 'Differentiate again',
  'I-integrate ang bawat term': 'Integrate each term',
  'Idagdag ang constant of integration': 'Add the constant of integration',
  'Integral ng constant': 'Integral of a constant',
  'Hanapin ang antiderivative': 'Find the antiderivative',
  'I-substitute ang limits': 'Substitute the bounds',
  'Tingnan ang left at right': 'Check the left and right sides',
  'Hanapin ang common factor (GCF)': 'Find the common factor (GCF)',
  'Hindi na ma-factor': 'Cannot be factored further',
  'Factored form': 'Factored form',
  'Expanded form': 'Expanded form',
}

export function stepLabel(label: string, lang: AiLang) {
  if (lang === 'taglish') return label
  if (LABEL_EN[label]) return LABEL_EN[label]
  return label
    .replace(/^I-divide sa/, 'Divide by')
    .replace(/^I-multiply sa/, 'Multiply by')
    .replace(/^(Derivative|Integral) ng /, '$1 of ')
    .replace(/^Tingnan habang lumalaki ang (\w+)/, 'Watch as $1 grows')
    .replace(/^Tingnan habang lumiliit ang (\w+)/, 'Watch as $1 → −∞')
}

/** Deterministic, always-correct explanation built from the calculator steps */
export function templateExplain(calc: CalcResult, lang: AiLang): string {
  const steps = calc.steps.filter((s) => s.label !== 'Ibinigay' && s.label !== 'Sagot')
  const tl = lang === 'taglish'
  if (steps.length === 0) {
    return tl ? `Diretso lang ito: $${calc.input} = ${calc.answer}$. Na-check na ng calculator, kaya sigurado tayo!` : `This one is direct: $${calc.input} = ${calc.answer}$. The calculator verified it!`
  }
  const lead = tl ? ['Una,', 'Tapos,', 'Sunod,', 'Pagkatapos,', 'Saka,'] : ['First,', 'Then,', 'Next,', 'After that,', 'Then,']
  // mid-sentence label: lowercase the first letter, but keep names (L'Hôpital, Fundamental Theorem, Simpson)
  const midSentence = (l: string) => (/^(L'H|Fundamental|Numerical integration \(Simpson)/.test(l) ? l : l.charAt(0).toLowerCase() + l.slice(1))
  const lines = steps.map((s, i) => `${lead[Math.min(i, lead.length - 1)]} ${midSentence(stepLabel(s.label, lang))}: $${s.tex}$.`)
  lines.push(tl ? `Kaya ang sagot ay $${calc.answer}$. Galing!` : `So the answer is $${calc.answer}$. Great job!`)
  return lines.join('\n')
}

/** Reply when the learner says the answer is wrong — re-check with code and stand firm kindly */
export function recheckReply(calc: CalcResult, userText: string, lang: AiLang): string {
  const tl = lang === 'taglish'
  const claimed = (userText.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const ansNums = nums(calc.answer).map(Number)
  const wrongClaim = claimed.find((c) => !ansNums.includes(c))
  const head = tl
    ? `Ni-recheck ko ulit gamit ang calculator: $${calc.input}$ → $${calc.answer}$. Tama pa rin ang sagot.`
    : `I re-checked with the calculator: $${calc.input}$ → $${calc.answer}$. The answer is still correct.`
  const claim = wrongClaim !== undefined
    ? tl
      ? `\nKung $${wrongClaim}$ ang nakuha mo, hindi ito tugma. Tingnan natin ang steps sa itaas para makita kung saan nagkaiba.`
      : `\nIf you got $${wrongClaim}$, that doesn't match. Let's look at the steps above to find where it went different.`
    : tl
      ? `\nKung may iba kang nakuha, i-type mo ang sagot mo para ma-check natin kung saan nagkaiba.`
      : `\nIf you got something different, type your answer so we can find where it differs.`
  return head + claim
}

export const DISAGREE = /\b(mali|wrong|hindi\s*tama|di\s*tama|incorrect|not\s*right|sure\s*ka|sigurado\s*ka|are\s*you\s*sure)\b/i
