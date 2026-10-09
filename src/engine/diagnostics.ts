// On-Device Misconception Diagnostic AI ("Bakit Mali Ako?")
// Symbolically classifies learner mistakes into common pedagogical misconceptions.
// 100% offline, zero external dependencies.

import type { Question } from './types'
import { normalize } from './check'
import { gcd } from './rand'

export type MisconceptionKind =
  | 'pemdas_inverted'
  | 'fraction_denominator_add'
  | 'inverted_fraction'
  | 'sign_reversal'
  | 'exponent_as_multiply'
  | 'decimal_place_error'
  | 'digit_transposition'
  | 'off_by_one'
  | 'pizza_chef_complement'
  | 'not_simplified'
  | 'general_arithmetic'

export interface MisconceptionReport {
  kind: MisconceptionKind
  title: string
  badge: string
  badgeBg: string
  badgeText: string
  taglishSummary: string
  userDid: string
  correctStep: string
  ruleTip: string
  speechText: string
}

function parseNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw !== 'string') return null
  const s = normalize(raw).replace(/,/g, '')
  // Fraction pattern: \frac{a}{b} or a/b
  const fracMatch = s.match(/^\\frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}$/) || s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/)
  if (fracMatch) {
    const n = parseFloat(fracMatch[1])
    const d = parseFloat(fracMatch[2])
    if (d !== 0 && Number.isFinite(n) && Number.isFinite(d)) return n / d
  }
  const clean = s.replace(/[^0-9.\-+]/g, '')
  const val = parseFloat(clean)
  return Number.isFinite(val) ? val : null
}

function parseFraction(raw: unknown): { num: number; den: number } | null {
  if (!raw) return null
  if (typeof raw === 'object' && 'num' in raw && 'den' in raw) {
    const o = raw as { num: number; den: number }
    return { num: o.num, den: o.den }
  }
  if (typeof raw === 'string') {
    const s = normalize(raw)
    const m = s.match(/\\frac\{(-?\d+)\}\{(-?\d+)\}/) || s.match(/^(-?\d+)\/(-?\d+)$/)
    if (m) {
      return { num: parseInt(m[1], 10), den: parseInt(m[2], 10) }
    }
  }
  return null
}

function getCorrectLatexOrText(q: Question): string {
  if (q.kind === 'input') return q.answers[0] ?? q.answerDisplay
  if (q.kind === 'choice') {
    const c = q.choices[q.correctIndex]
    return c?.latex ?? c?.text ?? q.answerDisplay
  }
  if (q.kind === 'pizzaChef') return `\\frac{${q.targetNum}}{${q.targetDen}}`
  return q.answerDisplay
}

function getCorrectNumeric(q: Question): number | null {
  if (q.kind === 'pizzaChef') return q.targetNum / q.targetDen
  if (q.kind === 'numberline') return q.answerIndex
  return parseNumber(q.answerDisplay) ?? (q.kind === 'input' ? parseNumber(q.answers[0]) : null)
}

function getUserDisplay(q: Question, value: unknown): string {
  if (value === null || value === undefined) return '(Walang sagot)'
  if (q.kind === 'choice' && typeof value === 'number') {
    const c = q.choices[value]
    return c?.latex ? `$${c.latex}$` : (c?.text ?? String(value))
  }
  if (q.kind === 'pizzaChef' && typeof value === 'object' && value && 'num' in value) {
    const p = value as { num: number; den: number }
    return `$\\frac{${p.num}}{${p.den}}$`
  }
  if (q.kind === 'tiles' && Array.isArray(value)) {
    return value.join(' ')
  }
  const str = String(value).trim()
  return str.startsWith('\\') || str.includes('^') || str.includes('_') ? `$${str}$` : str
}

/**
 * Symbolically examines the student's erroneous answer and extracts the underlying misconception.
 */
