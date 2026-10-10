// Asserting tests for the tutor's calculus + graphs. Expected answers are worked out by hand
// (power rule, product rule, FTC, standard limits) and non-trivial forms are compared numerically
// against independently written JS functions — not against compute-engine's own output.
import { solveLatex, type CalcResult } from '../src/engine/solver'
import { ce } from '../src/engine/ce'
import { compileReal } from '../src/engine/realfn'
import { LAYOUTS, type KeyDef } from '../src/keyboard/layouts'

let fails = 0, passed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) passed++
  else { fails++; console.log(`FAIL ${name}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`) }
}
const solve = (l: string) => solveLatex(l)
/** RHS of an answer like "f'(x) = …" or "… + C", as a JS function */
function answerFn(r: CalcResult): ((x: number) => number) | null {
  const rhs = r.answer.split('=').pop()!.replace(/\+\s*C\s*$/, '').trim()
  return compileReal(ce.parse(rhs).json, 'x')
}
/** answer ≡ expected function at sample points (optionally up to a constant, for antiderivatives) */
function sameFn(name: string, r: CalcResult, want: (x: number) => number, upToConstant = false) {
  const f = answerFn(r)
  if (!f) return check(`${name}: answer is a function of x`, r.answer, 'compilable')
  const xs = [0.5, 1.2, 2.7, -0.9, 3.4]
  const off = upToConstant ? f(xs[0]) - want(xs[0]) : 0
  check(`${name} = expected function`, xs.every((x) => Math.abs(f(x) - off - want(x)) < 1e-9 * Math.max(1, Math.abs(want(x)))), true)
}

// ---------------------------------------------------------------- derivatives
{
  const r = solve('\\frac{d}{dx}\\left(x^3+2x^2-5x+1\\right)')
  check('d/dx polynomial: kind', r.kind, 'derivative')
  check('d/dx polynomial: answer', r.answer, "f'(x) = 3x^2+4x-5")
  check('d/dx polynomial: sum-rule steps', r.steps.map((s) => s.label), ['Ibinigay', 'Sum rule: hatiin bawat term', 'I-derive ang bawat term', 'Sagot'])
  check('d/dx polynomial: per-term result, zero term dropped', r.steps[2].tex, '3x^2 + 4x - 5')
}
check('d/dx x^5 (power rule)', solve('\\frac{d}{dx}\\left(x^{5}\\right)').answer, "f'(x) = 5x^4")
check('d/dx x^5 shows the power rule', solve('\\frac{d}{dx}\\left(x^{5}\\right)').steps[1].label, 'Power rule')
check('d/dx constant', solve('\\frac{d}{dx}\\left(7\\right)').answer, "f'(x) = 0")
check('d/dx sin x', solve('\\frac{d}{dx}\\left(\\sin(x)\\right)').answer, "f'(x) = \\cos(x)")
sameFn('d/dx x²·sin x (product rule: 2x sin x + x² cos x)', solve('\\frac{d}{dx}\\left(x^2\\sin(x)\\right)'), (x) => 2 * x * Math.sin(x) + x * x * Math.cos(x))
check('d/dx x²·sin x names the product rule', solve('\\frac{d}{dx}\\left(x^2\\sin(x)\\right)').steps[1].label, 'Product rule')
sameFn('d/dx x/(x+1) (quotient rule: 1/(x+1)²)', solve('\\frac{d}{dx}\\left(\\frac{x}{x+1}\\right)'), (x) => 1 / (x + 1) ** 2)
sameFn('d/dx e^{2x} (chain rule: 2e^{2x})', solve('\\frac{d}{dx}\\left(e^{2x}\\right)'), (x) => 2 * Math.exp(2 * x))
check('d/dx ln x', solve('\\frac{d}{dx}\\left(\\ln(x)\\right)').answer, "f'(x) = \\frac{1}{x}")
check('second derivative of x⁴ − 3x²', solve('\\frac{d^2}{dx^2}\\left(x^4-3x^2\\right)').answer, "f''(x) = 12x^2-6")

