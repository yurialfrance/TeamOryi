// SHS General Mathematics sampler (Functions & Logic) and College GE "Mathematics in the Modern
// World" sampler (codes, voting, graphs, data). Pairs with shs.ts (interest) and college.ts (patterns).
import type { Generator } from '../engine/types'
import { NAMES, pick, ri, shuffle } from '../engine/rand'
import { choice, coef, fmt, input, peso, round, signed } from './kit'

// ---------------------------------------------------------------- General Mathematics

/** Evaluating and composing functions */
export const composeFunctions: Generator = () => {
  const a = ri(2, 5), b = ri(-6, 6), c = ri(1, 3), d = ri(-5, 5), x = ri(-3, 4)
  const f = (t: number) => a * t + b, g = (t: number) => c * t * t + d
  const fTex = `${coef(a)} ${signed(b)}`, gTex = `${c === 1 ? '' : c}x^2 ${signed(d)}`
  const kind = pick(['fg', 'gf', 'sum'] as const)
  const val = kind === 'fg' ? f(g(x)) : kind === 'gf' ? g(f(x)) : f(x) + g(x)
  const label = kind === 'fg' ? `(f ∘ g)(${x})` : kind === 'gf' ? `(g ∘ f)(${x})` : `(f + g)(${x})`
  return input(`Kung f(x) = ${fTex.replace(/\^2/, '²')} at g(x) = ${gTex.replace(/\^2/, '²')}, ano ang ${label}?`, val, {
    latex: `f(x) = ${fTex},\\; g(x) = ${gTex}`,
    hints: kind === 'sum' ? ['(f + g)(x) = f(x) + g(x)'] : [`${kind === 'fg' ? 'f(g(x))' : 'g(f(x))'}: unahin ang nasa loob.`],
    solution: kind === 'fg' ? [`g(${x}) = ${g(x)}`, `f(${g(x)}) = ${val}`] : kind === 'gf' ? [`f(${x}) = ${f(x)}`, `g(${f(x)}) = ${val}`] : [`f(${x}) = ${f(x)}, g(${x}) = ${g(x)}`, `${f(x)} + ${g(x)} = ${val}`],
  })
}

/** Exponential equations with a common base */
export const exponentialEq: Generator = () => {
  const base = pick([2, 3, 5]), x = ri(1, base === 2 ? 6 : 4), k = pick([0, 1, -1, 2])
  const rhs = base ** (x + k)
  return input('I-solve para sa x.', `x=${x}`, {
    latex: `${base}^{x ${signed(k)}} = ${fmt(rhs)}`.replace(' + 0', ''), prefix: 'x =', display: `x = ${x}`,
    hints: [`Isulat ang ${fmt(rhs)} bilang power ng ${base}.`, 'Kapag pareho ang base, magkapantay ang exponents.'],
    solution: [`${fmt(rhs)} = ${base}^${x + k}`, `x ${signed(k)} = ${x + k}`.replace(' + 0', ''), `x = ${x}`],
  })
}

/** Logarithms: evaluate, and convert between log and exponential form */
export const logarithms: Generator = () => {
  const base = pick([2, 3, 4, 5, 10]), e = ri(base === 10 ? 1 : 2, base === 2 ? 7 : base === 10 ? 5 : 4)
  const n = base ** e
  if (Math.random() < 0.6) {
    return input('Ano ang value?', e, {
      latex: `\\log_{${base}} ${fmt(n).replace(/,/g, '{,}')}`,
      hints: [`Itanong: ${base} sa anong power ang ${fmt(n)}?`], solution: [`${base}^${e} = ${fmt(n)}`, `log_${base} ${fmt(n)} = ${e}`],
    })
  }
  return choice('Isulat sa exponential form.', `${base}^{${e}} = ${n}`, [`${e}^{${base}} = ${n}`, `${n}^{${e}} = ${base}`, `${base}^{${n}} = ${e}`], {
    latex: `\\log_{${base}} ${n} = ${e}`, tex: true,
    hints: ['log_b N = e ay katumbas ng bᵉ = N.'], solution: [`log_${base} ${n} = ${e} ⇔ ${base}^${e} = ${n}`],
  })
}

