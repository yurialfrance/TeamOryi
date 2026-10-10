// Grade 1 (MATATAG Key Stage 1): whole numbers up to 100, ordinal numbers up to 10th, addition
// (sums up to 20, then 100), subtraction below 100, coins and bills up to ₱100, halves and quarters,
// simple 2D shapes, repeating patterns, and time (hours, half and quarter hours, days, months).
import type { Generator } from '../engine/types'
import type { IconName } from '../components/Icon'
import { NAMES, pick, ri, shuffle } from '../engine/rand'
import { choice, frac, input, near } from './kit'

/** Which is bigger / smaller, or the symbol between two numbers */
export const compare100: Generator = () => {
  const a = ri(10, 99)
  let b = ri(10, 99)
  if (Math.random() < 0.15) b = a
  if (b !== a && Math.random() < 0.4) b = Math.floor(a / 10) * 10 + ri(0, 9) // same tens: look at the ones
  const sym = a > b ? '>' : a < b ? '<' : '='
  return choice('Anong simbolo ang dapat ilagay sa pagitan?', sym, ['>', '<', '='].filter((s) => s !== sym), {
    latex: `${a} \\;\\square\\; ${b}`, tex: true, keepOrder: false,
    display: `${a} ${sym} ${b}`,
    hints: ['Tingnan muna ang tens. Mas malaki ang may mas maraming tens.', 'Kung pareho ang tens, tingnan ang ones.'],
    solution: [`${a} = ${Math.floor(a / 10)} tens at ${a % 10} ones; ${b} = ${Math.floor(b / 10)} tens at ${b % 10} ones`, `Kaya ${a} ${sym} ${b}`],
  })
}

/** Number just before / after / between */
export const beforeAfter: Generator = () => {
  const n = ri(2, 98)
  const kind = pick(['after', 'before', 'between'] as const)
  if (kind === 'between') {
    return input(`Anong numero ang nasa gitna ng ${n - 1} at ${n + 1}?`, n, {
      visual: { type: 'sequence', items: [String(n - 1), null, String(n + 1)] },
      hints: ['Magbilang mula sa unang numero.'], solution: [`${n - 1}, ${n}, ${n + 1}`],
    })
  }
  const ans = kind === 'after' ? n + 1 : n - 1
  return input(kind === 'after' ? `Anong numero ang kasunod ng ${n}?` : `Anong numero ang bago ang ${n}?`, ans, {
    visual: { type: 'sequence', items: kind === 'after' ? [String(n), null] : [null, String(n)] },
    hints: [kind === 'after' ? 'Ang kasunod ay mas marami ng 1.' : 'Ang bago ay kulang ng 1.'],
    solution: [kind === 'after' ? `${n} + 1 = ${ans}` : `${n} − 1 = ${ans}`],
  })
}

/** Tens and ones of a 2-digit number */
export const tensOnes: Generator = () => {
  const t = ri(1, 9), o = ri(0, 9), n = t * 10 + o
  const mode = pick(['build', 'tens', 'ones'] as const)
  if (mode === 'build') {
    return input(`Ano ang numero na may ${t} tens at ${o} ones?`, n, {
      visual: { type: 'bar', num: t, den: 10 },
      hints: [`Ang ${t} tens ay ${t * 10}.`, `${t * 10} + ${o} = ?`], solution: [`${t} tens = ${t * 10}`, `${t * 10} + ${o} = ${n}`],
    })
  }
  const ans = mode === 'tens' ? t : o
  return input(`Ilan ang ${mode} sa ${n}?`, ans, {
    hints: ['Sa 2-digit na numero: kaliwa ang tens, kanan ang ones.'],
    solution: [`${n} = ${t} tens at ${o} ones`, `Kaya ang ${mode} ay ${ans}.`],
  })
}

const ITEMS: { icon: IconName; name: string }[] = [
  { icon: 'egg', name: 'itlog' }, { icon: 'milk', name: 'gatas' }, { icon: 'bread', name: 'tinapay' }, { icon: 'candy', name: 'kendi' },
  { icon: 'bottle', name: 'bote' }, { icon: 'pineapple', name: 'pinya' }, { icon: 'coffee', name: 'kape' }, { icon: 'biscuit', name: 'biskwit' },
]
const ORD = ['1st (una)', '2nd (ikalawa)', '3rd (ikatlo)', '4th (ikaapat)', '5th (ikalima)', '6th (ikaanim)', '7th (ikapito)', '8th (ikawalo)', '9th (ikasiyam)', '10th (ikasampu)']

