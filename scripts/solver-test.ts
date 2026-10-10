import { solveLatex, extractMath, verifyAiMath, braceTypedExponents } from '../src/engine/solver'
for (const l of ['\\sqrt{100}', '\\sqrt{8}', '\\frac{1}{2}+\\frac{1}{3}', '25\\%\\cdot 80', '2x+3=11', '3(x-1)=2x+4', 'x^2-5x+6=0', 'x^2+1=0', '(x+2)^2', '2(x+3)+4x', '\\frac{3}{4}\\div\\frac{1}{2}', '1000(1.05)^3', 'x/2+1=4', '\\frac{x}{3}=5']) {
  const r = solveLatex(l); console.log(l.padEnd(26), '→', r.kind, '|', r.steps.map(s => s.label + ': ' + s.tex).join('  ‖  '))
}
for (const t of ['hi sino ka', 'solve 2x+3=11', 'ano ang 25% ng 80', 'magkano 12*4+3', 'paano mag add ng fractions']) console.log(JSON.stringify(t), '→', extractMath(t))
console.log(verifyAiMath('So $12 \\times 4 = 46$ and $\\sqrt{100} = 10$ and $x = 4$.'))

// ---------------------------------------------------------------- asserting: the solver on messy input
// Typed, pasted or MathLive-entered math is rarely tidy: unbalanced brackets, unicode operators,
// mixed numbers, worksheet blanks, dangling operators. (Moved here from the retired OCR test suite.)
let fails = 0, passed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) passed++
  else { fails++; console.log(`FAIL ${name}
     got  ${JSON.stringify(got)}
     want ${JSON.stringify(want)}`) }
}
const answer = (latex: string) => solveLatex(latex).answer

const SOLVER: [string, string][] = [
  ['2 x + 3 = 11', 'x = 4'], // spaced implicit multiplication
  ['2x+3=11=', 'x = 4'], // trailing =
  ['5 + 3 = ?', '8'], // worksheet blank
  ['= 5 + 3', '8'],
  ['12\\div 4+', '3'], // dangling operator
  ['25%\\cdot 80', '20'], // bare % would be a TeX comment → 25
  ['25\\% \\cdot 80', '20'],
  ['2^-3', '\\frac{1}{8}'], // negative exponent without braces
  ['x^-2 \\cdot x^{3}', 'x'],
  ['\\frac{\\frac{1}{2}}{\\frac{3}{4}}', '\\frac{2}{3}'],
  ['2\\frac{1}{2}+\\frac{1}{2}', '3'], // mixed number
  ['3\\frac{1}{4}-1\\frac{1}{2}', '\\frac{7}{4}'],
  ['-2\\frac{1}{2}+3', '\\frac{1}{2}'],
  ['(2+3', '5'], // unbalanced
  ['2+3)', '5'],
  ['((2+3)\\cdot 2', '10'],
  ['\\frac{1}{2', '0.5'],
  ['1,000+1', '1001'], // thousands separator, not a tuple
  ['15 x 4 - 8', '52'],
  ['15×4−8', '52'], // unicode operators
  ['x²-9=0', 'x = 3,\\; x = -3'],
  ['√64', '8'],
  ['2(x+1)=10', 'x = 4'],
  ['x(x+1)', 'x^2+x'],
  ['(x+1)(x-1)', 'x^2-1'],
  ['0.5x=2', 'x = 4'],
  ['\\left(2+3\\right)\\cdot 2', '10'],
  ['\\dfrac{3}{4}\\div\\frac{1}{2}', '\\frac{3}{2}'],
  ['2(3)(4)', '24'],
  ['-(-3)', '3'],
  ['2--3', '5'],
  ['\\frac{x}{3}=5', 'x = 15'],
  ['x \\times 2 = 8', 'x = 4'],
]
for (const [input, want] of SOLVER) check(`solver ${JSON.stringify(input)}`, answer(input), want)
// MathLive output is exact TeX — ∫₀² 3x² dx is serialized as \int_0^23x^2 and must NOT become ∫₀²³
check('MathLive-style unbraced superscript keeps TeX meaning', answer('\\int_0^23x^2\\,dx'), '8')
check('x^23 from MathLive is x²·3', answer('x^23'), '3x^2')
check('hand-typed text: x^10 means x to the 10th', answer(braceTypedExponents('x^10')), 'x^{10}')
check('divide by zero is an error, not ∞', solveLatex('\\frac{2}{0}').kind, 'error')

console.log(`solver-test: ${passed} passed, ${fails} failed`)
if (fails) process.exit(1)
