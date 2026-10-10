// Grade 8 (MATATAG Key Stage 3) — new stages alongside two-step and real-life linear equations:
// polynomials, special products and factoring, rational expressions, linear inequalities,
// slope/distance/midpoint, systems of equations, the Pythagorean theorem, measures of variability,
// the counting principle, consumer math (profit and loss, best buys, buying on terms), and sequences.
import type { Generator } from '../engine/types'
import { NAMES, pick, ri } from '../engine/rand'
import { choice, coef, fmt, frac, fracText, input, par, peso, round, signed } from './kit'

/** a x^2 + b x + c as LaTeX, skipping zero terms */
const poly = (a: number, b: number, c: number, v = 'x') => {
  const parts: string[] = []
  if (a) parts.push(`${a === 1 ? '' : a === -1 ? '-' : a}${v}^2`)
  if (b) parts.push(parts.length ? `${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}${v}` : `${coef(b, v)}`)
  if (c || !parts.length) parts.push(parts.length ? signed(c) : String(c))
  return parts.join(' ')
}
const bin = (r: number, v = 'x') => `(${v} ${signed(r)})`

/** Combining like terms, multiplying monomials and binomials */
export const polynomials: Generator = () => {
  const kind = pick(['like', 'mono', 'binom'] as const)
  if (kind === 'like') {
    const a = ri(2, 9), b = ri(-8, 8) || 3, c = ri(1, 9), d = ri(-9, 9) || -2
    const ans = poly(0, a + c, b + d)
    return choice('I-simplify sa pamamagitan ng pag-combine ng like terms.', ans, [poly(0, a + c, b - d), poly(0, a - c, b + d), poly(0, a + c + b + d, 0), `${a + c}x^2 ${signed(b + d)}`], {
      latex: `${a}x ${signed(b)} + ${c}x ${signed(d)}`, tex: true,
      hints: ['Pagsamahin ang mga x terms, tapos ang mga constants.', 'Hindi puwedeng pagsamahin ang x at ang numerong walang x.'],
      solution: [`(${a} + ${c})x = ${a + c}x`, `${b} + ${par(d)} = ${b + d}`, `Sagot: ${ans}`],
    })
  }
  if (kind === 'mono') {
    const a = ri(2, 6), b = ri(2, 6), m = ri(1, 4), n = ri(1, 4)
    const ans = `${a * b}x^{${m + n}}`
    return choice('I-multiply.', ans, [`${a * b}x^{${m * n}}`, `${a + b}x^{${m + n}}`, `${a * b}x^{${m + n + 1}}`], {
      latex: `(${a}x^{${m}})(${b}x^{${n}})`, tex: true,
      hints: ['I-multiply ang coefficients.', 'Sa parehong base, i-ADD ang exponents.'],
      solution: [`${a} × ${b} = ${a * b}`, `x^${m} · x^${n} = x^${m + n}`, `Sagot: ${a * b}x^${m + n}`],
    })
  }
  const p = ri(-6, 6) || 2, q = ri(-6, 6) || -3
  const ans = poly(1, p + q, p * q)
  return choice('I-multiply ang dalawang binomial (FOIL).', ans, [poly(1, p * q, p + q), poly(1, 0, p * q), poly(1, p + q, -p * q), poly(1, -(p + q), p * q)], {
    latex: `${bin(p)}${bin(q)}`, tex: true,
    hints: ['FOIL: First, Outer, Inner, Last.', `Middle term: ${p} + ${par(q)} = ${p + q}; last term: ${p} × ${par(q)} = ${p * q}.`],
    solution: [`F: x·x = x²`, `O + I: ${q}x + ${p}x = ${p + q}x`, `L: ${p}·${par(q)} = ${p * q}`, `Sagot: ${ans}`],
  })
}