/** Ordinal numbers up to 10th */
export const ordinal: Generator = () => {
  if (Math.random() < 0.5) {
    const row = shuffle(ITEMS).slice(0, 5)
    const i = ri(0, 4)
    return choice(`Mula sa kaliwa, pang-ilan ang ${row[i].name}?`, ORD[i], ORD.slice(0, 5), {
      visual: { type: 'scene', icons: row.map((r) => r.icon) },
      hints: ['Magbilang mula sa kaliwa: una, ikalawa, ikatlo…'], solution: [`Ang ${row[i].name} ay ${ORD[i]} mula sa kaliwa.`],
    })
  }
  const name = pick(NAMES), pos = ri(2, 10)
  const ahead = Math.random() < 0.5
  const total = ri(pos, 10)
  const ans = ahead ? pos - 1 : total - pos
  return input(ahead ? `Si ${name} ay pang-${pos} sa pila. Ilan ang tao sa unahan niya?` : `May ${total} na tao sa pila. Si ${name} ay pang-${pos}. Ilan ang nasa likod niya?`, ans, {
    hints: [ahead ? `Kung pang-${pos} siya, lahat ng nauna sa kanya ay ${pos} bawas 1.` : `Ibawas ang pwesto niya sa kabuuan.`],
    solution: [ahead ? `${pos} − 1 = ${ans}` : `${total} − ${pos} = ${ans}`],
  })
}

/** Addition with sums up to 20 (facts) */
export const addTo20: Generator = () => {
  const a = ri(2, 10), b = ri(2, 20 - a)
  const s = a + b
  const word = Math.random() < 0.35
  const name = pick(NAMES)
  return input(word ? `May ${a} na kendi si ${name}. Binigyan pa siya ng ${b}. Ilan na lahat?` : 'I-add.', s, {
    latex: word ? undefined : `${a} + ${b} = ?`,
    visual: word ? { type: 'scene', icons: ['candy', 'plus', 'candy'] } : undefined,
    hints: [`Simulan sa ${Math.max(a, b)}, tapos magbilang pa ng ${Math.min(a, b)}.`, s > 10 ? `Gumawa muna ng 10: ${a} + ${10 - a} = 10.` : 'Gamitin ang daliri kung kailangan.'],
    solution: [`${a} + ${b} = ${s}`],
  })
}

/** Two-digit addition with sums up to 100 */
export const addTo100: Generator = () => {
  const a = ri(11, 79), b = ri(5, 99 - a)
  const s = a + b
  const carry = (a % 10) + (b % 10) >= 10
  return input('I-add. Ones muna, tapos tens.', s, {
    latex: `${a} + ${b} = ?`,
    hints: [`Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}.`, carry ? 'Lampas 9 ang ones — i-carry ang 1 sa tens.' : 'Tapos i-add ang tens.'],
    solution: [`Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}${carry ? ' (i-carry ang 1)' : ''}`, `${a} + ${b} = ${s}`],
  })
}

/** Subtraction where both numbers are below 100 */
export const subUnder100: Generator = () => {
  const a = ri(20, 99), b = ri(3, a - 5)
  const d = a - b
  const word = Math.random() < 0.35
  const name = pick(NAMES)
  return input(word ? `May ${a} na mangga si ${name}. Naibenta niya ang ${b}. Ilan ang natira?` : 'I-subtract.', d, {
    latex: word ? undefined : `${a} - ${b} = ?`,
    hints: ['Ones muna. Kung kulang, humiram ng 1 ten (10 ones).', `Check: ang sagot + ${b} ay dapat ${a}.`],
    solution: [`${a} − ${b} = ${d}`, `Check: ${d} + ${b} = ${a}`],
  })
}

/** Counting coins and bills up to ₱100 */
export const coins100: Generator = () => {
  for (;;) {
    const kinds = shuffle([1, 5, 10, 20, 50]).slice(0, ri(2, 3)).sort((x, y) => y - x)
    const counts = kinds.map((k) => (k === 50 ? 1 : ri(1, 4)))
    const total = kinds.reduce((s, k, i) => s + k * counts[i], 0)
    if (total > 100) continue
    const list = kinds.map((k, i) => `${counts[i]} na ${k === 50 ? 'papel na ₱50' : `₱${k}`}`).join(', ')
    return input(`Magkano lahat ang ${list}?`, total, {
      prefix: '₱', visual: { type: 'scene', icons: ['coins', 'coins'] },
      hints: ['Bilangin muna ang pinakamalaki.', 'I-add ang lahat ng halaga.'],
      solution: [...kinds.map((k, i) => `${counts[i]} × ₱${k} = ₱${k * counts[i]}`), `Kabuuan = ₱${total}`],
    })
  }
}

