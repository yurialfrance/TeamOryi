// SHS STEM sampler: Pre-Calculus (conic sections, unit circle and radians) and Basic Calculus
// (limits, derivatives by the power rule, definite integrals of polynomials). Every answer is a
// number the code computes; the Tutor's calculus engine re-checks the same problems in tests.
import type { Generator } from '../engine/types'
import { pick, ri } from '../engine/rand'
import { choice, frac, fracText, input, signed } from './kit'

/** Polynomial c0 + c1 x + c2 x^2 + … as LaTeX (highest power first) */
export function polyTex(cs: number[]): string {
  const terms: string[] = []
  for (let p = cs.length - 1; p >= 0; p--) {
    const c = cs[p]
    if (!c) continue
    const body = p === 0 ? String(Math.abs(c)) : `${Math.abs(c) === 1 ? '' : Math.abs(c)}x${p > 1 ? `^{${p}}` : ''}`
    terms.push(terms.length ? `${c < 0 ? '-' : '+'} ${body}` : `${c < 0 ? '-' : ''}${body}`)
  }
  return terms.join(' ') || '0'
}
const evalPoly = (cs: number[], x: number) => cs.reduce((s, c, p) => s + c * x ** p, 0)

/** Conic sections: identify the conic, or read the vertex / center */
export const conics: Generator = () => {
  const kind = pick(['identify', 'parabola', 'ellipse'] as const)
  if (kind === 'identify') {
    const a = ri(2, 9), b = ri(2, 9)
    const forms = [
      [`x^2 + y^2 = ${a * a}`, 'Circle'], [`\\frac{x^2}{${a * a}} + \\frac{y^2}{${(b + a) * (b + a)}} = 1`, 'Ellipse'],
      [`y = ${a}x^2`, 'Parabola'], [`\\frac{x^2}{${a * a}} - \\frac{y^2}{${b * b}} = 1`, 'Hyperbola'], [`x = ${-a}y^2`, 'Parabola'],
    ] as const
    const [eq, ans] = pick(forms)
    return choice('Anong conic section ang equation?', ans, ['Circle', 'Ellipse', 'Parabola', 'Hyperbola'], {
      latex: eq,
      hints: ['Isa lang ang squared variable → parabola.', 'Parehong squared: + at magkaibang denominator → ellipse; − → hyperbola; pareho ang coefficient → circle.'],
      solution: [`${ans}`],
    })
  }
  if (kind === 'parabola') {
    const h = ri(-6, 6), k = ri(-6, 6), a = pick([1, -1, 2, -2])
    return choice('Ano ang vertex ng parabola?', `(${h}, ${k})`, [`(${-h}, ${k})`, `(${h}, ${-k})`, `(${k}, ${h})`, `(${-h}, ${-k})`], {
      latex: `y = ${a === 1 ? '' : a === -1 ? '-' : a}(x ${signed(-h)})^2 ${signed(k)}`.replace('(x + 0)', 'x').replace('(x - 0)', 'x').replace(' + 0', ''),
      hints: ['Vertex form: y = a(x − h)² + k → vertex (h, k).'], solution: [`h = ${h}, k = ${k}`],
    })
  }
  const h = ri(-5, 5), k = ri(-5, 5), A = ri(3, 7), B = ri(1, A - 1)
  return input(`Ang ellipse ay may equation na nasa itaas. Gaano kahaba ang major axis?`, 2 * A, {
    latex: `\\frac{(x ${signed(-h)})^2}{${A * A}} + \\frac{(y ${signed(-k)})^2}{${B * B}} = 1`,
    hints: ['Ang mas malaking denominator ay a².', 'Major axis = 2a.'], solution: [`a² = ${A * A} → a = ${A}`, `Major axis = 2(${A}) = ${2 * A}`],
  })
}

/** Unit circle: degree ↔ radian, exact trig values */
export const unitCircle: Generator = () => {
  const deg = pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 270, 300, 315, 360])
  const g = (a: number, b: number) => { while (b) [a, b] = [b, a % b]; return a }
  const n = deg / g(deg, 180), d = 180 / g(deg, 180)
  const radText = `${n === 1 ? '' : n}π${d === 1 ? '' : `/${d}`}`
  const radTex = d === 1 ? `${n === 1 ? '' : n}\\pi` : `\\frac{${n === 1 ? '' : n}\\pi}{${d}}`
  if (Math.random() < 0.5) {
    const toRad = Math.random() < 0.5
    if (toRad) return choice(`Isulat ang ${deg}° sa radians.`, radTex, [`\\frac{${deg}}{\\pi}`, `\\frac{\\pi}{${d * 2}}`, `\\frac{${n + 1}\\pi}{${d}}`, `${deg}\\pi`], {
      tex: true, display: radText,
      hints: ['I-multiply sa π/180.'], solution: [`${deg} × π/180 = ${radText}`],
    })
    return input(`Ilang degrees ang radian measure na ito?`, deg, {
      latex: radTex, suffix: '°', hints: ['I-multiply sa 180/π.', 'π rad = 180°'], solution: [`(${radText}) × 180/π = ${deg}°`],
    })
  }
  const vals: Record<number, [string, string]> = {
    0: ['0', '1'], 30: ['\\frac{1}{2}', '\\frac{\\sqrt{3}}{2}'], 45: ['\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{2}}{2}'], 60: ['\\frac{\\sqrt{3}}{2}', '\\frac{1}{2}'], 90: ['1', '0'],
  }
  const ref = deg % 180 === 0 ? 0 : deg % 90 === 0 ? 90 : [30, 45, 60].find((r) => [r, 180 - r, 180 + r, 360 - r].includes(deg))!
  const fn = pick(['sin', 'cos'] as const)
  const q = deg <= 90 ? 1 : deg < 180 ? 2 : deg < 270 ? 3 : 4
  const base = vals[ref][fn === 'sin' ? 0 : 1]
  const neg = base !== '0' && (fn === 'sin' ? (deg > 180 && deg < 360) : (deg > 90 && deg < 270))
  const ans = neg ? `-${base}` : base
  return choice(`Ano ang exact value?`, ans, [base, `-${base}`, vals[ref][fn === 'sin' ? 1 : 0], `-${vals[ref][fn === 'sin' ? 1 : 0]}`].map((s) => s.replace('-0', '0')), {
    latex: `\\${fn}\\left(${radTex}\\right)`, tex: true, display: ans,
    hints: [`Reference angle: ${ref}°.`, `Quadrant ${q}: ${fn === 'sin' ? 'positive ang sin sa Q1 at Q2' : 'positive ang cos sa Q1 at Q4'}.`],
    solution: [`${deg}° → reference ${ref}°, Quadrant ${q}`, `${fn} ${deg}° = ${ans}`],
  })
}

