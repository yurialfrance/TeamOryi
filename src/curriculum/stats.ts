// SHS Statistics & Probability (core) — "Datos ng Barangay"
import type { Generator } from '../engine/types'
import { gcd, pick, r2, ri, shuffle, uid } from '../engine/rand'

const dataset = (n: number, lo: number, hi: number) => Array.from({ length: n }, () => ri(lo, hi))

export const meanGen: Generator = () => {
  let xs = dataset(pick([4, 5]), 60, 98)
  const extra = xs.reduce((s, v) => s + v, 0) % xs.length
  xs[0] -= extra // make mean a whole number
  xs = shuffle(xs)
  const mean = xs.reduce((s, v) => s + v, 0) / xs.length
  return {
    id: uid(),
    kind: 'input',
    prompt: `Ito ang quiz scores ng ${xs.length} estudyante. Ano ang mean (average)?`,
    visual: { type: 'sequence', items: xs.map(String) },
    answers: [String(mean)],
    tolerance: 0.01,
    answerDisplay: String(mean),
    hints: ['I-add lahat ng scores.', `I-divide sa dami ng scores (${xs.length}).`],
    solution: [`Kabuuan = ${xs.join(' + ')} = ${xs.reduce((s, v) => s + v, 0)}`, `Mean = ${xs.reduce((s, v) => s + v, 0)} ÷ ${xs.length} = ${mean}`],
  }
}

export const medianGen: Generator = () => {
  const n = pick([5, 7, 6])
  const xs = dataset(n, 10, 60)
  const sorted = [...xs].sort((a, b) => a - b)
  const med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  return {
    id: uid(),
    kind: 'input',
    prompt: `Ilang minuto ang biyahe ng ${n} na estudyante papuntang school. Ano ang median?`,
    visual: { type: 'sequence', items: xs.map(String) },
    answers: [String(med)],
    tolerance: 0.01,
    answerDisplay: String(med),
    hints: ['Ayusin muna mula pinakamaliit hanggang pinakamalaki.', n % 2 ? 'Kunin ang nasa gitna.' : 'Even ang dami — i-average ang dalawang nasa gitna.'],
    solution: [`Sorted: ${sorted.join(', ')}`, `Median = ${med}`],
  }
}

export const modeGen: Generator = () => {
  const m = ri(1, 9)
  const others = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((v) => v !== m)).slice(0, 4)
  const xs = shuffle([m, m, m, ...others, others[0]])
  const opts = shuffle([m, others[0], others[1], others[2]])
  return {
    id: uid(),
    kind: 'choice',
    prompt: 'Ilang kapatid ang bawat estudyante sa klase. Ano ang mode?',
    visual: { type: 'sequence', items: xs.map(String) },
    choices: opts.map((v) => ({ text: String(v) })),
    correctIndex: opts.indexOf(m),
    answerDisplay: String(m),
    hints: ['Ang mode ay ang value na pinakamadalas lumabas.', 'Bilangin kung ilang beses lumabas ang bawat numero.'],
    solution: [`${m} ay lumabas nang 3 beses — pinakamadalas.`, `Mode = ${m}`],
  }
}

export const probabilityGen: Generator = () => {
  const r = ri(2, 8), b = ri(2, 8), g = ri(1, 6)
  const total = r + b + g
  const pickColor = pick([['pula', r], ['asul', b], ['berde', g]] as const)
  const k = gcd(pickColor[1], total)
  const ans = pickColor[1] / k === total / k ? '1' : `\\frac{${pickColor[1] / k}}{${total / k}}`
  return {
    id: uid(),
    kind: 'input',
    prompt: `May ${r} pula, ${b} asul, at ${g} berde na bola sa kahon. Kung bubunot ng isa nang hindi tumitingin, ano ang probability na ${pickColor[0]}? (lowest terms)`,
    answers: [ans],
    requireSimplest: true,
    answerDisplay: `${pickColor[1] / k}/${total / k}`,
    hints: ['P = (bilang ng gusto) ÷ (kabuuang bilang)', `Kabuuan = ${r} + ${b} + ${g}.`],
    solution: [`Kabuuan = ${total}`, `P(${pickColor[0]}) = ${pickColor[1]}/${total}${k > 1 ? ` = ${pickColor[1] / k}/${total / k}` : ''}`],
  }
}

export const zScore: Generator = () => {
  const mu = pick([70, 75, 80, 50, 60]), sd = pick([4, 5, 8, 10])
  const z = pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5])
  const x = r2(mu + z * sd)
  return {
    id: uid(),
    kind: 'input',
    prompt: `Sa isang exam, ang mean ay ${mu} at ang standard deviation ay ${sd}. Ano ang z-score ng estudyanteng nakakuha ng ${x}?`,
    latex: `z = \\frac{x - \\mu}{\\sigma}`,
    answers: [String(z)],
    tolerance: 0.01,
    answerDisplay: String(z),
    hints: [`Ibawas ang mean: ${x} − ${mu}.`, `I-divide sa standard deviation (${sd}).`],
    solution: [`z = (${x} − ${mu}) ÷ ${sd}`, `z = ${r2(x - mu)} ÷ ${sd} = ${z}`],
  }
}
