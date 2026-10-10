// Grade 4 (MATATAG Key Stage 2): numbers up to 1 000 000, multi-digit multiplication, division by
// up to 2-digit numbers and the MDAS rules, factors and multiples, dissimilar fractions, decimals
// and their link to fractions, angles, unit conversion, and data in tables.
import type { Generator } from '../engine/types'
import { gcd, NAMES, pick, ri } from '../engine/rand'
import { choice, fmt, frac, input, near, tnum } from './kit'

const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands']

/** Place value and expanded form up to 1 000 000 */
export const bigNumbers: Generator = () => {
  const n = ri(100000, 999999)
  if (Math.random() < 0.5) {
    const p = ri(0, 5)
    const digit = Math.floor(n / 10 ** p) % 10
    return input(`Anong digit ang nasa ${PLACES[p]} place ng ${fmt(n)}?`, digit, {
      hints: ['Mula kanan: ones, tens, hundreds, thousands, ten thousands, hundred thousands.'],
      solution: [`${fmt(n)}: ang ${PLACES[p]} digit ay ${digit}`],
    })
  }
  const parts = String(n).split('').map((d, i, a) => Number(d) * 10 ** (a.length - 1 - i)).filter((x) => x > 0)
  return input('Isulat sa standard form.', n, {
    latex: parts.map(tnum).join(' + '),
    hints: ['Pagsamahin ang bawat place value.', 'Huwag kalimutan ang 0 sa bakanteng place.'],
    solution: [`${parts.map(fmt).join(' + ')} = ${fmt(n)}`],
  })
}

/** 3–4 digit × 1 digit, or 2-digit × 2-digit */
export const multiDigit: Generator = () => {
  const twoByTwo = Math.random() < 0.5
  const a = twoByTwo ? ri(12, 99) : ri(105, 4999), b = twoByTwo ? ri(11, 99) : ri(3, 9)
  const p = a * b
  const word = Math.random() < 0.35
  return input(word ? `May ${fmt(b)} na kahon ng mangga. Bawat kahon ay may ${fmt(a)} na piraso. Ilan lahat?` : 'I-multiply.', p, {
    latex: word ? undefined : `${tnum(a)} \\times ${b} = ?`,
    hints: twoByTwo ? [`I-multiply muna sa ones (${b % 10}), tapos sa tens (${Math.floor(b / 10)}0).`, 'I-add ang dalawang partial products.'] : ['I-multiply bawat digit mula sa ones.', 'Huwag kalimutan ang carry.'],
    solution: twoByTwo ? [`${a} × ${b % 10} = ${a * (b % 10)}`, `${a} × ${Math.floor(b / 10) * 10} = ${fmt(a * Math.floor(b / 10) * 10)}`, `${fmt(a * (b % 10))} + ${fmt(a * Math.floor(b / 10) * 10)} = ${fmt(p)}`] : [`${fmt(a)} × ${b} = ${fmt(p)}`],
  })
}

/** Division of up to 4-digit numbers by up to 2-digit numbers (exact) */
export const longDivision: Generator = () => {
  const d = Math.random() < 0.5 ? ri(3, 9) : ri(11, 35)
  const q = ri(12, Math.floor(9999 / d))
  const n = q * d
  return input(Math.random() < 0.35 ? `${fmt(n)} na upuan ang ilalagay nang pantay sa ${d} na hanay. Ilan bawat hanay?` : 'I-divide.', q, {
    latex: `${tnum(n)} \\div ${d} = ?`,
    hints: [`Ilang beses kasya ang ${d} sa unang mga digit?`, 'Divide, multiply, subtract, bring down — ulitin.'],
    solution: [`${fmt(n)} ÷ ${d} = ${fmt(q)}`, `Check: ${fmt(q)} × ${d} = ${fmt(n)}`],
  })
}

/** MDAS: multiplication/division first, then addition/subtraction, left to right */
export const mdas: Generator = () => {
  const a = ri(2, 20), b = ri(2, 9), c = ri(2, 9), dv = ri(2, 6), e = dv * ri(1, 6)
  const forms = [
    { tex: `${a} + ${b} \\times ${c}`, val: a + b * c, steps: [`${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`], trap: (a + b) * c },
    { tex: `${a + b * c} - ${b} \\times ${c} + ${e} \\div ${dv}`, val: a + e / dv, steps: [`${b} × ${c} = ${b * c}`, `${e} ÷ ${dv} = ${e / dv}`, `${a + b * c} − ${b * c} + ${e / dv} = ${a + e / dv}`], trap: ((a + b * c - b) * c + e) / dv },
    { tex: `${e} \\div ${dv} \\times ${b} + ${a}`, val: (e / dv) * b + a, steps: [`${e} ÷ ${dv} = ${e / dv}`, `${e / dv} × ${b} = ${(e / dv) * b}`, `+ ${a} = ${(e / dv) * b + a}`], trap: e / (dv * b) + a },
  ]
  const f = pick(forms)
  return input('Sundin ang MDAS. Ano ang sagot?', f.val, {
    latex: f.tex,
    hints: ['Multiplication at division muna (mula kaliwa pakanan).', 'Saka ang addition at subtraction.'],
    solution: f.steps,
  })
}