export function diagnoseMisconception(q: Question, userValue: unknown): MisconceptionReport {
  const userNum = parseNumber(userValue)
  const correctNum = getCorrectNumeric(q)
  const correctDisplay = getCorrectLatexOrText(q)
  const userDisplay = getUserDisplay(q, userValue)
  const userFrac = parseFraction(userValue)
  const mathContext = `${q.prompt} ${q.latex ?? ''}`

  // 1. Pizza Chef Complement Error (Counted un-topped slices)
  if (q.kind === 'pizzaChef' && userFrac) {
    const target = q.targetNum
    const den = q.targetDen
    if (userFrac.num === userFrac.den - target && target !== userFrac.num) {
      return {
        kind: 'pizza_chef_complement',
        title: 'Nabilang ang Natira! (Topped vs Natira)',
        badge: '🍕 Baligtad na Bahagi',
        badgeBg: 'bg-orange-soft',
        badgeText: 'text-orange-dark',
        taglishSummary: `Nabilang mo ang natirang walang toppings (${userFrac.num} hiwa) imbes na ang may toppings (${target} hiwa).`,
        userDid: `\\frac{${userFrac.num}}{${userFrac.den}} \\text{ (walang toppings)}`,
        correctStep: `\\frac{${target}}{${den}} \\text{ (may toppings)}`,
        ruleTip: 'Siguraduhing ang binibilang ay ang hinihinging parte sa order ng customer!',
        speechText: `Nabilang mo ang walang toppings na ${userFrac.num} sa ${userFrac.den}, pero ang hinihingi ay ${target} sa ${den}.`,
      }
    }
  }

  // 2. Fraction Denominator Addition Trap: \frac{a}{b} + \frac{c}{d} -> \frac{a+c}{b+d}
  const fracAddMatch = mathContext.match(/\\frac\{(\d+)\}\{(\d+)\}\s*\+\s*\\frac\{(\d+)\}\{(\d+)\}/)
  if (fracAddMatch) {
    const a = parseInt(fracAddMatch[1], 10)
    const b = parseInt(fracAddMatch[2], 10)
    const c = parseInt(fracAddMatch[3], 10)
    const d = parseInt(fracAddMatch[4], 10)
    const trapNum = a + c
    const trapDen = b + d
    const trapValue = trapNum / trapDen

    if (
      (userFrac && userFrac.num === trapNum && userFrac.den === trapDen) ||
      (userNum !== null && Math.abs(userNum - trapValue) < 1e-4)
    ) {
      return {
        kind: 'fraction_denominator_add',
        title: 'Bawal I-add ang Denominator!',
        badge: '🍕 Fraction Trap',
        badgeBg: 'bg-heart-soft',
        badgeText: 'text-heart-dark',
        taglishSummary: `In-add mo ang ilalim: ${b} + ${d} = ${trapDen}. Sa fractions, BAWAL i-add ang ilalim nang diretso!`,
        userDid: `\\frac{${a} + ${c}}{${b} + ${d}} = \\frac{${trapNum}}{${trapDen}}`,
        correctStep: `Hanapin muna ang LCD ng ${b} at ${d}, bago pagsamahin ang itaas.`,
        ruleTip: 'Gintong tuntunin: Parehohin muna ang ilalim (LCD) bago mag-add ng numerators!',
        speechText: `Bawal i-add ang denominator! Parehohin muna ang ilalim gamit ang least common denominator bago i-add ang itaas.`,
      }
    }
  }

  // 3. Exponent as Repeated Multiplication Trap: b^e -> b * e
  const expMatch = mathContext.match(/(\d+)\^\{?(\d+)\}?/)
  if (expMatch && userNum !== null) {
    const base = parseInt(expMatch[1], 10)
    const exp = parseInt(expMatch[2], 10)
    const trapVal = base * exp
    const realVal = Math.pow(base, exp)
    if (userNum === trapVal && realVal !== trapVal) {
      return {
        kind: 'exponent_as_multiply',
        title: 'Hindi Simpleng Multiply ang Exponent!',
        badge: '⚡ Exponent Trap',
        badgeBg: 'bg-sun-soft',
        badgeText: 'text-ink',
        taglishSummary: `Na-multiply mo ang base sa power (${base} × ${exp} = ${trapVal}). Ang exponent ay pag-multiply ng sarili nang ${exp} beses!`,
        userDid: `${base} \\times ${exp} = ${trapVal}`,
        correctStep: `${Array(exp).fill(base).join(' \\times ')} = ${realVal}`,
        ruleTip: `Ang ${base}^${exp} ay nangangahulugang i-multiply ang ${base} sa kanyang sarili nang ${exp} beses.`,
        speechText: `Hindi simpleng multiply ang exponent. Ang ${base} raised to ${exp} ay ${base} times ${base} nang ${exp} beses, kaya ${realVal} ito, hindi ${trapVal}.`,
      }
    }
  }

  // 4. PEMDAS Inversion / Left-to-Right Failure
  // Checks patterns like A + B * C or A - B * C or A + B / C or A - B / C
  const pemdasMatch = mathContext.match(/(\d+)\s*([+-])\s*(\d+)\s*(\\times|\\cdot|\*|\\div|\/)\s*(\d+)/)
  if (pemdasMatch && userNum !== null) {
    const a = parseInt(pemdasMatch[1], 10)
    const op1 = pemdasMatch[2]
    const b = parseInt(pemdasMatch[3], 10)
    const op2Raw = pemdasMatch[4]
    const c = parseInt(pemdasMatch[5], 10)
    const isMult = op2Raw.includes('times') || op2Raw.includes('cdot') || op2Raw === '*'

    const abResult = op1 === '+' ? a + b : a - b
    const trapVal = isMult ? abResult * c : c !== 0 ? abResult / c : null

    if (trapVal !== null && Math.abs(userNum - trapVal) < 1e-4) {
      const op2Symbol = isMult ? '\\times' : '\\div'
      return {
        kind: 'pemdas_inverted',
        title: 'PEMDAS Alert! Unahin ang Multiply/Divide',
        badge: '⚠️ PEMDAS Rule',
        badgeBg: 'bg-flame/15',
        badgeText: 'text-flame',
        taglishSummary: `Inuna mong mag-${op1 === '+' ? 'plus' : 'minus'} (${a} ${op1} ${b}) bago mag-${isMult ? 'multiply' : 'divide'}! Sa PEMDAS, nauuna ang Multiplication & Division.`,
        userDid: `(${a} ${op1} ${b}) ${op2Symbol} ${c} = ${trapVal}`,
        correctStep: `Unahin ang ${b} ${op2Symbol} ${c}, saka i-${op1 === '+' ? 'add' : 'subtract'} kay ${a}.`,
        ruleTip: 'Tandaan ang PEMDAS: Parentheses → Exponents → Multiply/Divide → Add/Subtract!',
        speechText: `Unahin ang multiplication bago addition. Ayon sa PEMDAS, hindi pwedeng mag-add muna mula kaliwa pakanan.`,
      }
    }
  }

  // 5. Inverted Fraction (Reciprocal)
  if (userFrac && q.kind === 'input') {
    const targetFrac = parseFraction(q.answers[0] ?? q.answerDisplay)
    if (targetFrac && userFrac.num === targetFrac.den && userFrac.den === targetFrac.num && userFrac.num !== userFrac.den) {
      return {
        kind: 'inverted_fraction',
        title: 'Nabaligtad ang Fraction! (Reciprocal)',
        badge: '🔄 Inverted',
        badgeBg: 'bg-sky-soft',
        badgeText: 'text-sky-dark',
        taglishSummary: `Nabaligtad ang numerator at denominator! Nasa itaas dapat ang ${targetFrac.num} at nasa ibaba ang ${targetFrac.den}.`,
        userDid: `\\frac{${userFrac.num}}{${userFrac.den}}`,
        correctStep: `\\frac{${targetFrac.num}}{${targetFrac.den}}`,
        ruleTip: 'Numerator = bahagi sa itaas. Denominator = kabuuang bilang sa ibaba.',
        speechText: `Nabaligtad ang fraction. Ang numerator ay ${targetFrac.num} sa itaas, at ang denominator ay ${targetFrac.den} sa ilalim.`,
      }
    }
  }

  // 6. Sign Reversal (Negative vs Positive)
  if (userNum !== null && correctNum !== null && correctNum !== 0 && Math.abs(userNum + correctNum) < 1e-4) {
    const expectedSign = correctNum > 0 ? 'positive (+)' : 'negative (-)'
    return {
      kind: 'sign_reversal',
      title: 'Nalito sa Sign! (+ vs -)',
      badge: '➕➖ Sign Error',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-grape-dark',
      taglishSummary: `Muntik na! Tama ang numero pero ${expectedSign} dapat ang sign ng sagot.`,
      userDid: `${userNum}`,
      correctStep: `${correctNum}`,
      ruleTip: 'Suriin ang sign rules: magkakaibang sign sa multiplication = negative; lumipat sa kabila ng equals = nagpapalit ng sign.',
      speechText: `Muntik na, pero nabaligtad ang sign. Ang tamang sagot ay ${expectedSign}, ${correctNum}.`,
    }
  }

  // 7. Decimal Place Misalignment (Off by 10x or 100x)
  if (userNum !== null && correctNum !== null && correctNum !== 0 && userNum !== 0) {
    const ratio = Math.abs(userNum / correctNum)
    if (Math.abs(ratio - 10) < 1e-3 || Math.abs(ratio - 100) < 1e-3 || Math.abs(ratio - 0.1) < 1e-3 || Math.abs(ratio - 0.01) < 1e-3) {
      return {
        kind: 'decimal_place_error',
        title: 'Decimal Place Alert! (Nalipat ang Tuldok)',
        badge: '🎯 Decimal Error',
        badgeBg: 'bg-leaf-soft',
        badgeText: 'text-leaf-dark',
        taglishSummary: `Tama ang mga tambal ng numero, pero naligaw ang decimal point o magnitude ng 10x!`,
        userDid: `${userNum}`,
        correctStep: `${correctNum}`,
        ruleTip: 'Bilangin ang dami ng decimal places mula sa kanan bago ilagay ang decimal point.',
        speechText: `Tama ang numero pero nalipat ang decimal point. Tiyakin ang tamang place value.`,
      }
    }
  }

  // 8. Digit Transposition (Swapped Digits e.g. 21 vs 12)
  if (userNum !== null && correctNum !== null && Number.isInteger(userNum) && Number.isInteger(correctNum)) {
    const uStr = Math.abs(userNum).toString()
    const cStr = Math.abs(correctNum).toString()
    if (uStr.length > 1 && uStr.split('').reverse().join('') === cStr) {
      return {
        kind: 'digit_transposition',
        title: 'Binaligtad na Numero! (Transposition)',
        badge: '🔢 Baligtad Digits',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        taglishSummary: `Nabaligtad ang mga digits mo: isinulat mo ang ${userNum} imbes na ${correctNum}!`,
        userDid: `${userNum}`,
        correctStep: `${correctNum}`,
        ruleTip: 'Laging mag-double check sa tens at ones place bago i-submit ang sagot.',
        speechText: `Nabaligtad ang pagkakasulat ng digits mo. ${correctNum} ang tamang sagot, hindi ${userNum}.`,
      }
    }
  }

  // 9. Off-by-one Error (Counting fencepost or slight carry error)
  if (userNum !== null && correctNum !== null && Math.abs(userNum - correctNum) === 1) {
    return {
      kind: 'off_by_one',
      title: 'Sobrang Lapit! (Off by 1)',
      badge: '🎯 Muntik Na!',
      badgeBg: 'bg-leaf-soft',
      badgeText: 'text-leaf-dark',
      taglishSummary: `Kulang o sobra ka lang ng isa (1)! Napakagandang subok.`,
      userDid: `${userNum}`,
      correctStep: `${correctNum}`,
      ruleTip: 'Maging maingat sa pagbibilang o carry-over sa pinakahuling hakbang.',
      speechText: `Sobrang lapit mo na, kulang o sobra ka lang ng isa. Kaya mo 'yan sa susunod!`,
    }
  }

  // 10. Unsimplified Fraction Check
  if (userFrac && q.kind === 'input' && q.requireSimplest) {
    const g = gcd(Math.abs(userFrac.num), Math.abs(userFrac.den))
    if (g > 1) {
      return {
        kind: 'not_simplified',
        title: 'I-simplify sa Lowest Terms!',
        badge: '✂️ Simplest Terms',
        badgeBg: 'bg-sun-soft',
        badgeText: 'text-ink',
        taglishSummary: `Tama ang value ng fraction mo, ngunit kailangan itong i-reduce sa lowest terms sa pamamagitan ng pag-divide sa ${g}.`,
        userDid: `\\frac{${userFrac.num}}{${userFrac.den}}`,
        correctStep: `\\frac{${userFrac.num / g}}{${userFrac.den / g}}`,
        ruleTip: 'I-divide ang numerator at denominator sa kanilang Greatest Common Factor (GCF).',
        speechText: `Tama ang fraction pero kailangan pang i-simplify sa lowest terms. I-divide ang itaas at ilalim sa greatest common factor.`,
      }
    }
  }

  // 11. General Pedagogical Breakdown (Default Grounded Guidance)
  const firstSolutionStep = q.solution[0] ?? `Tamang sagot: ${correctDisplay}`
  return {
    kind: 'general_arithmetic',
    title: 'Bakit Mali Ako? (Hakbang ni Pipo)',
    badge: '💡 Gabay ni Pipo',
    badgeBg: 'bg-grape-soft',
    badgeText: 'text-grape-dark',
    taglishSummary: `Tingnan natin ang unang mahalagang hakbang: "${firstSolutionStep}".`,
    userDid: userDisplay,
    correctStep: correctDisplay,
    ruleTip: q.hints[0] ?? 'Basahing mabuti ang bawat hakbang sa solusyon upang matutunan ang konsepto.',
    speechText: `Heto ang dapat tandaan: ${firstSolutionStep}. Tamang sagot ay ${q.answerDisplay}.`,
  }
}