// ---------------------------------------------------------------- indefinite integrals
{
  const r = solve('\\int x^2\\,dx')
  check('∫x² dx: kind', r.kind, 'integral')
  check('∫x² dx: answer', r.answer, '\\frac{x^3}{3} + C')
  check('∫x² dx: power rule + constant of integration', r.steps.map((s) => s.label), ['Ibinigay', 'Power rule (integral)', 'Idagdag ang constant of integration', 'Sagot'])
}
check('∫(3x²+2x−4) dx', solve('\\int (3x^2+2x-4)\\,dx').answer, 'x^3+x^2-4x + C')
check('∫cos x dx', solve('\\int \\cos(x)\\,dx').answer, '\\sin(x) + C')
check('∫eˣ dx', solve('\\int e^{x}\\,dx').answer, 'e^{x} + C')
sameFn('∫1/x dx = ln|x| + C', solve('\\int \\frac{1}{x}\\,dx'), (x) => Math.log(Math.abs(x)), true)
sameFn('∫(6x² − 4x + 1) dx = 2x³ − 2x² + x + C', solve('\\int (6x^2-4x+1)\\,dx'), (x) => 2 * x ** 3 - 2 * x * x + x, true)

// ---------------------------------------------------------------- definite integrals (FTC)
{
  const r = solve('\\int_{0}^{1} x^2\\,dx')
  check('∫₀¹ x² dx = 1/3', r.answer, '\\frac{1}{3}')
  check('∫₀¹ x² dx: FTC steps', r.steps.map((s) => s.label), ['Ibinigay', 'Hanapin ang antiderivative', 'Fundamental Theorem of Calculus', 'I-substitute ang limits', 'Decimal', 'Sagot'])
}
check('∫₀³ (2x+1) dx = 9 + 3 = 12', solve('\\int_{0}^{3} (2x+1)\\,dx').answer, '12')
check('∫₀^π sin x dx = 2', solve('\\int_{0}^{\\pi} \\sin(x)\\,dx').answer, '2')
check('∫₁^e 1/x dx = 1', solve('\\int_{1}^{e} \\frac{1}{x}\\,dx').answer, '1')
check('∫₋₁² x³ dx = (16 − 1)/4 = 15/4', solve('\\int_{-1}^{2} x^3\\,dx').answer, '\\frac{15}{4}')
check('∫₋₁¹ 1/x dx is refused (undefined at 0), not "0"', solve('\\int_{-1}^{1} \\frac{1}{x}\\,dx').kind, 'error')

// ---------------------------------------------------------------- limits
check('lim x→2 (x²+1) = 5 by substitution', [solve('\\lim_{x\\to 2} (x^2+1)').answer, solve('\\lim_{x\\to 2} (x^2+1)').steps[1].label], ['5', 'Direct substitution'])
{
  const r = solve('\\lim_{x\\to 3} \\frac{x^2-9}{x-3}')
  check('lim x→3 (x²−9)/(x−3) = 6', r.answer, '6')
  check('…flags 0/0 and uses L\'Hôpital', r.steps.slice(1, 3).map((s) => s.label), ['Indeterminate form', "L'Hôpital's rule"])
}
check('lim x→0 sin x / x = 1', solve('\\lim_{x\\to 0} \\frac{\\sin(x)}{x}').answer, '1')
check('lim x→∞ 1/x = 0', solve('\\lim_{x\\to \\infty} \\frac{1}{x}').answer, '0')
check('lim x→∞ (2x²+1)/(x²−3) = 2', solve('\\lim_{x\\to \\infty} \\frac{2x^2+1}{x^2-3}').answer, '2')
check('lim x→0 1/x² = ∞', solve('\\lim_{x\\to 0} \\frac{1}{x^2}').answer, '\\infty')
check('lim x→0 1/x does not exist', solve('\\lim_{x\\to 0} \\frac{1}{x}').answer.startsWith('\\text{Walang limit'), true)
check('lim x→0 |x|/x does not exist (−1 vs 1)', solve('\\lim_{x\\to 0} \\frac{|x|}{x}').answer.startsWith('\\text{Walang limit'), true)
check('lim x→∞ sin x is refused, not guessed', solve('\\lim_{x\\to \\infty} \\sin(x)').kind, 'error')
check('limits never get a graph', solve('\\lim_{x\\to 3} \\frac{x^2-9}{x-3}').graph, undefined)
check('mixed calculus expression is refused clearly', solve('\\int x^2 dx + 1').kind, 'error')

