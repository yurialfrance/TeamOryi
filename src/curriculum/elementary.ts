// World 1 — Elementary (Grades 3–4): Fractions — "Hati-hati sa Pizza"
import type { Generator, Question } from '../engine/types'
import { gcd, NAMES, pick, ri, shuffle, uid } from '../engine/rand'

const frac = (n: number, d: number) => `\\frac{${n}}{${d}}`

/** Stage 1: Identify the fraction shown by a pizza */
export const identifyFraction: Generator = () => {
  const den = pick([2, 3, 4, 5, 6, 8])
  const num = ri(1, den - 1)
  const wrong = new Set<string>()
  wrong.add(frac(den - num === num ? num + 1 : den - num, den))
  wrong.add(frac(den, num))
  wrong.add(frac(num, den + 1))
  const opts = shuffle([frac(num, den), ...[...wrong].filter((w) => w !== frac(num, den)).slice(0, 3)])
  return {
    id: uid(),
    kind: 'choice',
    prompt: 'Anong fraction ng pizza ang may kulay?',
    visual: { type: 'pizza', num, den },
    choices: opts.map((latex) => ({ latex })),
    correctIndex: opts.indexOf(frac(num, den)),
    answerDisplay: `${num}/${den}`,
    hints: [
      'Bilangin muna lahat ng hiwa ng pizza — iyan ang denominator (ibaba).',
      'Ngayon bilangin ang may kulay na hiwa — iyan ang numerator (itaas).',
    ],
    solution: [
      `May ${den} na pantay na hiwa ang pizza → denominator = ${den}.`,
      `${num} na hiwa ang may kulay → numerator = ${num}.`,
      `Kaya ang sagot ay ${num}/${den}.`,
    ],
  }
}

/** Stage 1b: place a fraction on a number line */
export const fractionNumberLine: Generator = () => {
  const den = pick([2, 3, 4, 5, 6, 8])
  const num = ri(1, den - 1)
  return {
    id: uid(),
    kind: 'numberline',
    prompt: 'I-tap kung nasaan ang fraction sa number line.',
    latex: frac(num, den),
    min: 0,
    max: 1,
    divisions: den,
    answerIndex: num,
    labelEvery: den,
    answerDisplay: `${num}/${den}`,
    hints: [
      `Hinati ang 0 hanggang 1 sa ${den} na pantay na bahagi.`,
      `Magbilang ng ${num} na hakbang mula sa 0.`,
    ],
    solution: [
      `Ang denominator na ${den} ay nagsasabing ${den} na pantay na bahagi ang pagitan ng 0 at 1.`,
      `Ang numerator na ${num} ay ${num} na hakbang mula sa 0.`,
    ],
  }
}

/** Stage 2: Equivalent fractions  a/b = ?/(b*k) */
export const equivalentFraction: Generator = () => {
  const den = pick([2, 3, 4, 5])
  const num = ri(1, den - 1)
  const k = ri(2, 4)
  const missingTop = Math.random() < 0.6
  const latex = missingTop
    ? `${frac(num, den)} = \\frac{?}{${den * k}}`
    : `${frac(num, den)} = \\frac{${num * k}}{?}`
  const ans = missingTop ? num * k : den * k
  return {
    id: uid(),
    kind: 'input',
    prompt: 'Punan ang nawawalang numero para magkapantay ang fractions.',
    latex,
    answers: [String(ans)],
    answerDisplay: String(ans),
    placeholder: '?',
    hints: [
      missingTop
        ? `Ilang beses ang ${den} para maging ${den * k}?`
        : `Ilang beses ang ${num} para maging ${num * k}?`,
      `I-multiply ang numerator at denominator sa parehong numero (${k}).`,
    ],
    solution: [
      missingTop ? `${den} × ${k} = ${den * k}` : `${num} × ${k} = ${num * k}`,
      `Kaya i-multiply din ang kabila: ${missingTop ? `${num} × ${k} = ${num * k}` : `${den} × ${k} = ${den * k}`}.`,
      `${num}/${den} = ${num * k}/${den * k}`,
    ],
  }
}

/** Stage 3: Compare fractions (same denominator or same numerator) */
export const compareFractions: Generator = () => {
  let a: [number, number], b: [number, number]
  if (Math.random() < 0.5) {
    const d = pick([4, 5, 6, 8, 10])
    const n1 = ri(1, d - 1)
    const n2 = Math.random() < 0.15 ? n1 : ri(1, d - 1)
    a = [n1, d]; b = [n2, d]
  } else {
    const n = ri(1, 3)
    const d1 = ri(n + 1, 9), d2 = ri(n + 1, 9)
    a = [n, d1]; b = [n, d2]
  }
  const va = a[0] / a[1], vb = b[0] / b[1]
  const sign = va > vb ? '>' : va < vb ? '<' : '='
  const opts = ['>', '<', '=']
  const sameDen = a[1] === b[1]
  return {
    id: uid(),
    kind: 'choice',
    prompt: 'Alin ang tamang simbolo?',
    latex: `${frac(a[0], a[1])} \\;\\square\\; ${frac(b[0], b[1])}`,
    choices: opts.map((latex) => ({ latex })),
    correctIndex: opts.indexOf(sign),
    answerDisplay: sign,
    hints: sameDen
      ? ['Pareho ang denominator! Tingnan lang ang numerator.', 'Mas malaking numerator = mas malaking fraction.']
      : ['Pareho ang numerator! Tingnan ang denominator.', 'Mas maraming hiwa = mas maliit ang bawat hiwa. Kaya mas malaking denominator = mas maliit na fraction.'],
    solution: [
      sameDen
        ? `Parehong ${a[1]} ang denominator, kaya ikumpara ang ${a[0]} at ${b[0]}.`
        : `Parehong ${a[0]} ang numerator, kaya ikumpara ang denominators: ${a[1]} at ${b[1]}.`,
      `${a[0]}/${a[1]} ${sign} ${b[0]}/${b[1]}`,
    ],
  }
}

