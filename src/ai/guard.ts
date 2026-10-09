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
}

export function stepLabel(label: string, lang: AiLang) {
  if (lang === 'taglish') return label
  if (LABEL_EN[label]) return LABEL_EN[label]
  return label.replace(/^I-divide sa/, 'Divide by').replace(/^I-multiply sa/, 'Multiply by')
}

/** Deterministic, always-correct explanation built from the calculator steps */
export function templateExplain(calc: CalcResult, lang: AiLang): string {
  const steps = calc.steps.filter((s) => s.label !== 'Ibinigay' && s.label !== 'Sagot')
  const tl = lang === 'taglish'
  if (steps.length === 0) {
    return tl ? `Diretso lang ito: $${calc.input} = ${calc.answer}$. Na-check na ng calculator, kaya sigurado tayo!` : `This one is direct: $${calc.input} = ${calc.answer}$. The calculator verified it!`
  }
  const lead = tl ? ['Una,', 'Tapos,', 'Sunod,', 'Pagkatapos,', 'Saka,'] : ['First,', 'Then,', 'Next,', 'After that,', 'Then,']
  const lines = steps.map((s, i) => `${lead[Math.min(i, lead.length - 1)]} ${stepLabel(s.label, lang).toLowerCase()}: $${s.tex}$.`)
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