const factorsOf = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((k) => n % k === 0)

/** Factors and multiples of numbers up to 100 */
export const factorsMultiples: Generator = () => {
  const kind = pick(['factor', 'multiple', 'count'] as const)
  if (kind === 'count') {
    const n = pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 42, 48, 60, 64, 72])
    const fs = factorsOf(n)
    return input(`Ilan lahat ang factors ng ${n}?`, fs.length, {
      hints: ['Hanapin ang magkapares na numerong ang product ay ' + n + '.', `Halimbawa: 1 × ${n}.`],
      solution: [`Factors ng ${n}: ${fs.join(', ')}`, `Bilang: ${fs.length}`],
    })
  }
  if (kind === 'factor') {
    const n = pick([24, 30, 36, 42, 45, 48, 56, 60, 72, 84, 90, 96])
    const fs = factorsOf(n).filter((k) => k > 1 && k < n)
    const ans = pick(fs)
    const wrong = Array.from({ length: 30 }, () => ri(4, n - 1)).filter((k) => n % k !== 0)
    return choice(`Alin ang factor ng ${n}?`, ans, wrong, {
      hints: [`Ang factor ay naghahati sa ${n} nang walang remainder.`],
      solution: [`${n} ÷ ${ans} = ${n / ans} (walang remainder)`, `Factors ng ${n}: ${factorsOf(n).join(', ')}`],
    })
  }
  const k = ri(3, 12)
  const ans = k * ri(3, 9)
  const wrong = near(ans, 8, 6).filter((x) => x % k !== 0)
  return choice(`Alin ang multiple ng ${k}?`, ans, wrong, {
    hints: [`Ang multiples ng ${k} ay ${k}, ${2 * k}, ${3 * k}, …`],
    solution: [`${ans} = ${k} × ${ans / k}`],
  })
}

/** Add/subtract dissimilar fractions (denominators up to 10) and similar mixed numbers */
export const dissimilarFractions: Generator = () => {
  if (Math.random() < 0.3) {
    const d = pick([3, 4, 5, 6, 8])
    const w1 = ri(1, 5), w2 = ri(1, 4), n1 = ri(1, d - 1), n2 = ri(1, d - 1)
    const totalN = (w1 + w2) * d + n1 + n2
    const ansW = Math.floor(totalN / d), rem = totalN % d
    const g = gcd(rem, d)
    const ans = rem === 0 ? String(ansW) : `${ansW}\\frac{${rem / g}}{${d / g}}`
    return input('I-add ang mixed numbers. Isulat bilang mixed number sa lowest terms.', ans, {
      latex: `${w1}\\frac{${n1}}{${d}} + ${w2}\\frac{${n2}}{${d}}`,
      display: rem === 0 ? String(ansW) : `${ansW} ${rem / g}/${d / g}`,
      hints: ['I-add ang whole numbers, tapos ang fractions.', 'Kung lampas 1 ang fraction, gawing whole number ang sobra.'],
      solution: [`${w1} + ${w2} = ${w1 + w2}`, `${n1}/${d} + ${n2}/${d} = ${n1 + n2}/${d}`, `Sagot: ${rem === 0 ? ansW : `${ansW} ${rem / g}/${d / g}`}`],
    })
  }
  const d1 = pick([2, 3, 4, 5, 6, 8, 10]), d2 = pick([2, 3, 4, 5, 6, 8, 10].filter((x) => x !== d1))
  const n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1)
  const lcd = (d1 * d2) / gcd(d1, d2)
  const a = n1 * (lcd / d1), b = n2 * (lcd / d2)
  const add = Math.random() < 0.55 || a === b
  const [x, y, nx, ny, dx, dy] = add || a > b ? [a, b, n1, n2, d1, d2] : [b, a, n2, n1, d2, d1]
  const res = add ? x + y : x - y
  const ans = frac(res, lcd)
  return input('Sagutin. Isulat sa lowest terms.', ans, {
    latex: `\\frac{${nx}}{${dx}} ${add ? '+' : '-'} \\frac{${ny}}{${dy}} = ?`, simplest: true,
    display: ans.replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2'),
    hints: [`Magkaiba ang denominators. Hanapin ang LCD ng ${dx} at ${dy}.`, `LCD = ${lcd}. Gawing similar fractions muna.`],
    solution: [`${nx}/${dx} = ${x}/${lcd},  ${ny}/${dy} = ${y}/${lcd}`, `${x}/${lcd} ${add ? '+' : '−'} ${y}/${lcd} = ${res}/${lcd}`, `Lowest terms: ${ans.replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2')}`],
  })
}

