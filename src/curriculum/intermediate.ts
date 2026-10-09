// Grades 5–6 (MATATAG Key Stage 2): GCF/LCM, ratio & proportion, decimals, percent — "Hatian ng Barkada"
import type { Generator } from '../engine/types'
import { NAMES, gcd, pick, r2, ri, shuffle, uid } from '../engine/rand'

const lcm = (a: number, b: number) => (a * b) / gcd(a, b)

export const gcfGen: Generator = () => {
  const g = pick([2, 3, 4, 5, 6, 8, 9, 12])
  let m = ri(2, 7), n = ri(2, 7)
  while (gcd(m, n) !== 1 || m === n) { m = ri(2, 7); n = ri(2, 7) }
  const a = g * m, b = g * n
  return {
    id: uid(),
    kind: 'input',
    prompt: `Ano ang GCF (Greatest Common Factor) ng ${a} at ${b}?`,
    latex: `\\text{GCF}(${a}, ${b})`,
    answers: [String(g)],
    answerDisplay: String(g),
    hints: ['Ilista ang factors ng bawat numero.', 'Hanapin ang pinakamalaking factor na pareho sila.'],
    solution: [`${a} = ${g} × ${m}`, `${b} = ${g} × ${n}`, `GCF = ${g}`],
  }
}

export const lcmGen: Generator = () => {
  let a = ri(3, 12), b = ri(3, 12)
  while (a === b) b = ri(3, 12)
  const L = lcm(a, b)
  const word = Math.random() < 0.5
  return {
    id: uid(),
    kind: 'input',
    prompt: word
      ? `Dumadaan ang jeep tuwing ${a} minuto at ang bus tuwing ${b} minuto. Sabay silang dumaan ngayon. Pagkalipas ng ilang minuto sila ulit magsasabay?`
      : `Ano ang LCM (Least Common Multiple) ng ${a} at ${b}?`,
    latex: word ? undefined : `\\text{LCM}(${a}, ${b})`,
    visual: word ? { type: 'scene', icons: ['jeep', 'clock'] } : undefined,
    answers: [String(L)],
    answerDisplay: String(L),
    hints: [`Ilista ang multiples ng ${a}: ${a}, ${2 * a}, ${3 * a}, …`, `Hanapin ang pinakamaliit na multiple na pareho sila.`],
    solution: [`GCF(${a}, ${b}) = ${gcd(a, b)}`, `LCM = (${a} × ${b}) ÷ ${gcd(a, b)} = ${L}`],
  }
}

export const ratioSimplify: Generator = () => {
  const k = ri(2, 6)
  let m = ri(1, 7), n = ri(1, 7)
  while (gcd(m, n) !== 1 || m === n) { m = ri(1, 7); n = ri(1, 7) }
  const a = m * k, b = n * k
  const name = pick(NAMES)
  const opts = shuffle([`${m}:${n}`, `${n}:${m}`, `${a}:${b * 2}`, `${m + 1}:${n}`].filter((v, i, arr) => arr.indexOf(v) === i))
  return {
    id: uid(),
    kind: 'choice',
    prompt: `Sa party ni ${name}, may ${a} na lalaki at ${b} na babae. Ano ang ratio ng lalaki sa babae sa pinakasimpleng anyo?`,
    latex: `${a}:${b}`,
    choices: opts.map((latex) => ({ latex })),
    correctIndex: opts.indexOf(`${m}:${n}`),
    answerDisplay: `${m}:${n}`,
    hints: ['Hanapin ang GCF ng dalawang numero.', 'I-divide ang dalawa sa GCF.'],
    solution: [`GCF(${a}, ${b}) = ${k}`, `${a} ÷ ${k} : ${b} ÷ ${k} = ${m}:${n}`],
  }
}

export const proportion: Generator = () => {
  const a = ri(2, 6), b = ri(2, 9) * a
  const c = ri(2, 6) * a
  const x = (b * c) / a
  const item = pick([['kilo ng bigas', 'piso'], ['kuwaderno', 'piso'], ['tasa ng harina', 'cookies']] as const)
  const unit = b / a
  return {
    id: uid(),
    kind: 'input',
    prompt: item[1] === 'piso'
      ? `Ang ${a} ${item[0]} ay ₱${b}. Magkano ang ${c} ${item[0]}?`
      : `Ang ${a} ${item[0]} ay nakakagawa ng ${b} ${item[1]}. Ilang ${item[1]} ang magagawa ng ${c} ${item[0]}?`,
    latex: `\\frac{${a}}{${b}} = \\frac{${c}}{x}`,
    answers: [String(x)],
    answerDisplay: String(x),
    hints: ['Isulat bilang proportion, tapos i-cross multiply.', `O kaya hanapin muna ang presyo/halaga ng isa: ${b} ÷ ${a}.`],
    solution: [`Isa = ${b} ÷ ${a} = ${unit}`, `${c} × ${unit} = ${x}`],
  }
}

export const decimalOps: Generator = () => {
  const mul = Math.random() < 0.4
  const a = r2(ri(105, 999) / 100), b = mul ? ri(2, 9) : r2(ri(105, 999) / 100)
  const ans = mul ? r2(a * b) : r2(a + b)
  return {
    id: uid(),
    kind: 'input',
    prompt: mul ? 'I-multiply ang decimal.' : 'I-add ang mga decimal. I-align ang decimal point!',
    latex: mul ? `${a.toFixed(2)} \\times ${b}` : `${a.toFixed(2)} + ${b.toFixed(2)}`,
    answers: [String(ans)],
    tolerance: 0.001,
    answerDisplay: ans.toFixed(2),
    hints: mul ? ['I-multiply na parang whole number, tapos ibalik ang 2 decimal places.'] : ['Ipila ang decimal points bago mag-add.'],
    solution: [`${mul ? `${a.toFixed(2)} × ${b}` : `${a.toFixed(2)} + ${b.toFixed(2)}`} = ${ans.toFixed(2)}`],
  }
}

export const percentWord: Generator = () => {
  const price = pick([120, 200, 250, 350, 400, 480, 500, 800])
  const p = pick([10, 20, 25, 30, 50])
  const off = (price * p) / 100
  const final = price - off
  return {
    id: uid(),
    kind: 'input',
    prompt: `Ang laruan ay ₱${price} at may ${p}% discount. Magkano na ang babayaran?`,
    visual: { type: 'scene', icons: ['tag', 'store'] },
    answers: [String(final)],
    prefix: '₱',
    answerDisplay: `₱${final}`,
    hints: [`Hanapin muna ang discount: ${p}% ng ${price}.`, 'Ibawas ang discount sa original na presyo.'],
    solution: [`Discount = ${p / 100} × ${price} = ₱${off}`, `₱${price} − ₱${off} = ₱${final}`],
  }
}