/** Special products and factoring */
export const specialProducts: Generator = () => {
  const kind = pick(['square', 'dos', 'trinomial', 'gcf'] as const)
  const a = ri(1, 9)
  if (kind === 'square') {
    const s = Math.random() < 0.5 ? a : -a
    const ans = poly(1, 2 * s, s * s)
    return choice('I-expand gamit ang square of a binomial.', ans, [poly(1, 0, s * s), poly(1, s, s * s), poly(1, 2 * s, -s * s)], {
      latex: `${bin(s)}^2`, tex: true,
      hints: ['(a + b)² = a² + 2ab + b²', 'Huwag kalimutan ang middle term!'],
      solution: [`x² + 2(x)(${s}) + ${par(s)}²`, `= ${ans}`],
    })
  }
  if (kind === 'dos') {
    const k = pick([1, 2, 3])
    const ans = `(${k === 1 ? '' : k}x + ${a})(${k === 1 ? '' : k}x - ${a})`
    return choice('I-factor (difference of two squares).', ans, [`(${k === 1 ? '' : k}x - ${a})^2`, `(${k === 1 ? '' : k}x + ${a})^2`, `(${k * k}x + ${a})(x - ${a})`], {
      latex: `${k * k === 1 ? '' : k * k}x^2 - ${a * a}`, tex: true,
      hints: ['a² − b² = (a + b)(a − b)', `Ano ang square root ng ${k * k === 1 ? '' : k * k}x² at ng ${a * a}?`],
      solution: [`${k * k === 1 ? '' : k * k}x² = (${k === 1 ? '' : k}x)², ${a * a} = ${a}²`, `= ${ans}`],
    })
  }
  if (kind === 'gcf') {
    const g = ri(2, 6), p = ri(1, 7), q = ri(1, 9)
    const ans = `${g}x(${p === 1 ? '' : p}x + ${q})`
    return choice('I-factor gamit ang greatest common factor (GCF).', ans, [`${g}(${p}x^2 + ${q}x)`, `x(${g * p}x + ${q})`, `${g}x(${p}x + ${g * q})`], {
      latex: `${g * p}x^2 + ${g * q}x`, tex: true,
      hints: ['Hanapin ang pinakamalaking factor na nasa lahat ng terms — kasama ang x.'],
      solution: [`GCF = ${g}x`, `${g * p}x² ÷ ${g}x = ${p === 1 ? '' : p}x,  ${g * q}x ÷ ${g}x = ${q}`, `= ${ans}`],
    })
  }
  let r1 = ri(-8, 8), r2 = ri(-8, 8)
  while (!r1 || !r2 || r1 === -r2) { r1 = ri(-8, 8); r2 = ri(-8, 8) }
  const ans = `${bin(r1)}${bin(r2)}`
  return choice('I-factor ang trinomial.', ans, [`${bin(-r1)}${bin(-r2)}`, `${bin(r1 + r2)}${bin(1)}`, `${bin(r1 * r2)}${bin(1)}`, `${bin(-r1)}${bin(r2)}`], {
    latex: poly(1, r1 + r2, r1 * r2), tex: true,
    hints: [`Dalawang numero: product = ${r1 * r2}, sum = ${r1 + r2}.`],
    solution: [`${r1} × ${par(r2)} = ${r1 * r2},  ${r1} + ${par(r2)} = ${r1 + r2}`, `= ${ans}`],
  })
}

/** Rational algebraic expressions: simplify, evaluate */
export const rationalExpr: Generator = () => {
  const a = ri(1, 9)
  if (Math.random() < 0.5) {
    const ans = `x + ${a}`
    return choice('I-simplify ang rational expression. (x ≠ ' + a + ')', ans, [`x - ${a}`, `x`, `\\frac{1}{x + ${a}}`], {
      latex: `\\frac{x^2 - ${a * a}}{x - ${a}}`, tex: true,
      hints: ['I-factor ang numerator: difference of two squares.', 'I-cancel ang common factor.'],
      solution: [`x² − ${a * a} = (x + ${a})(x − ${a})`, `I-cancel ang (x − ${a})`, `= x + ${a}`],
    })
  }
  const b = ri(1, 9), x = ri(-5, 9)
  if (x + b === 0) return rationalExpr()
  const num = 2 * x + a, den = x + b
  return input(`Ano ang value ng expression kung x = ${x}? (lowest terms)`, frac(num, den), {
    latex: `\\frac{2x + ${a}}{x + ${b}}`, simplest: true, display: fracText(num, den),
    hints: [`Palitan ang x ng ${x} sa itaas at sa ibaba.`],
    solution: [`(2(${x}) + ${a}) / (${x} + ${b}) = ${num}/${den}`, `= ${fracText(num, den)}`],
  })
}