// ---------------------------------------------------------------- graphs
{
  const r = solve('2x+3=11')
  const g = r.graph!
  check('equation → graph', !!g, true)
  check('equation graph: root at the solution', g.roots, [4])
  check('equation graph: y-intercept of 2x − 8', g.yIntercept, -8)
  check('equation graph: label', g.label, 'f(x) = 2x - 8')
  check('equation graph: domain shows root and intercept', g.xDomain[0] < 0 && g.xDomain[1] > 4, true)
  check('equation graph: ~100–150 evenly spaced samples', g.points.length >= 100 && g.points.length <= 200, true)
}
check('quadratic graph roots', solve('x^2-5x+6=0').graph?.roots?.slice().sort(), [2, 3])
check('no real roots → graph, no root markers', [!!solve('x^2+1=0').graph, solve('x^2+1=0').graph?.roots], [true, undefined])
{
  const d = solve('\\frac{d}{dx}\\left(x^3-3x\\right)').graph!
  check('derivative graph: f′ with f as the faint companion', [d.label, d.ghost?.label], ["f'(x) = 3x^2-3", 'f(x) = x^3-3x'])
  const i = solve('\\int 2x\\,dx').graph!
  check('antiderivative graph: F (C = 0) with f as companion', [i.label, i.ghost?.label], ['F(x) = x^2\\;(C = 0)', 'f(x) = 2x'])
}
check('plain arithmetic: no graph', solve('12\\times 4').graph, undefined)
check('definite integral (a number): no graph', solve('\\int_{0}^{1} x^2\\,dx').graph, undefined)
check('two variables: no graph', solve('x+y').graph, undefined)

/** pairs of consecutive drawn points must never straddle x = a (no line through an asymptote) */
const crosses = (pts: { x: number; y: number | null }[], a: number) => pts.some((p, i) => i > 0 && p.y !== null && pts[i - 1].y !== null && pts[i - 1].x < a && p.x > a)
{
  const g = solve('\\frac{1}{x}').graph!
  check('1/x: line broken at the asymptote x = 0', crosses(g.points, 0), false)
  check('1/x: domain centred on 0', g.xDomain[0] < 0 && g.xDomain[1] > 0, true)
  check('1/x: y-range not blown up by the asymptote', g.yDomain[1] - g.yDomain[0] < 20, true)
}
{
  const g = solve('\\tan(x)').graph!
  check('tan x: radian domain [−2π, 2π]', g.xDomain.map((v) => +v.toFixed(4)), [-6.2832, 6.2832])
  check('tan x: π ticks', g.piTicks, true)
  check('tan x: broken at every asymptote (±π/2, ±3π/2)', [-1.5, -0.5, 0.5, 1.5].map((k) => crosses(g.points, k * Math.PI)), [false, false, false, false])
}
{
  const g = solve('\\ln(x)').graph!
  check('ln x: positive-x domain', g.xDomain[0] > -0.5 && g.xDomain[0] <= 0 && g.xDomain[1] >= 9, true)
  check('ln x: nothing drawn for x ≤ 0 (no mirrored complex real part)', g.points.filter((p) => p.x <= 0).every((p) => p.y === null), true)
  check('ln x: curve runs down toward the asymptote', Math.min(...g.points.filter((p) => p.y !== null).map((p) => p.y!)) < g.yDomain[0], true)
}
{
  const g = solve('\\sqrt{x}').graph!
  check('√x: undefined for x < 0', g.points.filter((p) => p.x < 0).every((p) => p.y === null), true)
}
{
  const g = solve('x^2-400').graph!
  check('x² − 400: domain scales out to its roots ±20', g.xDomain[0] < -20 && g.xDomain[1] > 20, true)
}
{
  const t0 = performance.now()
  for (const l of ['x^3-6x^2+9x', '\\sin(x)\\cdot x', '\\frac{d}{dx}\\left(x^4\\right)', '\\int \\cos(x)\\,dx']) solve(l)
  check('graphs are instant (4 results < 1.5 s total in node)', performance.now() - t0 < 1500, true)
}

