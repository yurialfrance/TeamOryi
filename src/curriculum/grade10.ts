// Grade 10 (MATATAG Key Stage 3): quadratic inequalities, absolute value equations, radical
// expressions, the equation of a circle, compound interest and depreciation, the laws of sines and
// cosines, angles/arcs/sectors of a circle, quartiles and the IQR, and union/intersection of events.
import type { Generator } from '../engine/types'
import { gcd, NAMES, pick, ri, shuffle } from '../engine/rand'
import { choice, fmt, frac, input, peso, round, signed } from './kit'

/** Quadratic inequalities with integer roots */
export const quadIneq: Generator = () => {
  let r1 = ri(-6, 6), r2 = ri(-6, 6)
  while (r1 === r2) r2 = ri(-6, 6)
  if (r1 > r2) [r1, r2] = [r2, r1]
  const b = -(r1 + r2), c = r1 * r2
  const less = Math.random() < 0.5
  const between = `${r1} < x < ${r2}`, outside = `x < ${r1} \\text{ o } x > ${r2}`
  const ans = less ? between : outside
  const expr = `x^2 ${b ? `${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x` : ''} ${c ? signed(c) : ''}`.replace(/\s+/g, ' ').trim()
  return choice('I-solve ang quadratic inequality.', ans, [less ? outside : between, `${r1} \\le x \\le ${r2}`, `x < ${-r2} \\text{ o } x > ${-r1}`], {
    latex: `${expr} ${less ? '<' : '>'} 0`, tex: true,
    hints: ['I-factor at hanapin ang roots.', less ? 'Ang parabola (pataas) ay NEGATIVE sa pagitan ng roots.' : 'Ang parabola (pataas) ay POSITIVE sa labas ng roots.'],
    solution: [`(x ${signed(-r1)})(x ${signed(-r2)}) ${less ? '<' : '>'} 0`, `Roots: ${r1} at ${r2}`, `Sagot: ${ans.replace(/\\text\{ o \}/, ' o ')}`],
  })
}

/** Absolute value equations |ax + b| = c */
export const absValue: Generator = () => {
  const a = pick([1, 1, 2, 3]), x1 = ri(-8, 8), d = ri(1, 6)
  // |a x + b| = c with solutions x1 and x1 - 2c/a: pick b so that a*x1 + b = c
  const c = a * d, b = c - a * x1
  const x2 = x1 - (2 * c) / a
  const big = Math.max(x1, x2), small = Math.min(x1, x2)
  const askBig = Math.random() < 0.5
  const inner = `${a === 1 ? '' : a}x ${b ? signed(b) : ''}`.trim()
  return input(`I-solve. Ano ang ${askBig ? 'mas malaking' : 'mas maliit na'} solution?`, `x=${askBig ? big : small}`, {
    latex: `|${inner}| = ${c}`, prefix: 'x =', display: `x = ${askBig ? big : small}`,
    hints: ['Dalawang kaso: ang loob ay = c, o ang loob ay = −c.'],
    solution: [`${inner} = ${c}  →  x = ${x1}`, `${inner} = −${c}  →  x = ${x2}`, `Sagot: x = ${askBig ? big : small}`],
  })
}

const SQUAREFREE = [2, 3, 5, 6, 7, 10]

/** Simplifying and adding radicals */
export const radicals: Generator = () => {
  const r = pick(SQUAREFREE), k = ri(2, 7)
  if (Math.random() < 0.55) {
    const n = k * k * r
    return choice('I-simplify ang radical.', `${k}\\sqrt{${r}}`, [`${r}\\sqrt{${k}}`, `${k * k}\\sqrt{${r}}`, `${k}\\sqrt{${r * k}}`, `\\sqrt{${n}}`], {
      latex: `\\sqrt{${n}}`, tex: true, display: `${k}√${r}`,
      hints: [`Hanapin ang pinakamalaking perfect square na factor ng ${n}.`, `${n} = ${k * k} × ${r}`],
      solution: [`√${n} = √(${k * k} × ${r})`, `= ${k}√${r}`],
    })
  }
  const a = ri(2, 9), b = ri(1, 9), add = Math.random() < 0.6
  const res = add ? a + b : a - b
  const ans = res === 0 ? '0' : res === 1 ? `\\sqrt{${r}}` : res === -1 ? `-\\sqrt{${r}}` : `${res}\\sqrt{${r}}`
  return choice('I-simplify.', ans, [`${add ? a + b : a - b}\\sqrt{${2 * r}}`, `${a * b}\\sqrt{${r}}`, `${add ? a - b : a + b}\\sqrt{${r}}`, `\\sqrt{${(add ? a + b : Math.abs(a - b) || 1) * r}}`], {
    latex: `${a}\\sqrt{${r}} ${add ? '+' : '-'} ${b}\\sqrt{${r}}`, tex: true, display: ans.replace(/\\sqrt\{(\d+)\}/, '√$1'),
    hints: ['Parang like terms: pareho ang radicand, kaya i-add/subtract lang ang coefficients.'],
    solution: [`(${a} ${add ? '+' : '−'} ${b})√${r} = ${ans.replace(/\\sqrt\{(\d+)\}/, '√$1')}`],
  })
}

/** Equation of a circle: center and radius */
export const circleEquation: Generator = () => {
  const h = ri(-6, 6), k = ri(-6, 6), r = ri(1, 9)
  const term = (v: string, c: number) => (c === 0 ? `${v}^2` : `(${v} ${signed(-c)})^2`)
  const eq = `${term('x', h)} + ${term('y', k)} = ${r * r}`
  if (Math.random() < 0.5) {
    return input('Ano ang radius ng bilog?', r, {
      latex: eq, hints: ['(x − h)² + (y − k)² = r²', `r = √${r * r}`], solution: [`r² = ${r * r}`, `r = ${r}`],
    })
  }
  return choice('Ano ang center ng bilog?', `(${h}, ${k})`, [`(${-h}, ${-k})`, `(${k}, ${h})`, `(${-h}, ${k})`, `(${h}, ${-k})`], {
    latex: eq,
    hints: ['Sa (x − h)² + (y − k)² = r², ang center ay (h, k).', 'Mag-ingat sa signs: ang (x + 3) ay (x − (−3)).'],
    solution: [`h = ${h}, k = ${k}`, `Center: (${h}, ${k})`],
  })
}

/** Depreciation (declining balance) and compound interest compounded more than once a year */
export const depreciation: Generator = () => {
  if (Math.random() < 0.5) {
    const P = ri(4, 20) * 10000, rate = pick([10, 15, 20]), t = ri(1, 3)
    const V = round(P * (1 - rate / 100) ** t, 2)
    return input(`Ang motorsiklo ay nabili sa ${peso(P)}. Bumababa ang halaga nito nang ${rate}% bawat taon. Magkano na ang halaga nito pagkalipas ng ${t} taon?`, V, {
      prefix: '₱', tolerance: 0.011, latex: 'V = P(1 - r)^t',
      hints: [`r = ${rate / 100}`, `I-multiply sa ${1 - rate / 100} nang ${t} beses.`],
      solution: [`V = ${fmt(P)} × (1 − ${rate / 100})^${t}`, `V = ${fmt(P)} × ${round((1 - rate / 100) ** t, 6)}`, `V = ${peso(V)}`],
    })
  }
  const P = ri(1, 10) * 10000, rate = pick([4, 6, 8, 12]), m = pick([2, 4]), t = ri(1, 3)
  const F = round(P * (1 + rate / 100 / m) ** (m * t), 2)
  return input(`Idineposito ni ${pick(NAMES)} ang ${peso(P)} sa bangko na ${rate}% bawat taon, compounded ${m === 2 ? 'semi-annually' : 'quarterly'}. Magkano ito pagkalipas ng ${t} taon?`, F, {
    prefix: '₱', tolerance: 0.011, latex: 'F = P\\left(1 + \\frac{r}{m}\\right)^{mt}',
    hints: [`r/m = ${rate / 100}/${m} = ${rate / 100 / m}`, `mt = ${m} × ${t} = ${m * t}`],
    solution: [`F = ${fmt(P)}(1 + ${rate / 100 / m})^${m * t}`, `F = ${peso(F)}`],
  })
}

/** Law of cosines (C = 60° with integer answers) and law of sines (special angles) */
export const lawSinesCosines: Generator = () => {
  if (Math.random() < 0.5) {
    const [a, b, c] = pick([[3, 8, 7], [5, 8, 7], [8, 15, 13], [7, 15, 13], [5, 21, 19], [16, 21, 19], [7, 8, 13]])
    const angle = c === 13 && a === 7 && b === 8 ? 120 : 60
    return input(`Sa triangle ABC, a = ${a}, b = ${b} at ∠C = ${angle}°. Gaano kahaba ang side c?`, c, {
      latex: 'c^2 = a^2 + b^2 - 2ab\\cos C',
      hints: [`cos ${angle}° = ${angle === 60 ? '1/2' : '−1/2'}`, `c² = ${a * a} + ${b * b} ${angle === 60 ? '−' : '+'} ${a * b}`],
      solution: [`c² = ${a}² + ${b}² − 2(${a})(${b})(${angle === 60 ? '1/2' : '−1/2'})`, `c² = ${c * c}`, `c = ${c}`],
    })
  }
  const a = ri(2, 12) * 2
  const [B, sinB, mult, label] = pick([[90, '1', 2, '2a'], [60, '\\frac{\\sqrt{3}}{2}', Math.sqrt(3), 'a√3'], [45, '\\frac{\\sqrt{2}}{2}', Math.SQRT2, 'a√2']] as const)
  const ans = B === 90 ? String(2 * a) : `${a}\\sqrt{${B === 60 ? 3 : 2}}`
  return choice(`Sa triangle ABC, a = ${a}, ∠A = 30° at ∠B = ${B}°. Gaano kahaba ang side b?`, ans, [String(a / 2), `${a}\\sqrt{2}`, `${a}\\sqrt{3}`, String(2 * a), `${2 * a}\\sqrt{3}`], {
    latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B}', tex: true, display: `${label.replace('a', String(a))} ≈ ${round(a * mult, 2)}`,
    hints: ['sin 30° = 1/2', `sin ${B}° = ${sinB.replace(/\\frac\{(.+)\}\{(.+)\}/, '$1/$2').replace(/\\sqrt\{(\d)\}/, '√$1')}`],
    solution: [`b = a · sin B ÷ sin A`, `b = ${a} · sin ${B}° ÷ (1/2)`, `b = ${label.replace('a', String(a))}`],
  })
}