/** Decimals (tenths, hundredths) and their link to fractions */
export const decimalsFractions: Generator = () => {
  const kind = pick(['toDec', 'toFrac', 'digit'] as const)
  if (kind === 'toDec') {
    const d = pick([10, 100])
    const n = d === 10 ? ri(1, 9) : ri(1, 99)
    const ans = n / d
    return input(`Isulat ang fraction bilang decimal.`, ans, {
      latex: `\\frac{${n}}{${d}} = ?`, tolerance: 1e-9,
      hints: [d === 10 ? 'Ang tenths ay isang digit pagkatapos ng decimal point.' : 'Ang hundredths ay dalawang digit pagkatapos ng decimal point.'],
      solution: [`${n}/${d} = ${ans}`],
    })
  }
  if (kind === 'toFrac') {
    const [dec, f] = pick([[0.5, '\\frac{1}{2}'], [0.25, '\\frac{1}{4}'], [0.75, '\\frac{3}{4}'], [0.2, '\\frac{1}{5}'], [0.4, '\\frac{2}{5}'], [0.6, '\\frac{3}{5}'], [0.8, '\\frac{4}{5}'], [0.1, '\\frac{1}{10}'], [0.3, '\\frac{3}{10}'], [0.05, '\\frac{1}{20}']] as const)
    return input(`Isulat ang ${dec} bilang fraction sa lowest terms.`, f, {
      simplest: true, display: f.replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2'),
      hints: [`${dec} = ${Math.round(dec * 100)}/100.`, 'I-simplify gamit ang GCF.'],
      solution: [`${dec} = ${Math.round(dec * 100)}/100`, `= ${f.replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2')}`],
    })
  }
  const n = ri(101, 999) / 100
  const which = pick(['tenths', 'hundredths', 'ones'] as const)
  const s = n.toFixed(2)
  const digit = which === 'ones' ? Number(s[0]) : which === 'tenths' ? Number(s[2]) : Number(s[3])
  return input(`Anong digit ang nasa ${which} place ng ${s}?`, digit, {
    topic: 'decimals-place-value',
    hints: ['Pagkatapos ng decimal point: tenths, tapos hundredths.'],
    solution: [`${s}: ones = ${s[0]}, tenths = ${s[2]}, hundredths = ${s[3]}`],
  })
}

/** Classify angles: acute, right, obtuse */
export const angleType: Generator = () => {
  const deg = pick([ri(10, 85), 90, ri(95, 175), 90])
  const ans = deg < 90 ? 'Acute' : deg === 90 ? 'Right' : 'Obtuse'
  return choice(`Anong uri ng angle ang may sukat na ${deg}°?`, ans, ['Acute', 'Right', 'Obtuse', 'Straight'], {
    hints: ['Acute: mas maliit sa 90°. Right: eksaktong 90°. Obtuse: lampas 90° pero kulang sa 180°.'],
    solution: [`${deg}° ${deg < 90 ? '< 90°' : deg === 90 ? '= 90°' : '> 90°'} → ${ans}`],
  })
}

/** Converting units of length, mass, capacity and time */
export const convertUnits: Generator = () => {
  const conv = pick([
    ['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['L', 'mL', 1000],
    ['oras', 'minuto', 60], ['minuto', 'segundo', 60], ['araw', 'oras', 24], ['linggo', 'araw', 7], ['taon', 'buwan', 12],
  ] as const)
  const [big, small, f] = conv
  const n = ri(2, 9)
  if (Math.random() < 0.5) {
    return input(`Ilang ${small} ang ${n} ${big}?`, n * f, {
      suffix: small, hints: [`1 ${big} = ${f} ${small}.`, `I-multiply sa ${f}.`], solution: [`${n} × ${f} = ${fmt(n * f)} ${small}`],
    })
  }
  return input(`Ilang ${big} ang ${fmt(n * f)} ${small}?`, n, {
    suffix: big, hints: [`1 ${big} = ${f} ${small}.`, `I-divide sa ${f}.`], solution: [`${fmt(n * f)} ÷ ${f} = ${n} ${big}`],
  })
}

/** Reading data from a table */
export const tableRead: Generator = () => {
  const names = [...NAMES].sort(() => Math.random() - 0.5).slice(0, 4)
  const vals = names.map(() => ri(15, 95))
  const kind = pick(['total', 'diff'] as const)
  const rows = [['Pangalan', 'Naipong bote'], ...names.map((n, i) => [n, String(vals[i])])]
  if (kind === 'total') {
    const t = vals.reduce((a, b) => a + b, 0)
    return input('Ilan lahat ang naipong bote ng apat na bata?', t, {
      visual: { type: 'table', rows },
      hints: ['I-add ang lahat ng numero sa ikalawang column.'], solution: [`${vals.join(' + ')} = ${t}`],
    })
  }
  const hi = Math.max(...vals), lo = Math.min(...vals)
  return input('Ilan ang lamang ng pinakamarami sa pinakakaunti?', hi - lo, {
    visual: { type: 'table', rows },
    hints: ['Hanapin ang pinakamalaki at pinakamaliit na numero.', 'Ibawas.'], solution: [`${hi} − ${lo} = ${hi - lo}`],
  })
}