/** Linear inequalities in one variable (remember to flip when dividing by a negative) */
export const linearIneq: Generator = () => {
  const a = pick([2, 3, 4, 5, -2, -3, -4]), x = ri(-6, 8), b = ri(-10, 10)
  const op = pick(['<', '>', '\\le', '\\ge'] as const)
  const c = a * x + b
  const flip: Record<string, string> = { '<': '>', '>': '<', '\\le': '\\ge', '\\ge': '\\le' }
  const res = a < 0 ? flip[op] : op
  const ans = `x ${res} ${x}`
  return choice('I-solve ang inequality.', ans, [`x ${flip[res]} ${x}`, `x ${res} ${-x}`, `x ${res === '<' || res === '>' ? (res === '<' ? '\\le' : '\\ge') : res === '\\le' ? '<' : '>'} ${x}`], {
    latex: `${coef(a)} ${signed(b)} ${op} ${c}`, tex: true,
    hints: ['Gawin na parang equation: ihiwalay ang x.', a < 0 ? 'Kapag nag-divide sa NEGATIVE, baligtarin ang inequality sign!' : 'Positive ang divisor, kaya hindi babaligtarin ang sign.'],
    solution: [`${coef(a)} ${op} ${c} ${b >= 0 ? '−' : '+'} ${Math.abs(b)} = ${c - b}`, `x ${res} ${c - b} ÷ ${par(a)}${a < 0 ? ' (binaligtad ang sign)' : ''}`, `x ${res} ${x}`],
  })
}

const TRIPLES = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29]]

/** Slope, y-intercept, distance and midpoint on the Cartesian plane */
export const coordinate: Generator = () => {
  const kind = pick(['slope', 'intercept', 'distance', 'midpoint'] as const)
  const x1 = ri(-6, 6), y1 = ri(-6, 6)
  if (kind === 'slope') {
    let x2 = ri(-6, 8)
    if (x2 === x1) x2 += 2
    const y2 = ri(-6, 8)
    return input(`Ano ang slope ng linyang dumadaan sa (${x1}, ${y1}) at (${x2}, ${y2})? (lowest terms)`, frac(y2 - y1, x2 - x1), {
      latex: 'm = \\frac{y_2 - y_1}{x_2 - x_1}', simplest: true, display: fracText(y2 - y1, x2 - x1),
      hints: ['Slope = rise ÷ run = (pagbabago sa y) ÷ (pagbabago sa x).'],
      solution: [`m = (${y2} − ${par(y1)}) / (${x2} − ${par(x1)})`, `m = ${y2 - y1}/${x2 - x1} = ${fracText(y2 - y1, x2 - x1)}`],
    })
  }
  if (kind === 'intercept') {
    const m = ri(-5, 5) || 2, b = ri(-9, 9)
    const askSlope = Math.random() < 0.5
    return input(`Sa linyang y = ${coef(m)} ${signed(b)}, ano ang ${askSlope ? 'slope' : 'y-intercept'}?`, askSlope ? m : b, {
      latex: `y = ${coef(m)} ${signed(b)}`,
      hints: ['Sa y = mx + b: ang m ay slope, ang b ay y-intercept.'], solution: [`m = ${m}, b = ${b}`],
    })
  }
  if (kind === 'distance') {
    const [p, q, r] = pick(TRIPLES)
    const sx = pick([1, -1]), sy = pick([1, -1])
    const x2 = x1 + sx * p, y2 = y1 + sy * q
    return input(`Ano ang layo (distance) ng (${x1}, ${y1}) at (${x2}, ${y2})?`, r, {
      latex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}', topic: 'geometry-coordinate',
      hints: [`Δx = ${x2 - x1}, Δy = ${y2 - y1}.`, 'Gamitin ang Pythagorean theorem.'],
      solution: [`d = √(${par(x2 - x1)}² + ${par(y2 - y1)}²)`, `d = √(${p * p} + ${q * q}) = √${r * r} = ${r}`],
    })
  }
  const x2 = x1 + 2 * ri(-4, 4), y2 = y1 + 2 * ri(-4, 4)
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  return choice(`Ano ang midpoint ng (${x1}, ${y1}) at (${x2}, ${y2})?`, `(${mx}, ${my})`, [`(${my}, ${mx})`, `(${x2 - x1}, ${y2 - y1})`, `(${(x2 - x1) / 2}, ${(y2 - y1) / 2})`, `(${mx + 1}, ${my})`], {
    latex: 'M = \\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)', topic: 'geometry-coordinate',
    hints: ['Kunin ang average ng x\'s at ng y\'s.'],
    solution: [`x: (${x1} + ${par(x2)}) ÷ 2 = ${mx}`, `y: (${y1} + ${par(y2)}) ÷ 2 = ${my}`],
  })
}