// ---------------------------------------------------------------- real-valued evaluator
{
  const f = (tex: string) => compileReal(ce.parse(tex).json, 'x')!
  check('ln(−2) is undefined (not the complex real part 0.69)', Number.isNaN(f('\\ln(x)')(-2)), true)
  check('√(−1) is undefined (not 0)', Number.isNaN(f('\\sqrt{x}')(-1)), true)
  check('cube root of −8 is −2', f('x^{\\frac{1}{3}}')(-8), -2)
  check('1/0 is undefined', Number.isNaN(f('\\frac{1}{x}')(0)), true)
}

// ---------------------------------------------------------------- calculus keyboard tab
{
  const keys = LAYOUTS.calculus.flat()
  const find = (tex: string) => keys.find((k) => k.tex === tex)
  check('calculus tab: 5 rows of 7 (calculus keys + full digit pad)', LAYOUTS.calculus.map((r) => r.length), [7, 7, 7, 7, 7])
  check('calculus tab has every digit 0–9', '0123456789'.split('').every((d) => keys.some((k) => k.label === d)), true)
  check('y, |x| and e are reachable by long-press', [keys.find((k) => k.label === 'x')?.alt?.label, find('\\sqrt{x}')?.alt?.tex, find('e^x')?.alt?.label], ['y', '|x|', 'e'])
  for (const t of ['\\frac{d}{dx}', '\\int', '\\lim', '\\Sigma', 'e^x', '\\ln', 'x^n', '\\sqrt{x}', '\\frac{a}{b}', '\\sin', '\\cos', '\\tan'])
    check(`calculus tab has ${t}`, !!find(t), true)
  for (const l of ['∞', 'x', '→']) check(`calculus tab has ${l}`, keys.some((k) => k.label === l), true)
  check('∫ long-press = definite integral ∫ₐᵇ', find('\\int')?.alt?.tex, '\\int_a^b')
  check('d/dx long-press = second derivative', find('\\frac{d}{dx}')?.alt?.tex, '\\frac{d^2}{dx^2}')
  // what the keys actually insert, with the placeholders filled in, must solve
  const fill = (k: KeyDef | undefined, ...vals: string[]) => { let s = k!.ins!; for (const v of vals) s = s.replace('#?', v); return s }
  check('inserted d/dx(x^2) solves', solve(fill(find('\\frac{d}{dx}'), 'x^2')).answer, "f'(x) = 2x")
  check('inserted ∫ x dx solves', solve(fill(find('\\int'), 'x')).answer, '\\frac{x^2}{2} + C')
  check('inserted ∫₁² x dx solves', solve(fill(find('\\int')!.alt, '1', '2', 'x')).answer, '\\frac{3}{2}')
  check('inserted lim x→1 (x+1) solves', solve(fill(find('\\lim'), '1', '(x+1)')).answer, '2')
  check('inserted Σ n=1..10 of n solves', solve(fill(find('\\Sigma'), 'n=1', '10', 'n')).answer, '55')
  // exactly what MathLive emits after typing ∫ₐᵇ, 0, 2, 3x² on this tab (found in the browser test)
  check('MathLive-typed \\int_0^23x^2\\,dx is ∫₀² 3x² dx = 8, not ∫₀²³', solve('\\int_0^23x^2\\,dx').answer, '8')
}

console.log(`calculus-test: ${passed} passed, ${fails} failed`)
if (fails) process.exit(1)
