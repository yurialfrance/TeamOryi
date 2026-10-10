// Grade 9 (MATATAG): Quadratic equations & functions — "Kurba ng Bola"
import type { Generator } from '../engine/types'
import { gcd, pick, ri, shuffle, uid } from '../engine/rand'
import { choice, coef, input, signed } from './kit'

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

// ---------------------------------------------------------------- MATATAG Grade 9 additions:
// relations and functions, linear functions, variation, parallel lines and similarity,
// trigonometric ratios (incl. special right triangles), and probability of compound events.

/** Relations and functions: is it a function? evaluate f(x) */
export const functionsGen: Generator = () => {
  if (Math.random() < 0.45) {
    const xs = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4)
    const isFn = Math.random() < 0.5
    const pairs = xs.map((x) => [x, ri(-5, 9)])
    if (!isFn) pairs.push([xs[ri(0, 3)], ri(10, 15)])
    const text = `{${pairs.map(([x, y]) => `(${x}, ${y})`).join(', ')}}`
    return choice(`Function ba ang relation na ito? ${text}`, isFn ? 'Oo, function' : 'Hindi function', [isFn ? 'Hindi function' : 'Oo, function'], {
      hints: ['Sa function, bawat x ay may IISANG y lang.', 'Hanapin kung may x na umuulit na iba ang y.'],
      solution: isFn ? ['Walang x na umuulit → function.'] : ['May x na dalawa ang y → hindi function.'],
    })
  }
  const a = ri(-4, 5) || 2, b = ri(-9, 9), x = ri(-5, 6)
  return input(`Kung f(x) = ${coef(a)} ${signed(b)}, ano ang f(${x})?`, a * x + b, {
    latex: `f(${x}) = ?`,
    hints: [`Palitan ang x ng ${x}.`], solution: [`f(${x}) = ${a}(${x}) ${signed(b)} = ${a * x + b}`],
  })
}

/** Linear functions: slope, intercepts and zero */
export const linearFunction: Generator = () => {
  const m = pick([1, 2, 3, -1, -2, -3, 4]), z = ri(-6, 6)
  const b = -m * z
  const kind = pick(['zero', 'yint', 'slope'] as const)
  const f = b === 0 ? coef(m) : `${coef(m)} ${signed(b)}`
  if (kind === 'slope') return input(`Ano ang slope ng f(x) = ${f}?`, m, { latex: `f(x) = ${f}`, hints: ['Ang coefficient ng x ang slope.'], solution: [`m = ${m}`] })
  if (kind === 'yint') return input(`Ano ang y-intercept ng f(x) = ${f}?`, b, { latex: `f(x) = ${f}`, hints: ['Ilagay ang x = 0.'], solution: [`f(0) = ${b}`] })
  return input(`Ano ang zero (x-intercept) ng f(x) = ${f}?`, `x=${z}`, {
    latex: `f(x) = ${f}`, prefix: 'x =', display: `x = ${z}`,
    hints: ['Ang zero ay ang x kung saan f(x) = 0.', `I-solve ang ${f} = 0.`],
    solution: [`${f} = 0`, `${coef(m)} = ${-b}`, `x = ${z}`],
  })
}

/** Direct and inverse variation */
export const variationGen: Generator = () => {
  const direct = Math.random() < 0.5
  const k = ri(2, 12), x1 = ri(2, 9)
  let x2 = ri(2, 12)
  if (x2 === x1) x2++
  if (direct) {
    const y1 = k * x1
    return input(`Ang y ay directly proportional sa x. Kung y = ${y1} kapag x = ${x1}, ano ang y kapag x = ${x2}?`, k * x2, {
      latex: 'y = kx',
      hints: ['Hanapin muna ang k: k = y ÷ x.'], solution: [`k = ${y1} ÷ ${x1} = ${k}`, `y = ${k} × ${x2} = ${k * x2}`],
    })
  }
  const kk = x1 * x2 * ri(1, 4)
  const y1 = kk / x1, y2 = kk / x2
  return input(`Ang y ay inversely proportional sa x. Kung y = ${y1} kapag x = ${x1}, ano ang y kapag x = ${x2}?`, y2, {
    latex: 'y = \\frac{k}{x}', tolerance: 1e-9,
    hints: ['Hanapin muna ang k: k = x × y.'], solution: [`k = ${x1} × ${y1} = ${kk}`, `y = ${kk} ÷ ${x2} = ${y2}`],
  })
}

/** Angles formed by parallel lines cut by a transversal; similar triangles */
export const transversalSimilar: Generator = () => {
  if (Math.random() < 0.6) {
    const a = ri(35, 145)
    if (a === 90) return transversalSimilar()
    const pairs = [
      ['corresponding angles', a, 'Magkapantay ang corresponding angles.'],
      ['alternate interior angles', a, 'Magkapantay ang alternate interior angles.'],
      ['alternate exterior angles', a, 'Magkapantay ang alternate exterior angles.'],
      ['same-side interior angles', 180 - a, 'Supplementary (180°) ang same-side interior angles.'],
      ['linear pair', 180 - a, 'Ang linear pair ay supplementary (180°).'],
    ] as const
    const [name, ans, rule] = pick(pairs)
    return input(`Dalawang parallel lines ang tinawid ng transversal. Ang isang angle ay ${a}°. Gaano kalaki ang ${name} nito?`, ans, {
      suffix: '°', hints: [rule], solution: [rule, ans === a ? `Sagot: ${a}°` : `180° − ${a}° = ${ans}°`],
    })
  }
  const k = pick([2, 3, 1.5, 2.5]), a = ri(2, 8) * 2, b = ri(3, 9) * 2
  return input(`Magkasimilar (similar) ang dalawang triangle. Sa maliit, ang mga sides ay ${a} cm at ${b} cm. Sa malaki, ang katapat ng ${a} cm ay ${a * k} cm. Gaano kahaba ang katapat ng ${b} cm?`, b * k, {
    suffix: 'cm', tolerance: 1e-9, topic: 'geometry-congruence-similarity',
    hints: ['Proportional ang katapat na sides ng similar triangles.', `Scale factor = ${a * k} ÷ ${a}.`],
    solution: [`Scale factor = ${a * k} ÷ ${a} = ${k}`, `${b} × ${k} = ${b * k} cm`],
  })
}

