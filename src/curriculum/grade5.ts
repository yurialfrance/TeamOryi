// Grade 5 (MATATAG Key Stage 2): GMDAS, divisibility, prime and composite numbers, multiplying and
// dividing fractions, decimals up to ten-thousandths and all four operations on them, area of
// parallelograms, triangles and trapezoids, surface area, 12/24-hour time and time zones, and
// theoretical probability.
import type { Generator } from '../engine/types'
import { NAMES, pick, ri } from '../engine/rand'
import { choice, frac, fracText, input, near, round } from './kit'

/** GMDAS: grouping symbols first */
export const gmdas: Generator = () => {
  const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9), d = ri(1, 9)
  const forms = [
    { tex: `(${a} + ${b}) \\times ${c} - ${d}`, val: (a + b) * c - d, steps: [`(${a} + ${b}) = ${a + b}`, `${a + b} × ${c} = ${(a + b) * c}`, `${(a + b) * c} − ${d} = ${(a + b) * c - d}`] },
    { tex: `${a * c} \\div (${c} \\times 1) + ${b} \\times (${d} + 1)`, val: a + b * (d + 1), steps: [`Grouping: (${c} × 1) = ${c}, (${d} + 1) = ${d + 1}`, `${a * c} ÷ ${c} = ${a},  ${b} × ${d + 1} = ${b * (d + 1)}`, `${a} + ${b * (d + 1)} = ${a + b * (d + 1)}`] },
    { tex: `${a} \\times [${b} + (${c} - 1)] `, val: a * (b + c - 1), steps: [`(${c} − 1) = ${c - 1}`, `[${b} + ${c - 1}] = ${b + c - 1}`, `${a} × ${b + c - 1} = ${a * (b + c - 1)}`] },
    { tex: `(${a * 2}.5 - ${a}.5) \\times ${b}`, val: a * b, steps: [`(${a * 2}.5 − ${a}.5) = ${a}`, `${a} × ${b} = ${a * b}`] },
  ]
  const f = pick(forms)
  return input('Sundin ang GMDAS. Ano ang sagot?', f.val, {
    latex: f.tex,
    hints: ['G: Grouping symbols muna — ( ), [ ].', 'Tapos M at D (kaliwa→kanan), saka A at S.'],
    solution: f.steps,
  })
}

const isPrime = (n: number) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((k) => n % k !== 0)

/** Divisibility rules, prime and composite */
export const divisibility: Generator = () => {
  if (Math.random() < 0.45) {
    const n = ri(11, 99)
    const prime = isPrime(n)
    return choice(`Ang ${n} ba ay prime o composite?`, prime ? 'Prime' : 'Composite', [prime ? 'Composite' : 'Prime', 'Hindi prime, hindi composite'], {
      hints: ['Prime: 2 lang ang factors (1 at ang sarili).', 'Subukang i-divide sa 2, 3, 5, 7.'],
      solution: prime ? [`Walang naghahati sa ${n} maliban sa 1 at ${n}.`, 'Kaya prime.'] : [`${n} = ${[2, 3, 5, 7].find((k) => n % k === 0)} × ${n / [2, 3, 5, 7].find((k) => n % k === 0)!}`, 'Kaya composite.'],
    })
  }
  const k = pick([2, 3, 4, 5, 6, 9, 10])
  const RULE: Record<number, string> = {
    2: 'Even ang huling digit.', 3: 'Ang sum ng digits ay divisible by 3.', 4: 'Ang huling dalawang digit ay divisible by 4.',
    5: 'Nagtatapos sa 0 o 5.', 6: 'Divisible by 2 at by 3.', 9: 'Ang sum ng digits ay divisible by 9.', 10: 'Nagtatapos sa 0.',
  }
  const ans = k * ri(12, 999)
  const wrong = near(ans, 10, 7).filter((x) => x % k !== 0)
  return choice(`Alin ang divisible by ${k}?`, ans, wrong, {
    hints: [RULE[k]],
    solution: [RULE[k], `${ans} ÷ ${k} = ${ans / k}`],
  })
}

