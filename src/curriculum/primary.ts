// Grades 1–3 (MATATAG Key Stage 1): whole numbers, operations, money — "Tindahan ni Aling Nena"
import type { Generator } from '../engine/types'
import { NAMES, distractors, pick, ri, shuffle, uid } from '../engine/rand'

const fmt = (n: number) => n.toLocaleString('en-PH')

/** Place value */
export const placeValue: Generator = () => {
  const n = ri(1000, 9999)
  const places = [
    { name: 'ones', div: 1 },
    { name: 'tens', div: 10 },
    { name: 'hundreds', div: 100 },
    { name: 'thousands', div: 1000 },
  ]
  const p = pick(places)
  const digit = Math.floor(n / p.div) % 10
  const digits = [...new Set(String(n).split('').map(Number))]
  const opts = shuffle([digit, ...shuffle(digits.filter((d) => d !== digit)).slice(0, 3), ...distractors(digit, 3, 4)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4))
  if (!opts.includes(digit)) opts[0] = digit
  const choices = shuffle(opts)
  return {
    id: uid(),
    kind: 'choice',
    prompt: `Anong digit ang nasa ${p.name} place ng ${fmt(n)}?`,
    latex: fmt(n).replace(/,/g, '{,}'),
    choices: choices.map((d) => ({ text: String(d) })),
    correctIndex: choices.indexOf(digit),
    answerDisplay: String(digit),
    hints: ['Mula kanan: ones, tens, hundreds, thousands.', `Bilangin ang posisyon mula sa kanan.`],
    solution: [`${fmt(n)} → ones = ${n % 10}, tens = ${Math.floor(n / 10) % 10}, hundreds = ${Math.floor(n / 100) % 10}, thousands = ${Math.floor(n / 1000)}`, `Ang ${p.name} digit ay ${digit}.`],
  }
}

/** Addition with regrouping */
export const addWhole: Generator = () => {
  const a = ri(120, 899), b = ri(105, 999 - a > 105 ? 999 - a : 300)
  const s = a + b
  return {
    id: uid(),
    kind: 'input',
    prompt: 'I-add. Huwag kalimutan ang regrouping (pag-carry)!',
    latex: `${a} + ${b} = ?`,
    answers: [String(s)],
    answerDisplay: String(s),
    hints: ['Simulan sa ones, tapos tens, tapos hundreds.', 'Kapag 10 pataas, i-carry ang 1 sa susunod na column.'],
    solution: [`Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}`, `Kabuuan: ${a} + ${b} = ${s}`],
  }
}

/** Subtraction with borrowing */
export const subWhole: Generator = () => {
  const a = ri(300, 999), b = ri(101, a - 50)
  const d = a - b
  return {
    id: uid(),
    kind: 'input',
    prompt: 'I-subtract. Mag-borrow kung kailangan.',
    latex: `${a} - ${b} = ?`,
    answers: [String(d)],
    answerDisplay: String(d),
    hints: ['Simulan sa ones column.', 'Kung mas maliit ang itaas, humiram ng 10 sa katabing column.'],
    solution: [`${a} − ${b} = ${d}`, `Check: ${d} + ${b} = ${a}`],
  }
}

/** Counting money (coins and bills) */
export const countMoney: Generator = () => {
  const kinds = [100, 50, 20, 10, 5, 1]
  const chosen = shuffle(kinds).slice(0, 3).sort((x, y) => y - x)
  const counts = chosen.map(() => ri(1, 4))
  const total = chosen.reduce((s, k, i) => s + k * counts[i], 0)
  const name = pick(NAMES)
  const list = chosen.map((k, i) => `${counts[i]} na ₱${k}`).join(', ')
  return {
    id: uid(),
    kind: 'input',
    prompt: `Nagbayad si ${name} sa tindahan gamit ang ${list}. Magkano lahat ang pera niya?`,
    visual: { type: 'scene', icons: ['store', 'coins'] },
    answers: [String(total)],
    prefix: '₱',
    answerDisplay: `₱${total}`,
    hints: ['I-multiply muna ang bawat klase ng pera sa dami nito.', 'Tapos i-add lahat.'],
    solution: [...chosen.map((k, i) => `${counts[i]} × ₱${k} = ₱${k * counts[i]}`), `Kabuuan = ₱${total}`],
  }
}

/** Multiplication facts */
export const timesTable: Generator = () => {
  const a = ri(2, 10), b = ri(2, 10)
  const p = a * b
  const asGroups = Math.random() < 0.4
  return {
    id: uid(),
    kind: 'input',
    prompt: asGroups ? `May ${a} na supot, may ${b} na kendi bawat isa. Ilan lahat ang kendi?` : 'Sagutin ang multiplication.',
    latex: asGroups ? undefined : `${a} \\times ${b} = ?`,
    answers: [String(p)],
    answerDisplay: String(p),
    hints: [`Ang ${a} × ${b} ay ${a} grupo ng ${b}.`, `Magbilang ng ${b} nang ${a} beses: ${Array.from({ length: Math.min(a, 4) }, (_, i) => b * (i + 1)).join(', ')}…`],
    solution: [`${a} × ${b} = ${p}`],
  }
}