/** Stage 4: Add/subtract similar fractions, answer in simplest form */
export const addSimilar: Generator = () => {
  const d = pick([4, 5, 6, 8, 9, 10, 12])
  const add = Math.random() < 0.65
  const n1 = add ? ri(1, d - 2) : ri(2, d - 1)
  const n2 = add ? ri(1, d - n1) : ri(1, n1 - 1)
  const rn = add ? n1 + n2 : n1 - n2
  const g = gcd(rn, d)
  const sn = rn / g, sd = d / g
  const simple = sd === 1 ? String(sn) : frac(sn, sd)
  return {
    id: uid(),
    kind: 'input',
    prompt: 'Sagutin. Isulat sa pinakasimpleng anyo (lowest terms).',
    latex: `${frac(n1, d)} ${add ? '+' : '-'} ${frac(n2, d)} = ?`,
    answers: [simple],
    requireSimplest: true,
    answerDisplay: sd === 1 ? String(sn) : `${sn}/${sd}`,
    hints: [
      'Similar fractions ito — pareho ang denominator. Hindi ito ginagalaw!',
      `${add ? 'I-add' : 'I-subtract'} lang ang numerators, tapos i-simplify kung kaya.`,
    ],
    solution: [
      `${n1} ${add ? '+' : '−'} ${n2} = ${rn}, kaya ${rn}/${d}.`,
      g > 1 ? `I-divide ang itaas at ibaba sa ${g}: ${rn}/${d} = ${sd === 1 ? sn : `${sn}/${sd}`}.` : `${rn}/${d} ay nasa lowest terms na.`,
    ],
  }
}

/** Stage 5: Word problems — pizza party, sari-sari store */
export const fractionWord: Generator = () => {
  const name = pick(NAMES)
  const t = pick(['pizza', 'leche', 'pandesal'] as const)
  if (t === 'pizza') {
    const d = pick([6, 8, 10, 12])
    const ate = ri(1, d - 2)
    const left = d - ate
    const g = gcd(left, d)
    return {
      id: uid(),
      kind: 'input',
      prompt: `May isang pizza na hinati sa ${d} na pantay na hiwa. Kinain ni ${name} ang ${ate} na hiwa. Anong fraction ng pizza ang natira? (lowest terms)`,
      visual: { type: 'pizza', num: left, den: d },
      answers: [left / g === d / g ? '1' : frac(left / g, d / g)],
      requireSimplest: true,
      answerDisplay: `${left / g}/${d / g}`,
      hints: ['Ilan ang natirang hiwa?', `Natira ÷ kabuuan, tapos i-simplify.`],
      solution: [`${d} − ${ate} = ${left} na hiwa ang natira.`, `${left}/${d}${g > 1 ? ` = ${left / g}/${d / g}` : ''}`],
    }
  }
  if (t === 'leche') {
    const d = pick([4, 8])
    const a = ri(1, d - 2), b = ri(1, d - 1 - a)
    const s = a + b, g = gcd(s, d)
    return {
      id: uid(),
      kind: 'input',
      prompt: `Gumamit si Lola ng ${a}/${d} tasa ng gatas para sa leche flan at ${b}/${d} tasa para sa kape. Ilang tasa lahat ang nagamit? (lowest terms)`,
      visual: { type: 'scene', icons: ['flan', 'coffee'] },
      answers: [frac(s / g, d / g)],
      requireSimplest: true,
      answerDisplay: `${s / g}/${d / g}`,
      hints: ['"Lahat" → addition.', 'Pareho ang denominator, kaya i-add ang numerators.'],
      solution: [`${a}/${d} + ${b}/${d} = ${s}/${d}`, g > 1 ? `I-simplify: ${s / g}/${d / g}` : 'Lowest terms na.'],
    }
  }
  const total = pick([12, 20, 24, 30])
  const d = pick([2, 3, 4, 6].filter((x) => total % x === 0))
  const n = ri(1, d - 1)
  const ans = (total / d) * n
  const q: Question = {
    id: uid(),
    kind: 'input',
    prompt: `May ${total} na pandesal sa bakery ni Aling Nena. Nabenta ang ${n}/${d} nito. Ilang pandesal ang nabenta?`,
    visual: { type: 'scene', icons: Array.from({ length: Math.min(6, total / d) }, () => 'bread' as const) },
    answers: [String(ans)],
    answerDisplay: String(ans),
    hints: [`Hatiin muna ang ${total} sa ${d} na grupo.`, `Kunin ang ${n} na grupo.`],
    solution: [`${total} ÷ ${d} = ${total / d} bawat grupo.`, `${total / d} × ${n} = ${ans} pandesal.`],
  }
  return q
}