/** Central and inscribed angles, arc length and sector area (π = 3.14) */
export const circleParts: Generator = () => {
  const kind = pick(['inscribed', 'central', 'arc', 'sector'] as const)
  if (kind === 'inscribed' || kind === 'central') {
    const arc = ri(20, 170) * 2
    const ans = kind === 'inscribed' ? arc / 2 : arc
    return input(`Ang intercepted arc ay ${arc}°. Gaano kalaki ang ${kind === 'inscribed' ? 'inscribed angle' : 'central angle'}?`, ans, {
      suffix: '°', hints: [kind === 'inscribed' ? 'Ang inscribed angle ay kalahati ng intercepted arc.' : 'Ang central angle ay kapareho ng intercepted arc.'],
      solution: [kind === 'inscribed' ? `${arc}° ÷ 2 = ${ans}°` : `${ans}°`],
    })
  }
  const r = ri(2, 12), deg = pick([30, 45, 60, 90, 120, 180, 270])
  if (kind === 'arc') {
    const L = round((deg / 360) * 2 * 3.14 * r, 2)
    return input(`Ano ang haba ng arc na may central angle na ${deg}° sa bilog na radius ${r} cm? (π = 3.14)`, L, {
      suffix: 'cm', tolerance: 0.011, latex: 'L = \\frac{\\theta}{360^\\circ} \\cdot 2\\pi r',
      hints: [`Bahagi ng bilog: ${deg}/360.`], solution: [`L = (${deg}/360) × 2 × 3.14 × ${r}`, `L = ${L} cm`],
    })
  }
  const A = round((deg / 360) * 3.14 * r * r, 2)
  return input(`Ano ang area ng sector na may central angle na ${deg}° sa bilog na radius ${r} cm? (π = 3.14)`, A, {
    suffix: 'sq. cm', tolerance: 0.011, latex: 'A = \\frac{\\theta}{360^\\circ} \\cdot \\pi r^2',
    hints: [`Bahagi ng bilog: ${deg}/360.`], solution: [`A = (${deg}/360) × 3.14 × ${r}²`, `A = ${A} sq. cm`],
  })
}

