// Regression tests for the Tutor: the answer box must match the computed steps, and AI text that
// invents an operation or comes out in the wrong language must never be shown.
import { detectIntent, solveChat, solveLatex, type CalcResult } from '../src/engine/solver'
import { checkAiExplanation, chooseExplanation, foreignOperations, isLanguage, streamGate, templateExplain } from '../src/ai/guard'

let fails = 0, passed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) passed++
  else { fails++; console.log(`FAIL ${name}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`) }
}
const beforeAnswer = (r: CalcResult) => r.steps[r.steps.length - 2]

// ---------------------------------------------------------------- A1: answer must match the step above it
// Reported: "2a² + 2a + 4" (factor request) showed I-FACTOR 2(a² + a + 2) but SAGOT 2a² + 2a + 4.
{
  const r = solveChat('2a² + 2a + 4', 'i-factor mo nga ito')!
  check('2a²+2a+4 factor: answer is the factored form', r.answer, '2(a^2+a+2)')
  check('…and equals the I-FACTOR step right above it', [beforeAnswer(r).label, beforeAnswer(r).tex], ['I-factor', '2(a^2+a+2)'])
  check('…with the GCF step first', r.steps.map((s) => s.label), ['Ibinigay', 'Hanapin ang common factor (GCF)', 'I-factor', 'Sagot'])
  check('…and the request is remembered for re-checks', r.intent, 'factor')
  check('same with English "factor this"', solveChat('2a^2+2a+4', 'please factor this')!.answer, '2(a^2+a+2)')
}
{
  const r = solveChat('2a^2+2a+4', '')!
  check('no request: answer is the simplified expression', r.answer, '2a^2+2a+4')
  check('…the factored form is NOT a step before the answer', r.steps.some((s) => s.label === 'I-factor'), false)
  check('…it is offered after the answer instead', r.also, [{ label: 'Factored form', tex: '2(a^2+a+2)' }])
}
check('x² − 9, factor → (x − 3)(x + 3)', solveChat('x^2-9', 'factor')!.answer, '(x-3)(x+3)')
check('prime polynomial says so instead of faking a factor step', solveChat('x^2+1', 'i-factor')!.steps.map((s) => s.label), ['Ibinigay', 'Hindi na ma-factor', 'Sagot'])
check('expand request on a product', solveChat('(x+1)(x+2)', 'i-expand')!.answer, 'x^2+3x+2')
// invariant over many expressions and requests: the last transformation shown IS the answer
for (const src of ['2a^2+2a+4', 'x^2-9', '6x+9', '(x+1)(x+2)', '3x+2x', 'x^2+2x+1', '4y^2-16', '(a+b)^2']) {
  for (const req of ['', 'factor', 'expand', 'simplify']) {
    const r = solveChat(src, req)!
    const last = beforeAnswer(r)
    check(`"${src}" + "${req}": answer matches the last step`, last.label === 'Ibinigay' || last.tex.replace(/[{}\s]/g, '') === r.answer.replace(/[{}\s]/g, ''), true)
  }
}
check('intent: Taglish', [detectIntent('i-factor mo'), detectIntent('paki-expand'), detectIntent('pasimplehin mo')], ['factor', 'expand', 'simplify'])
check('intent: none for a plain question', detectIntent('ano ang sagot?'), undefined)

// ---------------------------------------------------------------- A2: invented operations are rejected
const factored = solveChat('2a^2+2a+4', 'i-factor')!
const hallucinated = 'The first step is to find the integral of $2a^2 + 2a + 4$. So the answer is $2(a^2 + a + 2)$.'
check('reported hallucination: "integral" on a factoring problem is caught', foreignOperations(hallucinated, factored), ['integral'])
check('a real integral may mention integrals', foreignOperations('Ang integral ng $x^2$ ay $\\frac{x^3}{3} + C$.', solveLatex('\\int x^2\\,dx')), [])
check('derivative talk on an equation is caught', foreignOperations('Kunin natin ang derivative ng $2x + 3$.', solveLatex('2x+3=11')), ['derivative'])
check('factoring talk on a factoring problem is fine', foreignOperations('Una, i-factor natin ang 2 sa bawat term.', factored), [])