/** Systems of linear equations in two variables */
export const systems: Generator = () => {
  const x = ri(-5, 8), y = ri(-5, 8)
  const a1 = ri(1, 4), b1 = pick([1, -1, 2]), a2 = ri(1, 3), b2 = pick([-1, 1, -2, 3])
  if (a1 * b2 === a2 * b1) return systems()
  const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y
  const eq = (a: number, b: number, c: number) => `${coef(a)} ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y = ${c}`
  if (Math.random() < 0.5) {
    const word = Math.random() < 0.5
    if (word) {
      const p1 = ri(8, 20), p2 = ri(21, 45), n1 = ri(2, 9), n2 = ri(1, 6)
      const total = n1 + n2, cost = n1 * p1 + n2 * p2
      return input(`Bumili si ${pick(NAMES)} ng ${total} na item: mga lapis (₱${p1} bawat isa) at mga ballpen (₱${p2} bawat isa). ₱${cost} lahat. Ilan ang ballpen?`, n2, {
        latex: `x + y = ${total},\\; ${p1}x + ${p2}y = ${cost}`,
        hints: ['x = lapis, y = ballpen.', `Mula sa una: x = ${total} − y. Isalit sa pangalawa.`],
        solution: [`${p1}(${total} − y) + ${p2}y = ${cost}`, `${p1 * total} + ${p2 - p1}y = ${cost}`, `y = ${cost - p1 * total} ÷ ${p2 - p1} = ${n2}`],
      })
    }
  }
  return choice('I-solve ang system. Ano ang (x, y)?', `(${x}, ${y})`, [`(${y}, ${x})`, `(${x}, ${-y})`, `(${-x}, ${y})`, `(${x + 1}, ${y - 1})`], {
    latex: `\\begin{cases} ${eq(a1, b1, c1)} \\\\ ${eq(a2, b2, c2)} \\end{cases}`,
    hints: ['Elimination: i-multiply ang isang equation para mag-cancel ang isang variable.', 'O substitution: ihiwalay ang x o y sa isang equation.'],
    solution: [`Check sa una: ${a1}(${x}) + ${par(b1)}(${y}) = ${c1}`, `Check sa pangalawa: ${a2}(${x}) + ${par(b2)}(${y}) = ${c2}`, `(x, y) = (${x}, ${y})`],
  })
}

