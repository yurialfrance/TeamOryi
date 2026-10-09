import { isGrounded, templateExplain, recheckReply } from '../src/ai/guard'
import { solveLatex } from '../src/engine/solver'
const c = solveLatex('6+7')
const bad = 'I-ya, ilipat natin ang constant: ibawas ang $a + b$ sa both sides. Tapos i-divide sa a para maiwan si x, kaya $x = 6$. Ang carl ay 7, so kaaral mo lang ang $a + b$, kaya $a = 13$. Ito ay 13.'
console.log('bad grounded?', isGrounded(bad, [c.input, c.answer, ...c.steps.map(s=>s.tex)]))
console.log('good grounded?', isGrounded('Pagsamahin lang ang $6$ at $7$, kaya $6 + 7 = 13$.', [c.input, c.answer, ...c.steps.map(s=>s.tex)]))
console.log(templateExplain(solveLatex('2x+3=11'), 'taglish'))
console.log(templateExplain(c, 'english'))
console.log(recheckReply(solveLatex('5+2'), 'mali 7 ang sagot', 'taglish'))
console.log(recheckReply(solveLatex('5+2'), 'mali yan 8 dapat', 'english'))
