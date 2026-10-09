import { solveLatex, extractMath, verifyAiMath } from '../src/engine/solver'
for (const l of ['\\sqrt{100}', '\\sqrt{8}', '\\frac{1}{2}+\\frac{1}{3}', '25\\%\\cdot 80', '2x+3=11', '3(x-1)=2x+4', 'x^2-5x+6=0', 'x^2+1=0', '(x+2)^2', '2(x+3)+4x', '\\frac{3}{4}\\div\\frac{1}{2}', '1000(1.05)^3', 'x/2+1=4', '\\frac{x}{3}=5']) {
  const r = solveLatex(l); console.log(l.padEnd(26), '→', r.kind, '|', r.steps.map(s => s.label + ': ' + s.tex).join('  ‖  '))
}
for (const t of ['hi sino ka', 'solve 2x+3=11', 'ano ang 25% ng 80', 'magkano 12*4+3', 'paano mag add ng fractions']) console.log(JSON.stringify(t), '→', extractMath(t))
console.log(verifyAiMath('So $12 \\times 4 = 46$ and $\\sqrt{100} = 10$ and $x = 4$.'))