/** Multiply and divide fractions (lowest terms) */
export const mulDivFractions: Generator = () => {
  const mul = Math.random() < 0.5
  const a = ri(1, 7), b = ri(a + 1, 9), c = ri(1, 7), d = ri(c + 1, 9)
  if (Math.random() < 0.25) {
    const w = pick([6, 8, 10, 12, 15, 20, 24])
    const dd = pick([2, 3, 4, 5, 6].filter((x) => w % x === 0))
    const nn = ri(1, dd - 1)
    return input(`Ano ang ${nn}/${dd} ng ${w}?`, (w / dd) * nn, {
      latex: `\\frac{${nn}}{${dd}} \\times ${w}`,
      hints: [`I-divide ang ${w} sa ${dd}, tapos i-multiply sa ${nn}.`],
      solution: [`${w} ÷ ${dd} = ${w / dd}`, `${w / dd} × ${nn} = ${(w / dd) * nn}`],
    })
  }
  const num = mul ? a * c : a * d, den = mul ? b * d : b * c
  const ans = frac(num, den)
  return input('Sagutin. Isulat sa lowest terms.', ans, {
    latex: `\\frac{${a}}{${b}} ${mul ? '\\times' : '\\div'} \\frac{${c}}{${d}} = ?`, simplest: true,
    display: fracText(num, den),
    hints: mul ? ['I-multiply ang numerators, i-multiply ang denominators.', 'I-simplify sa dulo.'] : ['Keep-change-flip: panatilihin ang una, gawing × ang ÷, baligtarin ang pangalawa.', `${c}/${d} → ${d}/${c}`],
    solution: mul ? [`(${a} × ${c}) / (${b} × ${d}) = ${num}/${den}`, `= ${fracText(num, den)}`] : [`${a}/${b} × ${d}/${c} = ${num}/${den}`, `= ${fracText(num, den)}`],
  })
}

const PLACE = ['tenths', 'hundredths', 'thousandths', 'ten-thousandths']

/** Decimals up to ten-thousandths: place value, comparing, rounding */
export const decimalPlace: Generator = () => {
  const n = ri(10001, 99999) / 10000
  const s = n.toFixed(4)
  const kind = pick(['digit', 'round', 'compare'] as const)
  if (kind === 'digit') {
    const p = ri(0, 3)
    const digit = Number(s[2 + p])
    return input(`Anong digit ang nasa ${PLACE[p]} place ng ${s}?`, digit, {
      hints: ['Pagkatapos ng decimal point: tenths, hundredths, thousandths, ten-thousandths.'],
      solution: [`${s}: ${PLACE.map((pl, i) => `${pl} = ${s[2 + i]}`).join(', ')}`],
    })
  }
  if (kind === 'round') {
    const dp = ri(1, 3)
    const ans = round(n, dp)
    return input(`I-round off ang ${s} sa pinakamalapit na ${PLACE[dp - 1]}.`, ans, {
      tolerance: 1e-9, display: ans.toFixed(dp), topic: 'decimals-rounding',
      hints: [`Tingnan ang digit sa kanan ng ${PLACE[dp - 1]}.`, '5 pataas: dagdagan ng 1. 4 pababa: iwan.'],
      solution: [`Digit sa kanan: ${s[2 + dp]}`, `${s} → ${ans.toFixed(dp)}`],
    })
  }
  const m = round(n + pick([-1, 1]) * pick([0.001, 0.01, 0.0005, 0.1]), 4)
  const big = Math.max(n, m)
  return choice('Alin ang mas malaki?', String(big), [String(n), String(m)], {
    hints: ['Ikumpara mula sa kaliwa: ones, tenths, hundredths…', 'Puwedeng dagdagan ng 0 sa dulo para pantay ang haba.'],
    solution: [`${n.toFixed(4)} vs ${m.toFixed(4)}`, `Mas malaki: ${big}`],
  })
}

/** Adding and subtracting decimals with different numbers of places */
export const addSubDecimals: Generator = () => {
  const a = round(ri(100, 9999) / pick([10, 100, 1000]), 3), b = round(ri(100, 9999) / pick([10, 100, 1000]), 3)
  const add = Math.random() < 0.55
  const [x, y] = add || a >= b ? [a, b] : [b, a]
  const ans = round(add ? x + y : x - y, 4)
  const word = Math.random() < 0.3
  return input(word ? (add ? `Tumakbo si ${pick(NAMES)} ng ${x} km noong Lunes at ${y} km noong Martes. Ilang km lahat?` : `May ${x} L na tubig sa timba. Ginamit ang ${y} L. Ilang litro ang natira?`) : add ? 'I-add ang mga decimal.' : 'I-subtract ang mga decimal.', ans, {
    latex: word ? undefined : `${x} ${add ? '+' : '-'} ${y}`, tolerance: 1e-6,
    hints: ['I-align ang decimal points.', 'Lagyan ng 0 ang bakanteng places para pantay.'],
    solution: [`${x} ${add ? '+' : '−'} ${y} = ${ans}`],
  })
}

