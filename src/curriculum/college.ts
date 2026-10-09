// World 4 — College (CHED GE: Mathematics in the Modern World): Patterns & Fibonacci — "Sipnayan sa Kalikasan"
import type { Generator } from '../engine/types'
import { pick, ri, shuffle, uid } from '../engine/rand'

const fib = (n: number) => {
  const f = [1, 1]
  while (f.length < n) f.push(f[f.length - 1] + f[f.length - 2])
  return f.slice(0, n)
}

/** Stage 1: Next term of arithmetic / geometric sequence */
export const nextTerm: Generator = () => {
  const geo = Math.random() < 0.4
  const a = ri(1, 9)
  const d = geo ? pick([2, 3]) : ri(2, 9) * (Math.random() < 0.2 ? -1 : 1)
  const seq = Array.from({ length: 5 }, (_, i) => (geo ? a * Math.pow(d, i) : a + d * i))
  const next = geo ? seq[4] * d : seq[4] + d
  return {
    id: uid(),
    kind: 'input',
    prompt: 'Ano ang susunod na term sa pattern?',
    visual: { type: 'sequence', items: [...seq.map(String), null] },
    answers: [String(next)],
    answerDisplay: String(next),
    hints: ['Tingnan ang pagitan ng magkasunod na terms.', geo ? 'Hindi pare-pareho ang difference… subukan ang ratio (÷).' : 'Pare-pareho ba ang difference?'],
    solution: [geo ? `Common ratio r = ${d}` : `Common difference d = ${d}`, `${seq[4]} ${geo ? `× ${d}` : d < 0 ? `− ${-d}` : `+ ${d}`} = ${next}`],
  }
}

/** Stage 2: Fibonacci */
export const fibonacciNext: Generator = () => {
  const start = ri(3, 8)
  const f = fib(start + 4).slice(start - 1)
  const missingIdx = pick([4, 4, 2])
  const items: (string | null)[] = f.map(String)
  const ans = f[missingIdx]
  items[missingIdx] = null
  return {
    id: uid(),
    kind: 'input',
    prompt: 'Fibonacci sequence ito — makikita sa sunflower at pinya! Ano ang nawawalang numero?',
    visual: { type: 'sequence', items },
    answers: [String(ans)],
    answerDisplay: String(ans),
    hints: ['Bawat term = kabuuan ng dalawang naunang term.', `F(n) = F(n−1) + F(n−2)`],
    solution: missingIdx >= 2 ? [`${f[missingIdx - 2]} + ${f[missingIdx - 1]} = ${ans}`] : [`${ans}`],
  }
}

/** Stage 3: nth term formula of arithmetic sequence (symbolic answer) */
export const nthTermFormula: Generator = () => {
  const a1 = ri(1, 9)
  const d = ri(2, 7)
  const seq = Array.from({ length: 4 }, (_, i) => a1 + d * i)
  const c = a1 - d
  const formula = `${d}n${c === 0 ? '' : c > 0 ? `+${c}` : c}`
  return {
    id: uid(),
    kind: 'input',
    prompt: `Isulat ang formula ng nth term (gamitin ang n) para sa: ${seq.join(', ')}, …`,
    visual: { type: 'sequence', items: [...seq.map(String), '…'] },
    answers: [formula],
    prefix: 'a_n =',
    answerDisplay: `aₙ = ${formula}`,
    hints: [`a₁ = ${a1}, d = ${d}.`, 'Gamitin: aₙ = a₁ + (n − 1)d, tapos i-simplify.'],
    solution: [`aₙ = ${a1} + (n − 1)(${d})`, `aₙ = ${a1} + ${d}n − ${d}`, `aₙ = ${formula.replace('+', ' + ').replace(/n-/, 'n − ')}`],
  }
}

/** Stage 4: Golden ratio */
export const goldenRatio: Generator = () => {
  const n = ri(8, 14)
  const f = fib(n + 1)
  const ratio = (f[n] / f[n - 1]).toFixed(3)
  const opts = shuffle([
    { text: `≈ ${ratio} (φ, golden ratio)`, ok: true },
    { text: `≈ ${(f[n - 1] / f[n]).toFixed(3)}`, ok: false },
    { text: '≈ 2.000', ok: false },
    { text: '≈ 3.142 (π)', ok: false },
  ])
  return {
    id: uid(),
    kind: 'choice',
    prompt: `Hatiin ang Fibonacci number na ${f[n]} sa naunang term na ${f[n - 1]}. Saan ito lumalapit?`,
    latex: `\\frac{${f[n]}}{${f[n - 1]}}`,
    choices: opts.map((o) => ({ text: o.text })),
    correctIndex: opts.findIndex((o) => o.ok),
    answerDisplay: `≈ ${ratio} (φ)`,
    hints: ['Mas malaki ang numerator kaya lampas sa 1 ang sagot.', 'φ = (1 + √5)/2 ≈ 1.618'],
    solution: [`${f[n]} ÷ ${f[n - 1]} ≈ ${ratio}`, 'Habang lumalaki ang n, lumalapit ito sa φ ≈ 1.618 — ang golden ratio.'],
  }
}

/** Stage 5: Sum of arithmetic series */
export const seriesSum: Generator = () => {
  const a1 = ri(1, 10)
  const d = ri(1, 5)
  const n = pick([5, 6, 8, 10, 12])
  const an = a1 + (n - 1) * d
  const S = (n * (a1 + an)) / 2
  return {
    id: uid(),
    kind: 'input',
    prompt: `Sa isang tanim na pinya, may ${a1} na pinya sa unang hilera, at nadadagdagan ng ${d} bawat hilera. Ilan lahat ang pinya sa ${n} na hilera?`,
    visual: { type: 'scene', icons: ['pineapple', 'pineapple', 'pineapple'] },
    latex: `S_n = \\frac{n}{2}(a_1 + a_n)`,
    answers: [String(S)],
    answerDisplay: String(S),
    hints: [`Hanapin muna ang a${n}: a₁ + (n − 1)d.`, `Tapos gamitin ang Sₙ = n/2 (a₁ + aₙ).`],
    solution: [`a${n} = ${a1} + ${n - 1}(${d}) = ${an}`, `S${n} = ${n}/2 × (${a1} + ${an}) = ${S}`],
  }
}
