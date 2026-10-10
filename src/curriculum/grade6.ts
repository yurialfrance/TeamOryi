// Grade 6 (MATATAG Key Stage 2) — new stages alongside GCF/LCM, ratio, proportion and percent:
// fraction–decimal–percent conversion, pie graphs, exponents with GEMDAS, circles (circumference
// and area), and volume of cubes and rectangular prisms.
import type { Generator } from '../engine/types'
import { pick, ri } from '../engine/rand'
import { choice, fmt, input, round } from './kit'

const TRIPLES = [
  ['\\frac{1}{2}', '1/2', 0.5, 50], ['\\frac{1}{4}', '1/4', 0.25, 25], ['\\frac{3}{4}', '3/4', 0.75, 75], ['\\frac{1}{5}', '1/5', 0.2, 20],
  ['\\frac{2}{5}', '2/5', 0.4, 40], ['\\frac{3}{5}', '3/5', 0.6, 60], ['\\frac{1}{10}', '1/10', 0.1, 10], ['\\frac{7}{10}', '7/10', 0.7, 70],
  ['\\frac{1}{20}', '1/20', 0.05, 5], ['\\frac{3}{20}', '3/20', 0.15, 15], ['\\frac{1}{8}', '1/8', 0.125, 12.5], ['\\frac{9}{25}', '9/25', 0.36, 36],
] as const

/** Fraction ↔ decimal ↔ percent */
export const fdpConvert: Generator = () => {
  const [tex, text, dec, per] = pick(TRIPLES)
  const kind = pick(['f2p', 'p2d', 'd2p', 'p2f'] as const)
  if (kind === 'f2p') return input(`Isulat ang ${text} bilang percent.`, per, {
    latex: `${tex} = ?\\%`, suffix: '%', hints: ['I-divide ang numerator sa denominator.', 'I-multiply sa 100.'], solution: [`${text} = ${dec}`, `${dec} × 100 = ${per}%`],
  })
  if (kind === 'p2d') return input(`Isulat ang ${per}% bilang decimal.`, dec, {
    tolerance: 1e-9, hints: ['I-divide sa 100: ilipat ang decimal point nang 2 place pakaliwa.'], solution: [`${per} ÷ 100 = ${dec}`],
  })
  if (kind === 'd2p') return input(`Isulat ang ${dec} bilang percent.`, per, {
    suffix: '%', hints: ['I-multiply sa 100: ilipat ang decimal point nang 2 place pakanan.'], solution: [`${dec} × 100 = ${per}%`],
  })
  return input(`Isulat ang ${per}% bilang fraction sa lowest terms.`, tex, {
    simplest: true, display: text, hints: [`${per}% = ${per}/100.`, 'I-simplify.'], solution: [`${per}/100 = ${text}`],
  })
}

/** Pie graph: a sector's percent of a whole */
export const pieGraph: Generator = () => {
  const total = pick([40, 50, 60, 80, 120, 200, 400])
  const parts = [['Kanin', pick([25, 30, 40])], ['Gulay', pick([10, 15, 20])], ['Prutas', pick([10, 15])]] as const
  const used = parts.reduce((a, p) => a + p[1], 0)
  const rows = [['Paborito', 'Bahagi ng pie graph'], ...parts.map(([n, p]) => [n, `${p}%`]), ['Isda', `${100 - used}%`]]
  const [name, p] = pick([...parts, ['Isda', 100 - used] as const])
  const ans = (total * p) / 100
  if (!Number.isInteger(ans)) return pieGraph()
  return input(`Ipinapakita ng pie graph ang paboritong pagkain ng ${total} na estudyante. Ilang estudyante ang pumili ng ${name.toLowerCase()}?`, ans, {
    visual: { type: 'table', rows },
    hints: [`Hanapin ang percent ng ${name}.`, `${p}% ng ${total} = ${p / 100} × ${total}.`],
    solution: [`${name}: ${p}%`, `${p / 100} × ${total} = ${ans}`],
  })
}