/** Simple ordinary annuity: future value (whole-year periods) */
export const annuity: Generator = () => {
  const R = ri(1, 10) * 1000, r = pick([0.02, 0.03, 0.04, 0.05, 0.06]), n = ri(3, 8)
  const F = round(R * (((1 + r) ** n - 1) / r), 2)
  return input(`Nag-iipon si ${pick(NAMES)} ng ${peso(R)} sa katapusan ng bawat taon sa loob ng ${n} taon, ${round(r * 100, 0)}% interest compounded annually. Magkano ang future value?`, F, {
    prefix: '₱', tolerance: 0.011, latex: 'F = R\\cdot\\frac{(1 + j)^n - 1}{j}',
    hints: [`R = ${fmt(R)}, j = ${r}, n = ${n}`, `(1 + ${r})^${n} = ${round((1 + r) ** n, 6)}`],
    solution: [`F = ${fmt(R)} × ((1.${String(round(r * 100, 0)).padStart(2, '0')})^${n} − 1) / ${r}`, `F = ${peso(F)}`],
  })
}

/** Propositions: truth values of compound statements */
export const propositions: Generator = () => {
  const p = Math.random() < 0.5, q = Math.random() < 0.5
  const ops = [
    ['p \\land q', p && q, 'Ang AND (∧) ay true lang kapag parehong true.'],
    ['p \\lor q', p || q, 'Ang OR (∨) ay false lang kapag parehong false.'],
    ['p \\to q', !p || q, 'Ang conditional (→) ay false lang kapag T → F.'],
    ['p \\leftrightarrow q', p === q, 'Ang biconditional (↔) ay true kapag pareho ang truth value.'],
    ['\\lnot p \\lor q', !p || q, 'Unahin ang negation (¬), tapos ang OR.'],
    ['\\lnot (p \\land q)', !(p && q), 'Unahin ang nasa loob ng panaklong, tapos i-negate.'],
  ] as const
  const [expr, val, rule] = pick(ops)
  const T = (b: boolean) => (b ? 'True' : 'False')
  return choice(`Kung ang p ay ${T(p)} at ang q ay ${T(q)}, ano ang truth value?`, T(val), [T(!val)], {
    latex: expr, hints: [rule], solution: [`p = ${T(p)}, q = ${T(q)}`, `${rule}`, `Sagot: ${T(val)}`],
  })
}

// ---------------------------------------------------------------- Mathematics in the Modern World

/** Check digits: ISBN-10 (mod 11) and UPC-A (mod 10) */
export const checkDigits: Generator = () => {
  if (Math.random() < 0.5) {
    const d = Array.from({ length: 9 }, () => ri(0, 9))
    const s = d.reduce((acc, x, i) => acc + x * (10 - i), 0)
    const c = (11 - (s % 11)) % 11
    if (c === 10) return checkDigits() // would be "X"
    return input(`Ano ang check digit ng ISBN-10: ${d.join('')}? (Ang weighted sum ng 10 digits ay dapat divisible by 11.)`, c, {
      hints: ['I-multiply ang digits sa 10, 9, 8, … 2.', 'Hanapin ang c (0–9) para ang kabuuan + c ay multiple ng 11.'],
      solution: [`Weighted sum = ${s}`, `${s} + ${c} = ${s + c} = 11 × ${(s + c) / 11}`, `Check digit: ${c}`],
    })
  }
  const d = Array.from({ length: 11 }, () => ri(0, 9))
  const s = d.reduce((acc, x, i) => acc + x * (i % 2 === 0 ? 3 : 1), 0)
  const c = (10 - (s % 10)) % 10
  return input(`Ano ang check digit ng UPC: ${d.join('')}? (Odd positions × 3, even positions × 1; dapat multiple ng 10 ang kabuuan.)`, c, {
    hints: ['I-multiply sa 3 ang digits sa 1st, 3rd, 5th… na posisyon.', 'Hanapin ang c para ang kabuuan ay multiple ng 10.'],
    solution: [`Weighted sum = ${s}`, `${s} + ${c} = ${s + c}`, `Check digit: ${c}`],
  })
}