/** Quartiles (median of each half, median excluded for odd n) and the interquartile range */
export const quartiles: Generator = () => {
  const n = pick([7, 8, 9, 10, 11])
  const data = Array.from({ length: n }, () => ri(10, 60)).sort((a, b) => a - b)
  const med = (xs: number[]) => (xs.length % 2 ? xs[(xs.length - 1) / 2] : (xs[xs.length / 2 - 1] + xs[xs.length / 2]) / 2)
  const lower = data.slice(0, Math.floor(n / 2)), upper = data.slice(Math.ceil(n / 2))
  const q1 = med(lower), q2 = med(data), q3 = med(upper)
  const ask = pick(['q1', 'q3', 'iqr', 'q2'] as const)
  const ans = ask === 'q1' ? q1 : ask === 'q3' ? q3 : ask === 'q2' ? q2 : q3 - q1
  const label = { q1: 'first quartile (Q₁)', q2: 'median (Q₂)', q3: 'third quartile (Q₃)', iqr: 'interquartile range (IQR = Q₃ − Q₁)' }[ask]
  return input(`Ano ang ${label} ng datos: ${data.join(', ')}?`, ans, {
    tolerance: 1e-9,
    hints: ['Q₂ ang median ng buong datos.', `Q₁ = median ng lower half (${lower.join(', ')}); Q₃ = median ng upper half (${upper.join(', ')}).`],
    solution: [`Q₁ = ${q1}, Q₂ = ${q2}, Q₃ = ${q3}`, ask === 'iqr' ? `IQR = ${q3} − ${q1} = ${q3 - q1}` : `Sagot: ${ans}`],
  })
}