/** Spending money below ₱100: what is left */
export const moneyLeft: Generator = () => {
  const have = pick([20, 50, 100])
  const item = pick([{ n: 'tinapay', p: [8, 12, 15] }, { n: 'kendi', p: [2, 5, 7] }, { n: 'gatas', p: [18, 25, 35] }, { n: 'lapis', p: [9, 12, 15] }, { n: 'notebook', p: [25, 35, 45] }])
  const price = pick(item.p.filter((p) => p < have))
  const left = have - price
  const name = pick(NAMES)
  return input(`May ₱${have} si ${name}. Bumili siya ng ${item.n} na ₱${price}. Magkano ang natira?`, left, {
    prefix: '₱', visual: { type: 'scene', icons: ['store', 'coins'] },
    hints: ['Ibawas ang presyo sa perang hawak.'], solution: [`₱${have} − ₱${price} = ₱${left}`],
  })
}

/** Halves and quarters of a whole */
export const halvesQuarters: Generator = () => {
  if (Math.random() < 0.55) {
    const [num, den] = pick([[1, 2], [1, 4], [2, 4], [3, 4]] as const)
    const ans = frac(num, den)
    const name = den === 2 ? 'kalahati (one half)' : num === 1 ? 'isang kapat (one fourth)' : num === 2 ? 'dalawang kapat = kalahati' : 'tatlong kapat (three fourths)'
    return choice('Anong bahagi ng pizza ang may topping?', ans, ['\\frac{1}{2}', '\\frac{1}{4}', '\\frac{3}{4}', '\\frac{1}{3}'], {
      visual: { type: 'pizza', num, den }, tex: true, display: `${num}/${den} — ${name}`,
      hints: ['Ilan ang pantay na hiwa? Iyan ang ibaba (denominator).', 'Ilan ang may topping? Iyan ang itaas.'],
      solution: [`${den} pantay na hiwa, ${num} ang may topping`, `${num}/${den}${num === 2 && den === 4 ? ' = 1/2' : ''}`],
    })
  }
  const wholes = ri(1, 4)
  const half = Math.random() < 0.5
  const ans = wholes * (half ? 2 : 4)
  return input(`Ilan ang ${half ? 'kalahati (halves)' : 'kapat (quarters)'} sa ${wholes} buong pizza?`, ans, {
    visual: { type: 'pizza', num: half ? 2 : 4, den: half ? 2 : 4 },
    hints: [half ? 'Ang isang buo ay may 2 kalahati.' : 'Ang isang buo ay may 4 na kapat.'],
    solution: [`${wholes} × ${half ? 2 : 4} = ${ans}`],
  })
}

const SHAPES: Record<number, string> = { 0: 'bilog (circle)', 3: 'tatsulok (triangle)', 4: 'parisukat (square)', 5: 'pentagon', 6: 'hexagon' }

/** Simple 2D shapes: name, sides and corners */
export const shapes: Generator = () => {
  const sides = pick([0, 3, 4, 3, 4, 5, 6])
  if (sides === 0 || Math.random() < 0.5) {
    return choice('Anong hugis ito?', SHAPES[sides], Object.values(SHAPES).filter((s) => s !== SHAPES[sides]), {
      visual: { type: 'polygon', sides },
      hints: [sides === 0 ? 'Walang gilid at walang sulok.' : 'Bilangin ang mga gilid (sides).'],
      solution: [sides === 0 ? 'Walang sides at corners: bilog.' : `${sides} sides → ${SHAPES[sides]}`],
    })
  }
  const corners = Math.random() < 0.5
  return input(`Ilan ang ${corners ? 'sulok (corners)' : 'gilid (sides)'} ng ${SHAPES[sides]}?`, sides, {
    visual: { type: 'polygon', sides },
    hints: ['Ituro at bilangin isa-isa.', 'Sa polygon, pareho ang bilang ng sides at corners.'],
    solution: [`Ang ${SHAPES[sides]} ay may ${sides} sides at ${sides} corners.`],
  })
}