/** Pythagorean theorem and the triangle inequality */
export const pythagorean: Generator = () => {
  if (Math.random() < 0.25) {
    const a = ri(3, 12), b = ri(3, 12)
    const ok = ri(Math.abs(a - b) + 1, a + b - 1), bad = a + b + ri(0, 4)
    const yes = Math.random() < 0.5
    const c = yes ? ok : bad
    return choice(`Puwede bang maging sides ng isang triangle ang ${a}, ${b} at ${c}?`, yes ? 'Oo' : 'Hindi', [yes ? 'Hindi' : 'Oo'], {
      hints: ['Triangle inequality: ang sum ng alinmang dalawang sides ay dapat MAS MALAKI sa ikatlo.'],
      solution: [`${Math.min(a, b, c)} + ${[a, b, c].sort((p, q) => p - q)[1]} = ${[a, b, c].sort((p, q) => p - q).slice(0, 2).reduce((p, q) => p + q)} ${yes ? '>' : '≤'} ${Math.max(a, b, c)}`, yes ? 'Puwede.' : 'Hindi puwede.'],
    })
  }
  const [p, q, r] = pick(TRIPLES)
  const k = pick([1, 1, 2])
  const [a, b, c] = [p * k, q * k, r * k]
  const findHyp = Math.random() < 0.55
  if (findHyp) return input(`Ang legs ng right triangle ay ${a} cm at ${b} cm. Gaano kahaba ang hypotenuse?`, c, {
    suffix: 'cm', visual: { type: 'rightTriangle', a: `${a}`, b: `${b}`, c: '?' }, latex: 'c^2 = a^2 + b^2',
    hints: ['I-square ang legs at i-add.', 'Kunin ang square root.'], solution: [`c² = ${a * a} + ${b * b} = ${c * c}`, `c = √${c * c} = ${c} cm`],
  })
  return input(`Ang hagdan na ${c} m ang haba ay nakasandal sa pader. Ang paanan nito ay ${a} m mula sa pader. Gaano kataas sa pader ang naaabot nito?`, b, {
    suffix: 'm', visual: { type: 'rightTriangle', a: `${a}`, b: '?', c: `${c}` }, latex: 'b^2 = c^2 - a^2',
    hints: ['Ang hagdan ang hypotenuse.', 'b² = c² − a²'], solution: [`b² = ${c * c} − ${a * a} = ${b * b}`, `b = ${b} m`],
  })
}

/** Range, variance (population) and the fundamental counting principle */
export const variability: Generator = () => {
  if (Math.random() < 0.4) {
    const shirts = ri(2, 6), pants = ri(2, 5), shoes = ri(1, 4)
    return input(`May ${shirts} t-shirt, ${pants} pantalon at ${shoes} pares ng sapatos si ${pick(NAMES)}. Ilang iba't ibang outfit ang puwede niyang buuin?`, shirts * pants * shoes, {
      topic: 'probability-counting', hints: ['Fundamental Counting Principle: i-multiply ang bilang ng pagpipilian sa bawat hakbang.'],
      solution: [`${shirts} × ${pants} × ${shoes} = ${shirts * pants * shoes}`],
    })
  }
  const mean = ri(4, 15)
  const devs = pick([[-2, 0, 2], [-3, -1, 1, 3], [-4, 0, 1, 3], [-2, -2, 1, 3], [-1, 1, -3, 3], [-5, 1, 4]])
  const data = devs.map((d) => mean + d).sort((a, b) => a - b)
  if (Math.random() < 0.45) {
    return input(`Ano ang range ng datos: ${data.join(', ')}?`, data[data.length - 1] - data[0], {
      hints: ['Range = pinakamalaki − pinakamaliit.'], solution: [`${data[data.length - 1]} − ${data[0]} = ${data[data.length - 1] - data[0]}`],
    })
  }
  const v = round(devs.reduce((s, d) => s + d * d, 0) / devs.length, 4)
  return input(`Ano ang variance (population) ng datos: ${data.join(', ')}? (mean = ${mean})`, v, {
    latex: '\\sigma^2 = \\frac{\\sum (x - \\mu)^2}{N}', tolerance: 0.01,
    hints: ['Ibawas ang mean sa bawat datos, tapos i-square.', `I-add lahat, tapos i-divide sa ${devs.length}.`],
    solution: [`(x − μ): ${devs.join(', ')}`, `Squares: ${devs.map((d) => d * d).join(' + ')} = ${devs.reduce((s, d) => s + d * d, 0)}`, `σ² = ${devs.reduce((s, d) => s + d * d, 0)} ÷ ${devs.length} = ${v}`],
  })
}