// ---------------------------------------------------------------- B: language
const english = 'The first step is to factor out the common 2 from each term. This gives us $2(a^2 + a + 2)$.'
const taglish = 'Una, i-factor natin ang 2 sa bawat term. Kaya ang sagot ay $2(a^2 + a + 2)$.'
const mixed = 'So ang first step is i-factor out natin yung 2 sa bawat term, tapos ito na ang sagot.'
check('reported English reply is NOT Taglish', isLanguage(english, 'taglish'), false)
check('Taglish reply passes', isLanguage(taglish, 'taglish'), true)
check('natural code-switched Taglish passes', isLanguage(mixed, 'taglish'), true)
check('English mode accepts English', isLanguage(english, 'english'), true)
check('English mode rejects Taglish', isLanguage(taglish, 'english'), false)
{
  const v = checkAiExplanation(english, { sources: [factored.input, factored.answer, ...factored.steps.map((s) => s.tex)], lang: 'taglish', calc: factored })
  check('verdict on the reported reply (Taglish mode): rejected for language', v.reasons, ['language:taglish'])
}
// the full decision the Tutor makes: English → the verified Taglish explanation is shown instead
{
  const pick = chooseExplanation({ aiText: english, calc: factored, lang: 'taglish', userText: 'i-factor', aiAnswered: true, blocked: null })
  check('English AI reply in Taglish mode → verified fallback', pick.source, 'verified')
  check('…and the fallback itself is Taglish', isLanguage(pick.text, 'taglish'), true)
  const good = chooseExplanation({ aiText: taglish, calc: factored, lang: 'taglish', userText: 'i-factor', aiAnswered: true, blocked: null })
  check('good Taglish AI reply is shown as-is', good.source, 'ai')
  const halluc = chooseExplanation({ aiText: 'Hanapin natin ang integral ng $2a^2+2a+4$, kaya ang sagot ay $2(a^2+a+2)$.', calc: factored, lang: 'taglish', userText: '', aiAnswered: true, blocked: null })
  check('Taglish but hallucinated operation → verified fallback', [halluc.source, halluc.reasons], ['verified', ['operation:integral']])
}
// while streaming: English never reaches the screen
{
  const shown: string[] = []
  const gate = streamGate('taglish', (t) => shown.push(t), factored)
  let acc = ''
  for (const w of english.split(' ')) gate.onText((acc += (acc ? ' ' : '') + w))
  check('English stream: nothing shown', shown.length, 0)
  check('English stream: blocked for language', gate.blocked, 'language:taglish')
}
{
  const shown: string[] = []
  const gate = streamGate('taglish', (t) => shown.push(t), factored)
  let acc = ''
  for (const w of `${taglish} Then we can see that the answer is the same for all the terms.`.split(' ')) gate.onText((acc += (acc ? ' ' : '') + w))
  check('Taglish stream is shown', shown.length > 0, true)
  check('drifting into English mid-way stops the stream', gate.blocked, 'language:taglish')
  check('…and the English sentence never reached the screen', shown.some((t) => /we can see/.test(t)), false)
}
{
  const shown: string[] = []
  const gate = streamGate('taglish', (t) => shown.push(t), factored)
  gate.onText('Hanapin natin ang integral ng')
  check('stream naming a foreign operation is cut immediately', [gate.blocked, shown.length], ['operation:integral', 0])
}
// the deterministic fallback must be in the selected language for every kind of result
for (const src of ['2x+3=11', 'x^2-5x+6=0', '\\sqrt{50}', '\\frac{1}{2}+\\frac{1}{3}', '2a^2+2a+4', '\\frac{d}{dx}\\left(x^3\\right)', '\\int x^2\\,dx', '\\lim_{x\\to 2} (x^2+1)', '12\\times 4']) {
  const r = solveLatex(src)
  check(`template for ${src} is Taglish`, isLanguage(templateExplain(r, 'taglish'), 'taglish'), true)
  check(`template for ${src} is English in English mode`, isLanguage(templateExplain(r, 'english'), 'english'), true)
}

console.log(`tutor-test: ${passed} passed, ${fails} failed`)
if (fails) process.exit(1)