/** Repeating patterns (AB, ABC, AAB…) */
export const repeating: Generator = () => {
  const sets = [['pula', 'asul'], ['pula', 'asul', 'dilaw'], ['1', '2'], ['5', '5', '0'], ['ba', 'be', 'bi'], ['3', '6', '9']]
  const unit = pick(sets)
  const len = unit.length * 2 + ri(1, unit.length)
  const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length])
  const ans = unit[len % unit.length]
  return choice('Ano ang susunod sa pattern?', ans, unit.length === 2 ? [...unit, unit.join('')] : unit, {
    visual: { type: 'sequence', items: [...seq, null] },
    hints: [`Ang umuulit na grupo ay: ${unit.join(', ')}.`, 'Hanapin kung saan ka na sa grupo.'],
    solution: [`Umuulit: ${unit.join(', ')}`, `Kasunod: ${ans}`],
  })
}

const DAYS = ['Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado', 'Linggo']
const MONTHS = ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre']

/** Reading an analog clock: hour, half hour, quarter hour */
export const clockRead: Generator = () => {
  const h = ri(1, 12), m = pick([0, 0, 30, 30, 15, 45])
  const t = (hh: number, mm: number) => `${hh}:${String(mm).padStart(2, '0')}`
  const ans = t(h, m)
  const hourHandNext = h % 12 + 1
  return choice('Anong oras ang ipinapakita ng orasan?', ans, [t(hourHandNext, m), t(h, (m + 30) % 60), t(m === 0 ? 12 : m / 5, h * 5 % 60), t(h, m === 15 ? 45 : 15)], {
    visual: { type: 'clock', h, m },
    hints: ['Ang maikling kamay ay ang oras (hour).', 'Ang mahabang kamay ay ang minuto: sa 6 ay :30, sa 3 ay :15, sa 9 ay :45.'],
    solution: [`Maikling kamay: ${h}${m ? ' (lampas na nang kaunti)' : ''}`, `Mahabang kamay: ${m} minuto → ${ans}`],
  })
}

/** Days of the week and months of the year */
export const calendar: Generator = () => {
  const kind = pick(['dayAfter', 'dayBefore', 'monthAfter', 'count'] as const)
  if (kind === 'count') {
    const [q, a] = pick([['Ilang araw ang isang linggo?', 7], ['Ilang buwan ang isang taon?', 12], ['Ilang araw ang 2 linggo?', 14], ['Ilang buwan ang kalahating taon?', 6]] as const)
    return input(q, a, { visual: { type: 'scene', icons: ['calendar'] }, hints: ['1 linggo = 7 araw; 1 taon = 12 buwan.'], solution: [`${q.replace('?', '')}: ${a}`] })
  }
  if (kind === 'monthAfter') {
    const i = ri(0, 11)
    const n = ri(1, 3)
    const ans = MONTHS[(i + n) % 12]
    return choice(`Anong buwan ang ${n === 1 ? 'kasunod ng' : `${n} buwan pagkatapos ng`} ${MONTHS[i]}?`, ans, near(i + n, 3, 2).map((k) => MONTHS[k % 12]), {
      visual: { type: 'scene', icons: ['calendar'] },
      hints: ['Enero, Pebrero, Marso, Abril, Mayo, Hunyo, Hulyo, Agosto, Setyembre, Oktubre, Nobyembre, Disyembre.'],
      solution: [`${MONTHS[i]} → ${Array.from({ length: n }, (_, k) => MONTHS[(i + k + 1) % 12]).join(' → ')}`],
    })
  }
  const i = ri(0, 6)
  const ans = kind === 'dayAfter' ? DAYS[(i + 1) % 7] : DAYS[(i + 6) % 7]
  return choice(`Anong araw ang ${kind === 'dayAfter' ? 'kasunod ng' : 'bago ang'} ${DAYS[i]}?`, ans, DAYS.filter((d) => d !== DAYS[i]), {
    visual: { type: 'scene', icons: ['calendar'] },
    hints: ['Lunes, Martes, Miyerkules, Huwebes, Biyernes, Sabado, Linggo.'],
    solution: [`${kind === 'dayAfter' ? `${DAYS[i]} → ${ans}` : `${ans} → ${DAYS[i]}`}`],
  })
}