/** Exponents: exponential form, evaluating powers, GEMDAS with exponents */
export const exponents: Generator = () => {
  const kind = pick(['eval', 'form', 'gemdas'] as const)
  if (kind === 'form') {
    const b = ri(2, 9), e = ri(2, 6)
    return choice(`Isulat sa exponential form: ${Array(e).fill(b).join(' × ')}`, `${b}^{${e}}`, [`${e}^{${b}}`, `${b} \\times ${e}`, `${b}^{${e + 1}}`], {
      tex: true, display: `${b}^${e}`,
      hints: ['Ang base ay ang inuulit na numero.', 'Ang exponent ay kung ilang beses ito inulit.'],
      solution: [`${b} ay inulit nang ${e} beses → ${b}^${e}`],
    })
  }
  if (kind === 'eval') {
    const b = ri(2, 10), e = b <= 3 ? ri(2, 5) : b <= 5 ? ri(2, 4) : 2 + (Math.random() < 0.3 ? 1 : 0)
    const v = b ** e
    return input('Ano ang value?', v, {
      latex: `${b}^{${e}}`,
      hints: [`I-multiply ang ${b} sa sarili nito nang ${e} beses.`, `Hindi ito ${b} × ${e}!`],
      solution: [`${Array(e).fill(b).join(' × ')} = ${fmt(v)}`],
    })
  }
  const a = ri(2, 6), b = ri(2, 4), c = ri(2, 9), d = ri(1, 5)
  const val = (a + d) ** 2 - b * c
  return input('Sundin ang GEMDAS. Ano ang sagot?', val, {
    latex: `(${a} + ${d})^{2} - ${b} \\times ${c}`,
    hints: ['G: grouping muna. E: exponent sunod.', 'Tapos M/D, saka A/S.'],
    solution: [`(${a} + ${d}) = ${a + d}`, `${a + d}² = ${(a + d) ** 2}`, `${b} × ${c} = ${b * c}`, `${(a + d) ** 2} − ${b * c} = ${val}`],
  })
}

/** Circle: radius/diameter, circumference and area (π ≈ 3.14) */
export const circles: Generator = () => {
  const kind = pick(['rd', 'circ', 'area'] as const)
  const r = ri(2, 15)
  const useD = Math.random() < 0.4
  const given = useD ? `diameter na ${2 * r} cm` : `radius na ${r} cm`
  if (kind === 'rd') {
    return input(useD ? `Ang diameter ng bilog ay ${2 * r} cm. Ano ang radius?` : `Ang radius ng bilog ay ${r} cm. Ano ang diameter?`, useD ? r : 2 * r, {
      suffix: 'cm', hints: ['Ang diameter ay dalawang beses ng radius.'], solution: [useD ? `r = ${2 * r} ÷ 2 = ${r} cm` : `d = 2 × ${r} = ${2 * r} cm`],
    })
  }
  if (kind === 'circ') {
    const c = round(2 * 3.14 * r, 2)
    return input(`Ano ang circumference ng bilog na may ${given}? (π = 3.14)`, c, {
      suffix: 'cm', tolerance: 0.011, latex: 'C = 2\\pi r = \\pi d',
      hints: [useD ? 'C = π × d' : 'C = 2 × π × r'],
      solution: [useD ? `C = 3.14 × ${2 * r}` : `C = 2 × 3.14 × ${r}`, `C = ${c} cm`],
    })
  }
  const a = round(3.14 * r * r, 2)
  return input(`Ano ang area ng bilog na may ${given}? (π = 3.14)`, a, {
    suffix: 'sq. cm', tolerance: 0.011, latex: 'A = \\pi r^2',
    hints: [useD ? `Kunin muna ang radius: ${2 * r} ÷ 2 = ${r}.` : 'A = π × r × r', 'Gamitin ang π = 3.14.'],
    solution: [`A = 3.14 × ${r} × ${r}`, `A = ${a} sq. cm`],
  })
}

/** Volume of cubes and rectangular prisms */
export const volumePrism: Generator = () => {
  const cube = Math.random() < 0.35
  const l = ri(2, 15), w = cube ? l : ri(2, 12), h = cube ? l : ri(2, 10)
  const v = l * w * h
  if (!cube && Math.random() < 0.3) {
    return input(`Ang kahon ay may volume na ${fmt(v)} cu. cm. Ang haba ay ${l} cm at ang lapad ay ${w} cm. Gaano kataas ito?`, h, {
      suffix: 'cm', hints: ['V = l × w × h', `I-divide ang volume sa ${l} × ${w} = ${l * w}.`], solution: [`h = ${fmt(v)} ÷ ${l * w} = ${h} cm`],
    })
  }
  return input(cube ? `Ano ang volume ng cube na ${l} cm bawat gilid?` : `Ano ang volume ng aquarium na ${l} dm ang haba, ${w} dm ang lapad at ${h} dm ang taas?`, v, {
    suffix: cube ? 'cu. cm' : 'cu. dm', latex: cube ? 'V = s^3' : 'V = l \\times w \\times h',
    hints: cube ? ['V = s × s × s'] : ['I-multiply ang haba, lapad at taas.'],
    solution: [cube ? `V = ${l} × ${l} × ${l} = ${fmt(v)} cu. cm` : `V = ${l} × ${w} × ${h} = ${fmt(v)} cu. dm${!cube ? ` (= ${fmt(v)} L)` : ''}`],
  })
}

