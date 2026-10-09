import { diagnoseMisconception } from '../src/engine/diagnostics'
import { mathToSpeechText } from '../src/lib/tts'
import type { Question } from '../src/engine/types'

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error('❌ Assertion failed:', msg)
    process.exit(1)
  }
}

console.log('Testing Bakit Mali Ako Diagnostic AI...')

// 1. PEMDAS Inversion
const qPemdas: Question = {
  id: 'test_pemdas',
  prompt: 'Kalkulahin ang 2 + 3 \\times 4',
  latex: '2 + 3 \\times 4',
  hints: ['Unahin ang multiplication'],
  solution: ['2 + 12 = 14'],
  answerDisplay: '14',
  kind: 'input',
  answers: ['14'],
}
const rPemdas = diagnoseMisconception(qPemdas, '20')
console.log('PEMDAS:', rPemdas.kind, '→', rPemdas.title)
assert(rPemdas.kind === 'pemdas_inverted', 'Should detect PEMDAS inversion')

// 2. Fraction Denominator Addition Trap
const qFrac: Question = {
  id: 'test_frac',
  prompt: 'I-add: \\frac{1}{2} + \\frac{1}{3}',
  latex: '\\frac{1}{2} + \\frac{1}{3}',
  hints: ['Hanapin ang LCD'],
  solution: ['\\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}'],
  answerDisplay: '\\frac{5}{6}',
  kind: 'input',
  answers: ['\\frac{5}{6}'],
}
const rFrac = diagnoseMisconception(qFrac, '\\frac{2}{5}')
console.log('Fraction Add:', rFrac.kind, '→', rFrac.title)
assert(rFrac.kind === 'fraction_denominator_add', 'Should detect fraction denominator addition')

// 3. Exponent as Multiplication
const qExp: Question = {
  id: 'test_exp',
  prompt: 'Kalkulahin ang 2^3',
  latex: '2^3',
  hints: ['Multiply ang 2 nang 3 beses'],
  solution: ['2 * 2 * 2 = 8'],
  answerDisplay: '8',
  kind: 'input',
  answers: ['8'],
}
const rExp = diagnoseMisconception(qExp, '6')
console.log('Exponent:', rExp.kind, '→', rExp.title)
assert(rExp.kind === 'exponent_as_multiply', 'Should detect exponent as multiply')

// 4. Inverted Fraction
const qInv: Question = {
  id: 'test_inv',
  prompt: 'I-simplify',
  hints: [],
  solution: [],
  answerDisplay: '\\frac{2}{3}',
  kind: 'input',
  answers: ['\\frac{2}{3}'],
}
const rInv = diagnoseMisconception(qInv, '\\frac{3}{2}')
console.log('Inverted:', rInv.kind, '→', rInv.title)
assert(rInv.kind === 'inverted_fraction', 'Should detect inverted fraction')

// 5. Sign Reversal
const qSign: Question = {
  id: 'test_sign',
  prompt: 'Lutasin para sa x',
  hints: [],
  solution: [],
  answerDisplay: '-5',
  kind: 'input',
  answers: ['-5'],
}
const rSign = diagnoseMisconception(qSign, '5')
console.log('Sign:', rSign.kind, '→', rSign.title)
assert(rSign.kind === 'sign_reversal', 'Should detect sign reversal')

// 6. Decimal Place Error
const qDec: Question = {
  id: 'test_dec',
  prompt: 'Magkano ang sukli?',
  hints: [],
  solution: [],
  answerDisplay: '2.5',
  kind: 'input',
  answers: ['2.5'],
}
const rDec = diagnoseMisconception(qDec, '25')
console.log('Decimal:', rDec.kind, '→', rDec.title)
assert(rDec.kind === 'decimal_place_error', 'Should detect decimal place error')

// 7. Digit Transposition
const qTrans: Question = {
  id: 'test_trans',
  prompt: 'Bilangin',
  hints: [],
  solution: [],
  answerDisplay: '12',
  kind: 'input',
  answers: ['12'],
}
const rTrans = diagnoseMisconception(qTrans, '21')
console.log('Transposition:', rTrans.kind, '→', rTrans.title)
assert(rTrans.kind === 'digit_transposition', 'Should detect digit transposition')

// 8. Off by One
const qOff1: Question = {
  id: 'test_off1',
  prompt: 'Ilang mansanas?',
  hints: [],
  solution: [],
  answerDisplay: '15',
  kind: 'input',
  answers: ['15'],
}
const rOff1 = diagnoseMisconception(qOff1, '14')
console.log('Off-by-1:', rOff1.kind, '→', rOff1.title)
assert(rOff1.kind === 'off_by_one', 'Should detect off-by-one')

// 9. Pizza Chef Complement
const qPizza: Question = {
  id: 'test_pizza',
  prompt: 'Lagyan ng toppings ang 3 sa 8 hiwa',
  targetNum: 3,
  targetDen: 8,
  allowedSlices: [8],
  topping: 'pepperoni',
  hints: [],
  solution: ['3 sa 8'],
  answerDisplay: '3/8',
  kind: 'pizzaChef',
}
const rPizza = diagnoseMisconception(qPizza, { num: 5, den: 8 })
console.log('Pizza Complement:', rPizza.kind, '→', rPizza.title)
assert(rPizza.kind === 'pizza_chef_complement', 'Should detect pizza chef complement')

// 10. Math to Speech Translation
const speech = mathToSpeechText('\\frac{1}{2} + 2^3 = 8.5')
console.log('Math to Speech:', speech)
assert(speech.includes('1 over 2'), 'Fractions should be spoken as "1 over 2"')
assert(speech.includes('2 cubed'), '2^3 should be spoken as "2 cubed"')

console.log('✅ All Bakit Mali Ako diagnostic tests passed!')
