import { isGrounded, templateExplain, recheckReply } from '../src/ai/guard'
import { solveLatex, verifyAiMath } from '../src/engine/solver'

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error('❌ Assertion failed:', msg)
    process.exit(1)
  }
}

console.log('Testing Deterministic Math Guardrail ("Code Computes, AI Explains")...')

// 1. Solving mathematically first
const c = solveLatex('6+7')
assert(c.answer === '13', 'Sipnayan calculator should compute 6+7 = 13')

// 2. Ungrounded hallucination rejection
const bad = 'I-ya, ilipat natin ang constant: ibawas ang $a + b$ sa both sides. Tapos i-divide sa a para maiwan si x, kaya $x = 6$. Ang carl ay 7, so kaaral mo lang ang $a + b$, kaya $a = 13$. Ito ay 13.'
const badGrounded = isGrounded(bad, [c.input, c.answer, ...c.steps.map(s => s.tex)])
assert(!badGrounded, 'Should reject ungrounded hallucination')

const good = 'Pagsamahin lang ang $6$ at $7$, kaya $6 + 7 = 13$.'
const goodGrounded = isGrounded(good, [c.input, c.answer, ...c.steps.map(s => s.tex)])
assert(goodGrounded, 'Should accept grounded explanation')

// 3. Auto-correction of wrong arithmetic inside AI response
const hallucinated1 = 'Una, $12 \\times 4 = 46$ tapos mag-add ng 2 kaya $46 + 2 = 48$.'
const check1 = verifyAiMath(hallucinated1)
console.log('Check 1 (12*4=46):', check1.text, '| Fixed:', check1.fixed)
assert(check1.fixed >= 1, 'Should fix 12*4 = 46')
assert(check1.text.includes('$12 \\times 4 = 48$'), 'Should fix to 12*4 = 48')

// 4. Auto-correction of fraction errors
const hallucinatedFrac = 'Kapag pinagsama: $\\frac{1}{2} + \\frac{1}{3} = \\frac{2}{5}$, tama ba?'
const checkFrac = verifyAiMath(hallucinatedFrac)
console.log('Check Frac:', checkFrac.text, '| Fixed:', checkFrac.fixed)
assert(checkFrac.fixed >= 1, 'Should detect fraction addition error')
assert(checkFrac.text.includes('\\frac{5}{6}'), 'Should fix to 5/6')

// 5. Verification against ground truth variable
const hallucinatedVar = 'Kaya ang halaga ng variable ay $x = 6$.'
const checkVar = verifyAiMath(hallucinatedVar, ['x = 4'])
console.log('Check Var (x=6 vs x=4):', checkVar.text, '| Fixed:', checkVar.fixed)
assert(checkVar.fixed >= 1, 'Should correct x = 6 to x = 4')
assert(checkVar.text.includes('$x = 4$'), 'Should replace with ground truth x = 4')

// 6. Template and Recheck Replies
const tmpl = templateExplain(solveLatex('2x+3=11'), 'taglish')
assert(tmpl.includes('2x+3=11') || tmpl.includes('x = 4'), 'Template explanation should contain steps')

const reply = recheckReply(solveLatex('5+2'), 'mali 7 ang sagot', 'taglish')
assert(reply.includes('Tama pa rin ang sagot'), 'Recheck reply stands firm kindly')

console.log('✅ Deterministic Math Guardrail verified successfully!')
