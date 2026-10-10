// Grade 2 (MATATAG Key Stage 1): numbers up to 1000, odd/even, increasing and decreasing patterns,
// multiplication and division with the 2, 3, 4, 5 and 10 tables, elapsed time (a.m./p.m.),
// perimeter of triangles, squares and rectangles, and pictographs with a scale.
import type { Generator } from '../engine/types'
import { NAMES, pick, ri } from '../engine/rand'
import { choice, input } from './kit'

/** Place value and comparing in 3-digit numbers */
export const placeValue1000: Generator = () => {
  if (Math.random() < 0.5) {
    const h = ri(1, 9), t = ri(0, 9), o = ri(0, 9)
    const n = h * 100 + t * 10 + o
    return input(`Ano ang numero: ${h} hundreds, ${t} tens at ${o} ones?`, n, {
      hints: ['Hundreds × 100, tens × 10, ones × 1.'], solution: [`${h * 100} + ${t * 10} + ${o} = ${n}`],
    })
  }
  const nums = [ri(100, 999), ri(100, 999), ri(100, 999)]
  while (new Set(nums).size < 3) nums[2] = ri(100, 999)
  const big = Math.random() < 0.5
  const ans = big ? Math.max(...nums) : Math.min(...nums)
  return choice(`Alin ang ${big ? 'pinakamalaki' : 'pinakamaliit'}?`, ans, nums, {
    hints: ['Ikumpara muna ang hundreds.', 'Kung pareho, tingnan ang tens, tapos ang ones.'],
    solution: [`Ayos mula maliit: ${[...nums].sort((a, b) => a - b).join(' < ')}`, `Sagot: ${ans}`],
  })
}

/** Odd and even numbers */
export const oddEven: Generator = () => {
  const n = ri(10, 999)
  const even = n % 2 === 0
  if (Math.random() < 0.6) {
    return choice(`Ang ${n} ba ay odd o even?`, even ? 'Even' : 'Odd', [even ? 'Odd' : 'Even'], {
      hints: ['Tingnan lang ang ones digit.', 'Even kung 0, 2, 4, 6 o 8 ang ones digit.'],
      solution: [`Ones digit: ${n % 10}`, `Kaya ${even ? 'even' : 'odd'} ang ${n}.`],
    })
  }
  const wantEven = Math.random() < 0.5
  const ans = (() => { let x = ri(12, 96); while ((x % 2 === 0) !== wantEven) x++; return x })()
  const wrong = [ans + 1, ans - 1, ans + ri(1, 3) * 2 + 1]
  return choice(`Alin ang ${wantEven ? 'even' : 'odd'} number?`, ans, wrong, {
    hints: [wantEven ? 'Nagtatapos sa 0, 2, 4, 6 o 8.' : 'Nagtatapos sa 1, 3, 5, 7 o 9.'],
    solution: [`${ans} → ones digit ${ans % 10}, ${wantEven ? 'even' : 'odd'}`],
  })
}

/** Increasing / decreasing patterns: find the missing term */
export const skipPattern: Generator = () => {
  const step = pick([2, 5, 10, 100, 3, 4, 50])
  const up = Math.random() < 0.6
  const start = up ? ri(1, 20) * (step >= 50 ? 50 : 1) : ri(30, 90) * (step >= 50 ? 10 : 1)
  const seq = Array.from({ length: 6 }, (_, i) => start + (up ? 1 : -1) * step * i)
  if (seq.some((x) => x < 0 || x > 1000)) return skipPattern()
  const hole = ri(2, 5)
  return input(`Ano ang nawawalang numero? (${up ? 'pataas' : 'pababa'} ang pattern)`, seq[hole], {
    visual: { type: 'sequence', items: seq.map((x, i) => (i === hole ? null : String(x))) },
    hints: ['Ano ang pagitan ng magkasunod na numero?', `${up ? 'Dagdag' : 'Bawas'} ng ${step} bawat isa.`],
    solution: [`Pattern: ${up ? '+' : '−'}${step}`, `${seq[hole - 1]} ${up ? '+' : '−'} ${step} = ${seq[hole]}`],
  })
}

/** Multiplication with the 2, 3, 4, 5 and 10 tables */
export const times2to10: Generator = () => {
  const a = pick([2, 3, 4, 5, 10]), b = ri(1, 10)
  const p = a * b
  const word = Math.random() < 0.4
  const name = pick(NAMES)
  return input(word ? `May ${b} na kahon si ${name}. May ${a} na itlog sa bawat kahon. Ilan lahat ang itlog?` : 'I-multiply.', p, {
    latex: word ? undefined : `${b} \\times ${a} = ?`,
    visual: word ? { type: 'scene', icons: ['egg', 'egg', 'egg'] } : undefined,
    hints: [`Ang ${b} × ${a} ay ${b} grupo ng ${a}.`, `Magbilang ng ${a}: ${Array.from({ length: Math.min(b, 5) }, (_, i) => a * (i + 1)).join(', ')}…`],
    solution: [`${b} × ${a} = ${p}`],
  })
}

/** Division with the same tables (equal sharing) */
export const divide2to10: Generator = () => {
  const d = pick([2, 3, 4, 5, 10]), q = ri(1, 10)
  const n = d * q
  const word = Math.random() < 0.5
  return input(word ? `Hinati nang pantay ang ${n} na kendi sa ${d} na bata. Ilan ang kendi ng bawat isa?` : 'I-divide.', q, {
    latex: word ? undefined : `${n} \\div ${d} = ?`,
    visual: word ? { type: 'scene', icons: ['candy', 'candy'] } : undefined,
    hints: [`Anong numero ang × ${d} = ${n}?`, `Gamitin ang ${d} times table.`],
    solution: [`${d} × ${q} = ${n}`, `Kaya ${n} ÷ ${d} = ${q}`],
  })
}