/** Consumer math: profit/loss, best buys, buying on terms */
export const consumerMath: Generator = () => {
  const kind = pick(['profit', 'best', 'terms'] as const)
  if (kind === 'profit') {
    const cost = ri(20, 200) * 5, pct = pick([10, 15, 20, 25, 30, 40, -10, -20])
    const sell = cost * (1 + pct / 100)
    const gain = sell - cost
    return input(`Binili ni Aling Nena ang isang paninda sa ${peso(cost)} at ibinenta sa ${peso(sell)}. Magkano ang ${gain >= 0 ? 'tubo (profit)' : 'lugi (loss)'}?`, Math.abs(gain), {
      prefix: '₱', tolerance: 0.001,
      hints: ['Tubo = presyo ng benta − puhunan. Kapag negative, lugi ito.'],
      solution: [`${peso(sell)} − ${peso(cost)} = ${peso(gain)}`, gain >= 0 ? `Tubo: ${peso(gain)} (${pct}% ng puhunan)` : `Lugi: ${peso(-gain)}`],
    })
  }
  if (kind === 'best') {
    const item = pick(['shampoo', 'kape', 'gatas', 'mantika'])
    const s1 = pick([100, 200, 250]), s2 = s1 * pick([2, 3, 4])
    const u1 = round(ri(8, 20) / 100, 2), u2 = round(u1 * pick([0.8, 0.9, 1.1, 1.2]), 3)
    const p1 = round(s1 * u1, 2), p2 = round(s2 * u2, 2)
    const best = u1 < u2 ? `${s1} mL sa ${peso(p1)}` : `${s2} mL sa ${peso(p2)}`
    return choice(`Alin ang mas sulit (best buy) na ${item}?`, best, [`${s1} mL sa ${peso(p1)}`, `${s2} mL sa ${peso(p2)}`, 'Pareho lang'], {
      hints: ['Kunin ang presyo bawat mL (unit price): presyo ÷ dami.', 'Ang mas mababang unit price ang mas sulit.'],
      solution: [`${peso(p1)} ÷ ${s1} = ₱${round(p1 / s1, 4)} bawat mL`, `${peso(p2)} ÷ ${s2} = ₱${round(p2 / s2, 4)} bawat mL`, `Mas sulit: ${best}`],
    })
  }
  const cash = ri(30, 150) * 100, down = round(cash * pick([0.1, 0.2]), 2), months = pick([6, 12]), mo = round((cash * pick([1.1, 1.15, 1.2]) - down) / months, 0)
  const total = down + mo * months
  return input(`Ang cellphone ay ${peso(cash)} kapag cash. Sa hulugan: ${peso(down)} na downpayment at ${peso(mo)} bawat buwan sa loob ng ${months} buwan. Magkano ang sobra kapag hulugan?`, round(total - cash, 2), {
    prefix: '₱', tolerance: 0.011,
    hints: ['Kabuuang hulugan = downpayment + (hulog × bilang ng buwan).', 'Ibawas ang cash price.'],
    solution: [`${peso(down)} + ${peso(mo)} × ${months} = ${peso(total)}`, `${peso(total)} − ${peso(cash)} = ${peso(round(total - cash, 2))}`],
  })
}

/** Geometric sequences: next term and nth term */
export const geometricSeq: Generator = () => {
  const a = ri(1, 6), r = pick([2, 3, -2, 4, 5])
  const terms = Array.from({ length: 6 }, (_, i) => a * r ** i)
  if (Math.random() < 0.5) {
    return input('Ano ang susunod na term ng geometric sequence?', terms[4], {
      visual: { type: 'sequence', items: [...terms.slice(0, 4).map(String), null] },
      hints: ['I-divide ang isang term sa nauna para makuha ang common ratio r.'],
      solution: [`r = ${terms[1]} ÷ ${terms[0]} = ${r}`, `${terms[3]} × ${par(r)} = ${terms[4]}`],
    })
  }
  const n = ri(5, 7)
  return input(`Ano ang ika-${n} term ng geometric sequence na ${terms.slice(0, 3).join(', ')}, …?`, a * r ** (n - 1), {
    latex: 'a_n = a_1 r^{n-1}',
    hints: [`a₁ = ${a}, r = ${r}.`], solution: [`a_${n} = ${a} × ${par(r)}^${n - 1}`, `= ${fmt(a * r ** (n - 1))}`],
  })
}