/** Union and intersection of events from a survey (addition rule) */
export const unionEvents: Generator = () => {
  const total = pick([30, 40, 50, 60])
  const both = ri(3, 9), a = both + ri(5, 15), b = both + ri(5, 15)
  if (a + b - both > total) return unionEvents()
  const [na, nb] = shuffle([['may aso', 'may pusa'], ['naglalaro ng ML', 'naglalaro ng Roblox'], ['kumakain ng almusal', 'umiinom ng kape']])[0]
  const either = a + b - both
  const g = gcd(either, total)
  const askBoth = Math.random() < 0.3
  if (askBoth) {
    const gb = gcd(both, total)
    return input(`Sa ${total} na estudyante, ${a} ang ${na}, ${b} ang ${nb}, at ${both} ang pareho. Kung pipili ng isa nang random, ano ang P(${na} AT ${nb})? (lowest terms)`, frac(both, total), {
      simplest: true, display: `${both / gb}/${total / gb}`,
      hints: ['P(A ∩ B) = (bilang ng pareho) ÷ kabuuan.'], solution: [`${both}/${total} = ${both / gb}/${total / gb}`],
    })
  }
  return input(`Sa ${total} na estudyante, ${a} ang ${na}, ${b} ang ${nb}, at ${both} ang pareho. Kung pipili ng isa nang random, ano ang P(${na} O ${nb})? (lowest terms)`, frac(either, total), {
    simplest: true, display: `${either / g}/${total / g}`, latex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)',
    hints: ['Huwag bilangin nang dalawang beses ang "pareho".'],
    solution: [`(${a} + ${b} − ${both}) / ${total} = ${either}/${total}`, `= ${either / g}/${total / g}`],
  })
}