/** Voting methods: plurality and Borda count from a preference table */
export const voting: Generator = () => {
  const cands = shuffle(['Ana', 'Ben', 'Carlo'])
  const orders = [[0, 1, 2], [1, 2, 0], [2, 1, 0], [1, 0, 2]]
  const votes = orders.map(() => ri(2, 12))
  const plurality = Math.random() < 0.5
  const score = [0, 0, 0]
  orders.forEach((o, i) => {
    if (plurality) score[o[0]] += votes[i]
    else o.forEach((c, rank) => (score[c] += votes[i] * (2 - rank)))
  })
  const best = Math.max(...score)
  if (score.filter((s) => s === best).length > 1) return voting()
  const winner = cands[score.indexOf(best)]
  const rows = [['Botante', '1st', '2nd', '3rd'], ...orders.map((o, i) => [String(votes[i]), ...o.map((c) => cands[c])])]
  return choice(`Sino ang panalo gamit ang ${plurality ? 'plurality method (pinakamaraming 1st choice)' : 'Borda count (1st = 2 pts, 2nd = 1 pt, 3rd = 0)'}?`, winner, cands, {
    visual: { type: 'table', rows },
    hints: plurality ? ['Bilangin lang ang 1st-choice votes ng bawat kandidato.'] : ['I-multiply ang bilang ng botante sa puntos ng ranggo.', 'I-add ang puntos ng bawat kandidato.'],
    solution: [cands.map((c, i) => `${c}: ${score[i]}`).join(', '), `Panalo: ${winner}`],
  })
}

/** Graph theory: handshake lemma and Euler paths/circuits */
export const graphTheory: Generator = () => {
  if (Math.random() < 0.5) {
    const degs = Array.from({ length: ri(4, 6) }, () => ri(1, 5))
    if (degs.reduce((a, b) => a + b, 0) % 2) degs[0]++
    const sum = degs.reduce((a, b) => a + b, 0)
    return input(`Ang degrees ng mga vertex ng isang graph ay ${degs.join(', ')}. Ilan ang edges?`, sum / 2, {
      hints: ['Handshake lemma: ang sum ng degrees = 2 × (bilang ng edges).'], solution: [`Sum = ${sum}`, `Edges = ${sum} ÷ 2 = ${sum / 2}`],
    })
  }
  const odd = pick([0, 2, 4])
  const degs = shuffle([...Array.from({ length: odd }, () => pick([1, 3, 5])), ...Array.from({ length: ri(3, 5) - Math.min(odd, 2) }, () => pick([2, 4]))])
  const ans = odd === 0 ? 'Euler circuit (at path)' : odd === 2 ? 'Euler path lang' : 'Wala'
  return choice(`Ang connected graph ay may vertices na may degrees ${degs.join(', ')}. Mayroon ba itong Euler path o circuit?`, ans, ['Euler circuit (at path)', 'Euler path lang', 'Wala'], {
    hints: ['0 odd-degree vertices → Euler circuit.', '2 odd-degree vertices → Euler path (hindi circuit).', 'Higit sa 2 → wala.'],
    solution: [`Odd-degree vertices: ${odd}`, `Sagot: ${ans}`],
  })
}

/** Linear regression: predicting with a fitted line; reading correlation */
export const regression: Generator = () => {
  if (Math.random() < 0.6) {
    const m = round(ri(5, 40) / 10, 1), b = ri(5, 40), x = ri(3, 15)
    const y = round(m * x + b, 2)
    return input(`Ang regression line ng marka (y) at oras ng pag-aaral (x) ay ŷ = ${m}x + ${b}. Ano ang hinuhulaang marka kapag ${x} oras nag-aral?`, y, {
      tolerance: 0.011, latex: `\\hat{y} = ${m}x + ${b}`,
      hints: [`Palitan ang x ng ${x}.`], solution: [`ŷ = ${m}(${x}) + ${b} = ${y}`],
    })
  }
  const r = pick([0.92, 0.65, 0.08, -0.12, -0.71, -0.95])
  const ans = Math.abs(r) >= 0.8 ? (r > 0 ? 'Malakas na positive correlation' : 'Malakas na negative correlation') : Math.abs(r) >= 0.5 ? (r > 0 ? 'Katamtamang positive correlation' : 'Katamtamang negative correlation') : 'Mahina o halos walang correlation'
  return choice(`Ang correlation coefficient ay r = ${r}. Ano ang ibig sabihin nito?`, ans, ['Malakas na positive correlation', 'Malakas na negative correlation', 'Katamtamang positive correlation', 'Katamtamang negative correlation', 'Mahina o halos walang correlation'], {
    hints: ['Ang sign ang direksyon; ang laki (malapit sa 1) ang lakas.', '|r| ≥ 0.8 malakas, 0.5–0.8 katamtaman, < 0.5 mahina.'],
    solution: [`|r| = ${Math.abs(r)} → ${ans}`],
  })
}