const fmtTime = (mins: number) => {
  const h24 = Math.floor(mins / 60) % 24, m = mins % 60
  const h = h24 % 12 || 12
  return `${h}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`
}

/** Elapsed time in hours and minutes (a.m./p.m.) */
export const elapsedTime: Generator = () => {
  const start = ri(6, 17) * 60 + pick([0, 15, 30, 45])
  const dur = pick([30, 45, 60, 90, 120, 150, 180, 15])
  const end = start + dur
  const name = pick(NAMES)
  if (Math.random() < 0.5) {
    return choice(`Nagsimula si ${name} mag-aral nang ${fmtTime(start)}. Natapos siya pagkalipas ng ${dur >= 60 ? `${Math.floor(dur / 60)} oras${dur % 60 ? ` at ${dur % 60} minuto` : ''}` : `${dur} minuto`}. Anong oras siya natapos?`,
      fmtTime(end), [fmtTime(end + 60), fmtTime(end - 30), fmtTime(end + 15), fmtTime(start + dur * 2)], {
        visual: { type: 'clock', h: Math.floor(start / 60) % 12 || 12, m: start % 60 },
        hints: ['Idagdag muna ang buong oras, tapos ang minuto.', '60 minuto = 1 oras.'],
        solution: [`${fmtTime(start)} + ${dur} minuto = ${fmtTime(end)}`],
      })
  }
  return input(`Mula ${fmtTime(start)} hanggang ${fmtTime(end)}, ilang minuto ang lumipas?`, dur, {
    suffix: 'minuto',
    hints: ['Bilangin ang buong oras (× 60), tapos ang natitirang minuto.'],
    solution: [`${fmtTime(start)} → ${fmtTime(end)}`, `= ${dur} minuto`],
  })
}

/** Perimeter of triangles, squares and rectangles */
export const perimeterBasic: Generator = () => {
  const shape = pick(['square', 'rectangle', 'triangle'] as const)
  if (shape === 'square') {
    const s = ri(2, 25), p = 4 * s
    return input(`Ang bawat gilid ng parisukat (square) na garden ay ${s} m. Ano ang perimeter nito?`, p, {
      suffix: 'm', visual: { type: 'polygon', sides: 4, label: `${s} m` },
      hints: ['Ang perimeter ay ang kabuuang haba ng lahat ng gilid.', 'May 4 na pantay na gilid ang square.'],
      solution: [`P = ${s} + ${s} + ${s} + ${s}`, `P = 4 × ${s} = ${p} m`],
    })
  }
  if (shape === 'rectangle') {
    const l = ri(5, 30), w = ri(2, l - 1), p = 2 * (l + w)
    return input(`Ang rectangle na mesa ay ${l} dm ang haba at ${w} dm ang lapad. Ano ang perimeter?`, p, {
      suffix: 'dm',
      hints: ['Dalawang haba at dalawang lapad.', `${l} + ${w} + ${l} + ${w}`],
      solution: [`P = ${l} + ${w} + ${l} + ${w}`, `P = ${p} dm`],
    })
  }
  const a = ri(3, 20), b = ri(3, 20), c = ri(Math.abs(a - b) + 1, a + b - 1)
  return input(`Ang mga gilid ng tatsulok ay ${a} cm, ${b} cm at ${c} cm. Ano ang perimeter?`, a + b + c, {
    suffix: 'cm', visual: { type: 'polygon', sides: 3 },
    hints: ['I-add ang tatlong gilid.'], solution: [`P = ${a} + ${b} + ${c} = ${a + b + c} cm`],
  })
}

/** Pictograph with a scale: each picture stands for several */
export const pictograph: Generator = () => {
  const scale = pick([2, 5, 10])
  const fruits = ['Mangga', 'Saging', 'Pinya', 'Bayabas']
  const pics = fruits.map(() => ri(1, 6))
  const i = ri(0, 3)
  const rows = [['Prutas', `Larawan (1 = ${scale})`], ...fruits.map((f, k) => [f, '■'.repeat(pics[k])])]
  const ans = pics[i] * scale
  return input(`Sa pictograph, ang bawat ■ ay ${scale} na prutas. Ilan ang ${fruits[i].toLowerCase()}?`, ans, {
    visual: { type: 'table', rows },
    hints: [`Bilangin ang ■ sa hanay ng ${fruits[i]}.`, `I-multiply sa ${scale}.`],
    solution: [`${fruits[i]}: ${pics[i]} na ■`, `${pics[i]} × ${scale} = ${ans}`],
  })
}

/** Money up to ₱1000: total of a few purchases */
export const money1000: Generator = () => {
  const items = [['bag', [250, 320, 399]], ['sapatos', [450, 499, 550]], ['libro', [120, 145, 180]], ['payong', [150, 199, 220]], ['t-shirt', [180, 200, 249]]] as const
  const [a, b] = [pick(items), pick(items)]
  const pa = pick(a[1]), pb = pick(b[1])
  if (pa + pb > 1000) return money1000()
  const total = pa + pb
  return input(`Bumili si ${pick(NAMES)} ng ${a[0]} (₱${pa}) at ${b[0]} (₱${pb}). Magkano lahat?`, total, {
    prefix: '₱', visual: { type: 'scene', icons: ['store', 'tag'] },
    hints: ['I-add ang dalawang presyo.', 'Ones, tens, tapos hundreds — huwag kalimutang mag-carry.'],
    solution: [`₱${pa} + ₱${pb} = ₱${total}`],
  })
}

