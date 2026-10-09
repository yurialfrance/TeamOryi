// World 3 — Senior High (General Mathematics): Simple & compound interest — "Ipon Challenge"
import type { Generator } from '../engine/types'
import { NAMES, peso, pick, r2, ri, shuffle, uid } from '../engine/rand'

/** Stage 1: Percent of a number */
export const percentOf: Generator = () => {
  const p = pick([5, 10, 12, 15, 20, 25, 30, 40, 50, 75])
  const base = pick([80, 120, 200, 250, 400, 500, 1000, 1200, 1500, 2000])
  const ans = (p / 100) * base
  return {
    id: uid(),
    kind: 'input',
    prompt: pick([
      `Ano ang ${p}% ng ${base}?`,
      `May ${p}% discount ang ₱${base} na sapatos sa 11.11 sale. Magkano ang discount?`,
    ]),
    latex: `${p}\\%\\times ${base}`,
    answers: [String(ans)],
    answerDisplay: String(ans),
    hints: [`I-convert ang ${p}% sa decimal: ${p} ÷ 100 = ${p / 100}.`, `Tapos i-multiply sa ${base}.`],
    solution: [`${p}% = ${p / 100}`, `${p / 100} × ${base} = ${ans}`],
  }
}

/** Stage 2: Simple interest I = Prt */
export const simpleInterest: Generator = () => {
  const P = pick([5000, 10000, 15000, 20000, 25000, 50000])
  const r = pick([2, 3, 4, 5, 6, 8])
  const t = ri(1, 5)
  const I = (P * r * t) / 100
  const name = pick(NAMES)
  return {
    id: uid(),
    kind: 'input',
    prompt: `Nag-ipon si ${name} ng ${peso(P)} sa bangko na may ${r}% simple interest kada taon. Magkano ang interest pagkatapos ng ${t} taon?`,
    latex: `I = Prt`,
    answers: [String(I)],
    prefix: '₱',
    tolerance: 0.01,
    answerDisplay: peso(I),
    hints: [`P = ${P}, r = ${r}% = ${r / 100}, t = ${t}.`, 'I-multiply lahat: I = P × r × t.'],
    solution: [`I = (${P})(${r / 100})(${t})`, `I = ${peso(I)}`],
  }
}

/** Stage 3: Maturity value F = P(1 + rt) */
export const maturitySimple: Generator = () => {
  const P = pick([8000, 12000, 20000, 30000, 40000])
  const r = pick([3, 4, 5, 6, 10])
  const t = ri(2, 4)
  const F = P * (1 + (r / 100) * t)
  return {
    id: uid(),
    kind: 'input',
    prompt: `Umutang si Aling Rosa ng ${peso(P)} para sa kanyang sari-sari store, ${r}% simple interest, ${t} taon. Magkano ang kabuuang babayaran (maturity value)?`,
    latex: `F = P(1 + rt)`,
    answers: [String(F)],
    prefix: '₱',
    tolerance: 0.01,
    answerDisplay: peso(F),
    hints: ['Maturity value = principal + interest.', `F = ${P}(1 + ${r / 100} × ${t}).`],
    solution: [`I = ${P} × ${r / 100} × ${t} = ${peso(P * (r / 100) * t)}`, `F = ${peso(P)} + ${peso(P * (r / 100) * t)} = ${peso(F)}`],
  }
}

/** Stage 4: Compound interest F = P(1 + r)^t (annual) */
export const compoundInterest: Generator = () => {
  const P = pick([10000, 20000, 50000, 100000])
  const r = pick([2, 3, 4, 5, 6])
  const t = ri(2, 4)
  const F = r2(P * Math.pow(1 + r / 100, t))
  return {
    id: uid(),
    kind: 'input',
    prompt: `Inilagay ang ${peso(P)} sa digital bank na ${r}% compounded annually. Magkano ito pagkatapos ng ${t} taon? (i-round sa centavo)`,
    latex: `F = P(1 + r)^{t}`,
    answers: [String(F)],
    prefix: '₱',
    tolerance: 0.011,
    answerDisplay: peso(F),
    hints: [`1 + r = 1 + ${r / 100} = ${1 + r / 100}.`, `I-raise sa ${t}, tapos i-multiply sa ${P}.`],
    solution: [
      `F = ${P}(${1 + r / 100})^${t}`,
      `(${1 + r / 100})^${t} = ${Math.pow(1 + r / 100, t).toFixed(6)}`,
      `F = ${peso(F)}`,
    ],
  }
}

/** Stage 5: Simple vs compound — which earns more */
export const simpleVsCompound: Generator = () => {
  const P = pick([10000, 20000, 50000])
  const r = pick([4, 5, 6])
  const t = ri(3, 5)
  const S = r2(P * (1 + (r / 100) * t))
  const C = r2(P * Math.pow(1 + r / 100, t))
  const opts = shuffle([
    { text: `Compound — mas malaki ng ${peso(r2(C - S))}`, ok: true },
    { text: `Simple — mas malaki ng ${peso(r2(C - S))}`, ok: false },
    { text: 'Pareho lang sila', ok: false },
  ])
  return {
    id: uid(),
    kind: 'choice',
    prompt: `${peso(P)}, ${r}% kada taon, ${t} taon. Alin ang mas malaki ang kita: simple o compound interest?`,
    choices: opts.map((o) => ({ text: o.text })),
    correctIndex: opts.findIndex((o) => o.ok),
    answerDisplay: `Compound (${peso(C)} vs ${peso(S)})`,
    hints: ['Sa compound, kumikita rin ng interest ang interest mo!', 'Kalkulahin pareho at ikumpara.'],
    solution: [`Simple: F = ${peso(S)}`, `Compound: F = ${peso(C)}`, `Mas malaki ang compound ng ${peso(r2(C - S))}.`],
  }
}