/** Limits: direct substitution, or factor-and-cancel for 0/0 */
export const limits: Generator = () => {
  if (Math.random() < 0.5) {
    const a = ri(-4, 5), cs = [ri(-9, 9), ri(-5, 5), ri(-3, 3) || 1]
    return input('Hanapin ang limit.', evalPoly(cs, a), {
      latex: `\\lim_{x \\to ${a}} \\left(${polyTex(cs)}\\right)`,
      hints: ['Polynomial ito — tuloy-tuloy (continuous), kaya direct substitution lang.'],
      solution: [`Palitan ang x ng ${a}`, `= ${evalPoly(cs, a)}`],
    })
  }
  const a = ri(-6, 6) || 3, b = ri(-6, 6)
  // (x - a)(x - b) / (x - a) → x - b at x = a
  const num = polyTex([a * b, -(a + b), 1])
  return input('Hanapin ang limit.', a - b, {
    latex: `\\lim_{x \\to ${a}} \\frac{${num}}{${a === 0 ? 'x' : `x ${signed(-a)}`}}`,
    hints: [`Kapag direct substitution: 0/0. I-factor muna ang numerator.`, `(x ${signed(-a)})(x ${signed(-b)}) — i-cancel ang (x ${signed(-a)}).`],
    solution: [`= lim (x ${signed(-b)})`, `= ${a} ${signed(-b)} = ${a - b}`],
  })
}

/** Derivatives: power rule, evaluate f'(a), slope of the tangent */
export const derivatives: Generator = () => {
  const cs = [ri(-9, 9), ri(-6, 6), ri(-4, 4), ri(1, 3) * pick([1, -1])]
  const d = cs.slice(1).map((c, i) => c * (i + 1))
  if (Math.random() < 0.5) {
    const ans = polyTex(d)
    const wrong = [polyTex(cs.slice(1)), polyTex(d.map((c, i) => (i === 0 ? c + cs[0] : c))), polyTex(d.map((c, i) => c * (i === d.length - 1 ? 2 : 1))), polyTex([...d.slice(0, -1), cs[3]])]
    return choice("Ano ang f'(x)?", ans, wrong, {
      latex: `f(x) = ${polyTex(cs)}`, tex: true,
      hints: ['Power rule: d/dx (xⁿ) = n·xⁿ⁻¹.', 'Ang derivative ng constant ay 0.'],
      solution: [`f'(x) = ${ans}`],
    })
  }
  const a = ri(-3, 3)
  const v = d.reduce((s, c, p) => s + c * a ** p, 0)
  return input(`Ano ang slope ng tangent line sa x = ${a}? (f'(${a}))`, v, {
    latex: `f(x) = ${polyTex(cs)}`,
    hints: ["Kunin muna ang f'(x) gamit ang power rule.", `Tapos palitan ang x ng ${a}.`],
    solution: [`f'(x) = ${polyTex(d)}`, `f'(${a}) = ${v}`],
  })
}

/** Definite integrals of polynomials (Fundamental Theorem of Calculus) */
export const integrals: Generator = () => {
  const a = ri(0, 2), b = a + ri(1, 3)
  const cs = [ri(-4, 6), ri(-3, 4) * 2, pick([0, 3, -3, 6])]
  // antiderivative: c0 x + c1 x^2/2 + c2 x^3/3 — chosen so values stay fractions with small denominators
  const F = (x: number) => cs[0] * x + (cs[1] * x * x) / 2 + (cs[2] * x ** 3) / 3
  const v = F(b) - F(a)
  const n = Math.round(v * 6), d = 6
  const ans = frac(n, d)
  return input('Hanapin ang definite integral.', ans, {
    latex: `\\int_{${a}}^{${b}} \\left(${polyTex(cs)}\\right)\\,dx`, display: fracText(n, d), tolerance: 1e-9,
    hints: ['Hanapin ang antiderivative F(x): ∫xⁿ dx = xⁿ⁺¹/(n+1).', `Tapos F(${b}) − F(${a}).`],
    solution: [`F(x) = ${polyTex([0, cs[0], cs[1] / 2, cs[2] / 3])}`, `F(${b}) − F(${a}) = ${fracText(n, d)}`],
  })
}