/** Multiplying and dividing decimals */
export const mulDivDecimals: Generator = () => {
  const kind = pick(['dxd', 'dxw', 'ddivw', 'pow10'] as const)
  if (kind === 'pow10') {
    const n = round(ri(11, 9999) / 100, 2), p = pick([10, 100, 1000, 0.1, 0.01])
    const div = Math.random() < 0.5
    const ans = round(div ? n / p : n * p, 6)
    return input(div ? 'I-divide.' : 'I-multiply.', ans, {
      latex: `${n} ${div ? '\\div' : '\\times'} ${p}`, tolerance: 1e-9,
      hints: [p >= 10 ? `Ilipat ang decimal point nang ${String(p).length - 1} place ${div ? 'pakaliwa' : 'pakanan'}.` : `Ang ${div ? '÷' : '×'} ${p} ay katumbas ng ${div ? '×' : '÷'} ${round(1 / p, 0)}.`],
      solution: [`${n} ${div ? '÷' : '×'} ${p} = ${ans}`],
    })
  }
  if (kind === 'ddivw') {
    const w = ri(2, 9), q = round(ri(11, 999) / 100, 2)
    const n = round(q * w, 4)
    return input(`Hinati nang pantay ang ${n} kg na bigas sa ${w} na supot. Ilang kg bawat supot?`, q, {
      latex: `${n} \\div ${w}`, tolerance: 1e-6,
      hints: ['Mag-divide na parang whole number.', 'Itapat ang decimal point ng quotient sa dividend.'],
      solution: [`${n} ÷ ${w} = ${q}`],
    })
  }
  const a = round(ri(11, 99) / 10, 1), b = kind === 'dxd' ? round(ri(11, 99) / 10, 1) : ri(3, 25)
  const ans = round(a * b, 4)
  const dp = kind === 'dxd' ? 2 : 1
  return input(kind === 'dxw' ? `Ang bawat supot ay may ${a} kg na asukal. Ilang kg ang ${b} na supot?` : 'I-multiply ang mga decimal.', ans, {
    latex: `${a} \\times ${b}`, tolerance: 1e-6,
    hints: ['I-multiply na parang whole numbers.', 'Bilangin ang decimal places ng dalawang factors — iyan ang decimal places ng sagot.'],
    solution: [`${round(a * 10, 0)} × ${dp === 2 ? round(b * 10, 0) : b} = ${round(ans * 10 ** dp, 0)}`, `${dp} decimal place${dp > 1 ? 's' : ''} → ${ans}`],
  })
}

/** Area of parallelograms, triangles and trapezoids; surface area of a cube / box */
export const areaPolygons: Generator = () => {
  const kind = pick(['para', 'tri', 'trap', 'surface'] as const)
  if (kind === 'surface') {
    const cube = Math.random() < 0.5
    const l = ri(2, 12), w = cube ? l : ri(2, 10), h = cube ? l : ri(2, 10)
    const sa = 2 * (l * w + l * h + w * h)
    return input(cube ? `Ano ang surface area ng cube na ${l} cm bawat gilid?` : `Ano ang surface area ng kahon (rectangular prism) na ${l} cm × ${w} cm × ${h} cm?`, sa, {
      suffix: 'sq. cm', topic: 'measurement-volume',
      hints: cube ? ['May 6 na magkaparehong square faces ang cube.', `6 × ${l}²`] : ['May 3 pares ng magkaparehong faces.', 'SA = 2(lw + lh + wh)'],
      solution: cube ? [`SA = 6 × ${l} × ${l} = ${sa} sq. cm`] : [`SA = 2(${l * w} + ${l * h} + ${w * h})`, `SA = ${sa} sq. cm`],
    })
  }
  if (kind === 'trap') {
    const b1 = ri(4, 20), b2 = ri(2, 18), h = ri(2, 12)
    const area = ((b1 + b2) * h) / 2
    return input(`Ang trapezoid ay may bases na ${b1} m at ${b2} m, at taas (height) na ${h} m. Ano ang area?`, area, {
      suffix: 'sq. m', latex: 'A = \\frac{(b_1 + b_2)h}{2}',
      hints: ['I-add ang dalawang base.', 'I-multiply sa height, tapos i-divide sa 2.'],
      solution: [`(${b1} + ${b2}) × ${h} = ${(b1 + b2) * h}`, `÷ 2 = ${area} sq. m`],
    })
  }
  const b = ri(3, 25), h = ri(2, 20)
  const area = kind === 'para' ? b * h : (b * h) / 2
  return input(kind === 'para' ? `Ano ang area ng parallelogram na may base na ${b} cm at height na ${h} cm?` : `Ano ang area ng triangle na may base na ${b} cm at height na ${h} cm?`, area, {
    suffix: 'sq. cm', latex: kind === 'para' ? 'A = bh' : 'A = \\frac{bh}{2}', visual: kind === 'tri' ? { type: 'polygon', sides: 3 } : undefined,
    hints: kind === 'para' ? ['Area = base × height.'] : ['Ang triangle ay kalahati ng parallelogram.', 'A = (base × height) ÷ 2.'],
    solution: kind === 'para' ? [`A = ${b} × ${h} = ${area} sq. cm`] : [`A = (${b} × ${h}) ÷ 2`, `A = ${area} sq. cm`],
  })
}