const SPECIAL = [
  ['\\sin 30^\\circ', '\\frac{1}{2}', 'sin 30° = 1/2'], ['\\cos 60^\\circ', '\\frac{1}{2}', 'cos 60° = 1/2'], ['\\tan 45^\\circ', '1', 'tan 45° = 1'],
  ['\\sin 45^\\circ', '\\frac{\\sqrt{2}}{2}', 'sin 45° = √2/2'], ['\\cos 30^\\circ', '\\frac{\\sqrt{3}}{2}', 'cos 30° = √3/2'],
  ['\\tan 60^\\circ', '\\sqrt{3}', 'tan 60° = √3'], ['\\sin 60^\\circ', '\\frac{\\sqrt{3}}{2}', 'sin 60° = √3/2'],
] as const

/** Trigonometric ratios in right triangles, special angles */
export const trigRatios: Generator = () => {
  if (Math.random() < 0.35) {
    const [q, ans, sol] = pick(SPECIAL)
    return choice('Ano ang exact value?', ans, ['\\frac{1}{2}', '1', '\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{3}}{2}', '\\sqrt{3}', '\\frac{\\sqrt{3}}{3}'], {
      latex: q, tex: true, display: sol,
      hints: ['Alalahanin ang 30-60-90 (1 : √3 : 2) at 45-45-90 (1 : 1 : √2) triangles.'],
      solution: [sol],
    })
  }
  const [p, q, r] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10]])
  const ratio = pick(['sin', 'cos', 'tan'] as const)
  // θ is the angle opposite side p
  const [num, den] = ratio === 'sin' ? [p, r] : ratio === 'cos' ? [q, r] : [p, q]
  const g = gcd(num, den)
  return input(`Sa right triangle, ang side na katapat (opposite) ng angle θ ay ${p}, ang katabi (adjacent) ay ${q}, at ang hypotenuse ay ${r}. Ano ang ${ratio} θ?`, `\\frac{${num / g}}{${den / g}}`, {
    visual: { type: 'rightTriangle', a: String(q), b: String(p), c: String(r), angle: 'θ' }, simplest: true,
    display: `${num / g}/${den / g}`,
    hints: ['SOH-CAH-TOA: sin = opp/hyp, cos = adj/hyp, tan = opp/adj.'],
    solution: [`${ratio} θ = ${ratio === 'sin' ? 'opp/hyp' : ratio === 'cos' ? 'adj/hyp' : 'opp/adj'} = ${num}/${den}${g > 1 ? ` = ${num / g}/${den / g}` : ''}`],
  })
}

/** Probability of compound events: independent "and", mutually exclusive "or", complement */
export const compoundProb: Generator = () => {
  const kind = pick(['and', 'or', 'not'] as const)
  if (kind === 'and') {
    const [e1, p1n, p1d] = pick([['heads sa barya', 1, 2], ['6 sa die', 1, 6], ['even sa die', 1, 2]] as const)
    const [e2, p2n, p2d] = pick([['heads sa pangalawang barya', 1, 2], ['3 sa pangalawang die', 1, 6], ['pula sa spinner na may 4 na pantay na kulay', 1, 4]] as const)
    const n = p1n * p2n, d = p1d * p2d
    const g = gcd(n, d)
    return input(`Ano ang probability na makakuha ng ${e1} AT ${e2}? (independent events)`, `\\frac{${n / g}}{${d / g}}`, {
      simplest: true, display: `${n / g}/${d / g}`,
      hints: ['Sa independent events: P(A at B) = P(A) × P(B).'],
      solution: [`${p1n}/${p1d} × ${p2n}/${p2d} = ${n / g}/${d / g}`],
    })
  }
  if (kind === 'or') {
    const [desc, f] = pick([['king o queen', 8], ['ace o king', 8], ['heart o diamond', 26], ['jack, queen o king', 12]] as const)
    const g = gcd(f, 52)
    return input(`Mula sa standard na deck ng 52 cards, ano ang probability na mabunot ang ${desc}? (lowest terms)`, `\\frac{${f / g}}{${52 / g}}`, {
      simplest: true, display: `${f / g}/${52 / g}`,
      hints: ['Mutually exclusive: P(A o B) = P(A) + P(B).'],
      solution: [`P = ${f}/52 = ${f / g}/${52 / g}`],
    })
  }
  const r = ri(1, 9), t = ri(r + 2, 12)
  const g = gcd(t - r, t)
  return input(`Ang probability na umulan bukas ay ${r}/${t}. Ano ang probability na HINDI uulan? (lowest terms)`, `\\frac{${(t - r) / g}}{${t / g}}`, {
    simplest: true, display: `${(t - r) / g}/${t / g}`,
    hints: ['Complement: P(hindi A) = 1 − P(A).'],
    solution: [`1 − ${r}/${t} = ${t - r}/${t}${g > 1 ? ` = ${(t - r) / g}/${t / g}` : ''}`],
  })
}
