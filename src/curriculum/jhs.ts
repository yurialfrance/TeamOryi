// World 2 — Junior High (Grade 7): Algebraic expressions & linear equations — "Balanse ng Timbangan"
import type { Generator } from '../engine/types'
import { NAMES, pick, ri, shuffle, uid } from '../engine/rand'

const signed = (n: number) => (n < 0 ? `- ${-n}` : `+ ${n}`)
const coef = (a: number, v = 'x') => (a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`)

/** Stage 1: Evaluate an expression */
export const evaluateExpr: Generator = () => {
  const a = ri(2, 9), b = ri(-9, 12), x = ri(-4, 6)
  const val = a * x + b
  return {
    id: uid(),
    kind: 'input',
    prompt: `Kung x = ${x}, ano ang value ng expression?`,
    latex: `${coef(a)} ${signed(b)}`,
    answers: [String(val)],
    answerDisplay: String(val),
    hints: [`Palitan ang x ng ${x}.`, `Unahin ang multiplication: ${a} × (${x}).`],
    solution: [`${a}(${x}) ${signed(b)}`, `= ${a * x} ${signed(b)}`, `= ${val}`],
  }
}

/** Stage 2: One-step equations */
export const oneStep: Generator = () => {
  const x = ri(-8, 15)
  if (Math.random() < 0.5) {
    const b = ri(1, 20) * (Math.random() < 0.3 ? -1 : 1)
    const c = x + b
    return {
      id: uid(),
      kind: 'input',
      prompt: 'Hanapin ang x. Panatilihing balanse ang timbangan!',
      latex: `x ${signed(b)} = ${c}`,
      visual: { type: 'scale', left: `x ${signed(b)}`, right: String(c) },
      answers: [`x=${x}`],
      prefix: 'x =',
      answerDisplay: `x = ${x}`,
      hints: [`Para maiwan ang x, ${b > 0 ? `ibawas ang ${b}` : `idagdag ang ${-b}`} sa magkabilang side.`],
      solution: [`x ${signed(b)} ${b > 0 ? `- ${b}` : `+ ${-b}`} = ${c} ${b > 0 ? `- ${b}` : `+ ${-b}`}`, `x = ${x}`],
    }
  }
  const a = pick([2, 3, 4, 5, 6, -2, -3])
  const c = a * x
  return {
    id: uid(),
    kind: 'input',
    prompt: 'Hanapin ang x.',
    latex: `${coef(a)} = ${c}`,
    visual: { type: 'scale', left: coef(a), right: String(c) },
    answers: [`x=${x}`],
    prefix: 'x =',
    answerDisplay: `x = ${x}`,
    hints: [`Ang x ay naka-multiply sa ${a}. Ano ang kabaligtaran ng multiplication?`, `I-divide ang magkabilang side sa ${a}.`],
    solution: [`${coef(a)} ÷ ${a} = ${c} ÷ ${a}`, `x = ${x}`],
  }
}

/** Stage 3: Two-step equations ax + b = c */
export const twoStep: Generator = () => {
  const x = ri(-6, 10)
  const a = pick([2, 3, 4, 5, 6, 7])
  const b = ri(-12, 15) || 3
  const c = a * x + b
  return {
    id: uid(),
    kind: 'input',
    prompt: 'Solve for x. Dalawang hakbang ito!',
    latex: `${coef(a)} ${signed(b)} = ${c}`,
    visual: { type: 'scale', left: `${coef(a)} ${signed(b)}`, right: String(c) },
    answers: [`x=${x}`],
    prefix: 'x =',
    answerDisplay: `x = ${x}`,
    hints: [
      `Step 1: ${b > 0 ? `Ibawas ang ${b}` : `Idagdag ang ${-b}`} sa magkabilang side para maiwan ang ${coef(a)}.`,
      `Step 2: I-divide sa ${a}.`,
    ],
    solution: [`${coef(a)} = ${c} ${b > 0 ? `- ${b}` : `+ ${-b}`}`, `${coef(a)} = ${c - b}`, `x = ${c - b} ÷ ${a} = ${x}`],
  }
}

/** Stage 4: Translate words → expression using tiles */
export const translateTiles: Generator = () => {
  const n = ri(2, 9)
  const k = ri(2, 9)
  const forms = [
    { text: `Ang kabuuan ng isang numero at ${n}`, seq: [['x', '+', `${n}`], [`${n}`, '+', 'x']] },
    { text: `${n} na mas kaunti sa isang numero`, seq: [['x', '-', `${n}`]] },
    { text: `Ang produkto ng ${k} at isang numero, dagdagan ng ${n}`, seq: [[`${k}x`, '+', `${n}`], [`${n}`, '+', `${k}x`]] },
    { text: `Dalawang beses ng isang numero, bawasan ng ${n}`, seq: [['2x', '-', `${n}`]] },
    { text: `Ang quotient ng isang numero at ${k}`, seq: [[`\\frac{x}{${k}}`]] },
  ]
  const f = pick(forms)
  const pool = new Set<string>(f.seq[0])
  ;['x', '+', '-', `${n}`, `${k}x`, '2x', `\\frac{x}{${k}}`, `${n}x`, '\\cdot'].forEach((t) => pool.size < 7 && pool.add(t))
  return {
    id: uid(),
    kind: 'tiles',
    prompt: `Isalin sa algebraic expression: “${f.text}”. (x = ang numero)`,
    tiles: shuffle([...pool]),
    answerSeq: f.seq,
    answerDisplay: f.seq[0].join(' '),
    hints: ['"Kabuuan" = +, "produkto" = ×, "mas kaunti sa" = −, "quotient" = ÷.', 'Ang “isang numero” ay x.'],
    solution: [`“${f.text}” → ${f.seq[0].join(' ')}`],
  }
}

/** Stage 5: Real-life word problems */
export const linearWord: Generator = () => {
  const name = pick(NAMES)
  const t = pick(['jeep', 'load', 'tindahan'] as const)
  if (t === 'jeep') {
    const base = 13, per = pick([2, 2.5, 3]) as number
    const extra = ri(2, 8)
    const total = base + per * extra
    return {
      id: uid(),
      kind: 'input',
      prompt: `Ang pamasahe sa jeep ay ₱${base} para sa unang 4 km, at ₱${per} bawat dagdag na km. Nagbayad si ${name} ng ₱${total}. Ilang dagdag na km ang nilakbay niya?`,
      visual: { type: 'scene', icons: ['jeep'] },
      latex: `${base} + ${per}x = ${total}`,
      answers: [String(extra)],
      prefix: 'x =',
      answerDisplay: `${extra} km`,
      hints: ['Ang equation: base + (rate × x) = total.', `Ibawas ang ${base}, tapos i-divide sa ${per}.`],
      solution: [`${base} + ${per}x = ${total}`, `${per}x = ${total - base}`, `x = ${extra}`],
    }
  }
  if (t === 'load') {
    const promo = pick([50, 99]), days = promo === 50 ? 3 : 7
    const budget = promo * ri(2, 6)
    const n = budget / promo
    return {
      id: uid(),
      kind: 'input',
      prompt: `May ₱${budget} si ${name} pang-load. Ang promo ay ₱${promo} para sa ${days} araw. Ilang beses siya makakapag-register?`,
      visual: { type: 'scene', icons: ['phone'] },
      answers: [String(n)],
      answerDisplay: String(n),
      hints: [`Equation: ${promo}x = ${budget}.`],
      solution: [`${promo}x = ${budget}`, `x = ${budget} ÷ ${promo} = ${n}`],
    }
  }
  const price = ri(8, 25), qty = ri(3, 9), change = ri(1, 20)
  const paid = price * qty + change
  return {
    id: uid(),
    kind: 'input',
    prompt: `Bumili si ${name} ng ${qty} piraso ng chichirya sa sari-sari store. Nagbayad siya ng ₱${paid} at sinuklian ng ₱${change}. Magkano ang isang chichirya?`,
    visual: { type: 'scene', icons: ['store'] },
    latex: `${qty}x + ${change} = ${paid}`,
    answers: [String(price)],
    prefix: '₱',
    answerDisplay: `₱${price}`,
    hints: ['Ibawas muna ang sukli sa binayad.', `Tapos i-divide sa ${qty}.`],
    solution: [`${qty}x = ${paid} − ${change} = ${paid - change}`, `x = ${paid - change} ÷ ${qty} = ${price}`],
  }
}