/** Theoretical probability with a die or a spinner */
export const diceProbability: Generator = () => {
  const events = [
    ['lumabas ang even number sa isang die (1–6)', 3, 6], ['lumabas ang numerong mas malaki sa 4 sa isang die', 2, 6],
    ['lumabas ang 6 sa isang die', 1, 6], ['lumabas ang prime number sa isang die', 3, 6],
    ['tumama sa pula ang spinner na may 8 pantay na bahagi, 3 dito ay pula', 3, 8], ['lumabas ang heads sa isang barya', 1, 2],
    ['mabunot ang patinig (vowel) sa mga letrang M-A-T-H-E-M-A-T-I-K-A', 5, 11],
  ] as const
  const [desc, f, t] = pick(events)
  return input(`Ano ang probability na ${desc}? (lowest terms)`, frac(f, t), {
    simplest: true, display: fracText(f, t),
    hints: ['P = (bilang ng gustong resulta) ÷ (lahat ng posibleng resulta)', 'I-simplify ang fraction.'],
    solution: [`Gusto: ${f}, lahat: ${t}`, `P = ${f}/${t}${fracText(f, t) !== `${f}/${t}` ? ` = ${fracText(f, t)}` : ''}`],
  })
}

const fmt12 = (h24: number, m: number) => `${h24 % 12 || 12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`
const fmt24 = (h24: number, m: number) => `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`

/** 12- and 24-hour time; world time zones (cities without daylight saving time) */
export const time24: Generator = () => {
  const h = ri(0, 23), m = pick([0, 5, 15, 20, 30, 45, 50])
  if (Math.random() < 0.6) {
    const to24 = Math.random() < 0.5
    const ans = to24 ? fmt24(h, m) : fmt12(h, m)
    const wrong = to24 ? [fmt24((h + 12) % 24, m), fmt24(h % 12, m), fmt24((h + 2) % 24, m)] : [fmt12((h + 12) % 24, m), fmt12((h + 1) % 24, m), fmt12((h + 11) % 24, m)]
    return choice(to24 ? `Isulat ang ${fmt12(h, m)} sa 24-hour time.` : `Isulat ang ${fmt24(h, m)} sa 12-hour time.`, ans, wrong, {
      hints: ['Sa 24-hour time, ang p.m. ay +12 (maliban sa 12 noon).', 'Ang 00:xx ay 12:xx a.m. (hatinggabi).'],
      solution: [`${to24 ? fmt12(h, m) : fmt24(h, m)} → ${ans}`],
    })
  }
  const cities = [['Tokyo', 1], ['Seoul', 1], ['Singapore', 0], ['Bangkok', -1], ['Jakarta', -1], ['Dubai', -4], ['Riyadh', -5]] as const
  const [city, off] = pick(cities)
  const ans = fmt12((h + off + 24) % 24, m)
  return choice(`Kapag ${fmt12(h, m)} sa Maynila, anong oras sa ${city}? (${off === 0 ? 'Parehong time zone' : `Ang ${city} ay ${off > 0 ? '+' : '−'}${Math.abs(off)} oras mula sa Maynila`})`, ans,
    [fmt12((h - off + 24) % 24, m), fmt12((h + off + 12 + 24) % 24, m), fmt12((h + 1 + 24) % 24, m), fmt12((h + 2) % 24, m)], {
      hints: [off >= 0 ? `Idagdag ang ${off} oras.` : `Ibawas ang ${-off} oras.`],
      solution: [`Maynila ${fmt12(h, m)} ${off >= 0 ? '+' : '−'} ${Math.abs(off)} oras = ${ans}`],
    })
}
