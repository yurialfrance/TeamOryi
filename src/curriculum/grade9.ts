// Grade 9 (MATATAG): Quadratic equations & functions — "Kurba ng Bola"
import type { Generator } from '../engine/types'
import { pick, ri, shuffle, uid } from '../engine/rand'

const sgn = (n: number, v = '') => (n === 0 ? '' : n < 0 ? ` - ${Math.abs(n) === 1 && v ? '' : Math.abs(n)}${v}` : ` + ${n === 1 && v ? '' : n}${v}`)
const quad = (a: number, b: number, c: number) => `${a === 1 ? '' : a === -1 ? '-' : a}x^2${sgn(b, 'x')}${sgn(c)}`

export const evalQuad: Generator = () => {
  const a = pick([1, 2, 3, -1]), b = ri(-6, 6), c = ri(-9, 9), x = ri(-3, 4)
  const y = a * x * x + b * x + c
  return {
    id: uid(),
    kind: 'input',
    prompt: `Kung f(x) = ${quad(a, b, c).replace(/\^2/g, '²')}, ano ang f(${x})?`,
    latex: `f(x) = ${quad(a, b, c)}`,
    answers: [String(y)],
    answerDisplay: String(y),
    hints: [`Palitan ang x ng ${x}.`, `Unahin ang exponent: (${x})² = ${x * x}.`],
    solution: [`f(${x}) = ${a}(${x})² + ${b}(${x}) + ${c}`, `= ${a * x * x} + ${b * x} + ${c}`, `= ${y}`],
  }
}

export const factorRoots: Generator = () => {
  let r1 = ri(-7, 7), r2 = ri(-7, 7)
  while (r1 === r2 || r1 === 0 || r2 === 0) { r1 = ri(-7, 7); r2 = ri(-7, 7) }
  const b = -(r1 + r2), c = r1 * r2
  const big = Math.max(r1, r2), small = Math.min(r1, r2)
  const askBig = Math.random() < 0.5
  return {
    id: uid(),
    kind: 'input',
    prompt: `I-solve sa pamamagitan ng factoring. Ano ang ${askBig ? 'MAS MALAKING' : 'MAS MALIIT NA'} root?`,
    latex: `${quad(1, b, c)} = 0`,
    answers: [`x=${askBig ? big : small}`],
    prefix: 'x =',
    answerDisplay: `x = ${askBig ? big : small}`,
    hints: [`Maghanap ng dalawang numero na ang product ay ${c} at ang sum ay ${b}.`, 'Gamitin ang (x − r₁)(x − r₂) = 0.'],
    solution: [`(x ${r1 < 0 ? '+' : '-'} ${Math.abs(r1)})(x ${r2 < 0 ? '+' : '-'} ${Math.abs(r2)}) = 0`, `x = ${r1} o x = ${r2}`, `Mas ${askBig ? 'malaki' : 'maliit'}: ${askBig ? big : small}`],
  }
}

export const discriminant: Generator = () => {
  const a = pick([1, 2, 3]), b = ri(-8, 8), c = ri(-6, 8)
  const D = b * b - 4 * a * c
  const nature = D > 0 ? 'Dalawang magkaibang real roots' : D === 0 ? 'Isang real root (magkapareho)' : 'Walang real roots'
  const opts = shuffle(['Dalawang magkaibang real roots', 'Isang real root (magkapareho)', 'Walang real roots'])
  if (Math.random() < 0.5) {
    return {
      id: uid(),
      kind: 'input',
      prompt: 'Kalkulahin ang discriminant.',
      latex: `${quad(a, b, c)} = 0`,
      answers: [String(D)],
      answerDisplay: String(D),
      hints: ['D = b² − 4ac', `a = ${a}, b = ${b}, c = ${c}`],
      solution: [`D = (${b})² − 4(${a})(${c})`, `D = ${b * b} − ${4 * a * c} = ${D}`],
    }
  }
  return {
    id: uid(),
    kind: 'choice',
    prompt: 'Ano ang uri ng roots nito? (Gamitin ang discriminant)',
    latex: `${quad(a, b, c)} = 0`,
    choices: opts.map((text) => ({ text })),
    correctIndex: opts.indexOf(nature),
    answerDisplay: `${nature} (D = ${D})`,
    hints: ['D > 0: dalawang real roots · D = 0: isa · D < 0: wala', 'D = b² − 4ac'],
    solution: [`D = ${b * b} − ${4 * a * c} = ${D}`, nature],
  }
}

export const sumProduct: Generator = () => {
  const a = pick([1, 2, 3]), b = ri(-9, 9) * a, c = ri(-9, 9) * a
  const askSum = Math.random() < 0.5
  const ans = askSum ? -b / a : c / a
  return {
    id: uid(),
    kind: 'input',
    prompt: `Ano ang ${askSum ? 'SUM' : 'PRODUCT'} ng roots? (Hindi na kailangang i-solve!)`,
    latex: `${quad(a, b, c)} = 0`,
    answers: [String(ans)],
    answerDisplay: String(ans),
    hints: [askSum ? 'Sum ng roots = −b/a' : 'Product ng roots = c/a', `a = ${a}, b = ${b}, c = ${c}`],
    solution: [askSum ? `−b/a = −(${b})/${a} = ${ans}` : `c/a = ${c}/${a} = ${ans}`],
  }
}

export const quadWord: Generator = () => {
  const w = ri(3, 12), k = ri(2, 6)
  const A = w * (w + k)
  return {
    id: uid(),
    kind: 'input',
    prompt: `Ang haba ng taniman ni Mang Tonyo ay ${k} m na mas mahaba sa lapad nito. Ang area ay ${A} m². Ilang metro ang lapad?`,
    visual: { type: 'scene', icons: ['sunflower', 'pineapple'] },
    latex: `x(x + ${k}) = ${A}`,
    answers: [String(w)],
    prefix: 'x =',
    answerDisplay: `${w} m`,
    hints: [`Gawing standard form: x² + ${k}x − ${A} = 0.`, 'I-factor, tapos kunin ang positive na root (walang negative na haba).'],
    solution: [`x² + ${k}x − ${A} = 0`, `(x − ${w})(x + ${w + k}) = 0`, `x = ${w} (positive)`],
  }
}
