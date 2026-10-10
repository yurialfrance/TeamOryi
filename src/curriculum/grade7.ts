// Grade 7 (MATATAG Key Stage 3) — new stages alongside expressions and one-step equations:
// sets and Venn diagrams, integers and absolute value, square and cube roots, scientific notation,
// polygons and their angles, rates, rearranging formulas, and volume of pyramids and cylinders.
import type { Generator } from '../engine/types'
import { pick, ri, shuffle } from '../engine/rand'
import { choice, fmt, input, par, round } from './kit'

/** Sets: union, intersection, Venn-diagram counts */
export const setsVenn: Generator = () => {
  if (Math.random() < 0.5) {
    const pool = shuffle(Array.from({ length: 12 }, (_, i) => i + 1))
    const A = pool.slice(0, 5).sort((a, b) => a - b), B = [...pool.slice(3, 7)].sort((a, b) => a - b)
    const union = Math.random() < 0.5
    const res = union ? [...new Set([...A, ...B])].sort((a, b) => a - b) : A.filter((x) => B.includes(x))
    return input(`Kung A = {${A.join(', ')}} at B = {${B.join(', ')}}, ilan ang elements ng A ${union ? '∪' : '∩'} B?`, res.length, {
      hints: [union ? 'Union (∪): lahat ng elements ng A o B, walang ulit.' : 'Intersection (∩): ang mga elements na nasa A AT nasa B.'],
      solution: [`A ${union ? '∪' : '∩'} B = {${res.join(', ')}}`, `Bilang ng elements: ${res.length}`],
    })
  }
  const both = ri(3, 12), onlyA = ri(4, 20), onlyB = ri(4, 20), none = ri(0, 8)
  const a = onlyA + both, b = onlyB + both, total = onlyA + onlyB + both + none
  const ask = pick(['onlyA', 'either', 'none'] as const)
  const ans = ask === 'onlyA' ? onlyA : ask === 'either' ? onlyA + onlyB + both : none
  return input(`Sa ${total} na estudyante, ${a} ang mahilig sa basketball, ${b} ang mahilig sa volleyball, at ${both} ang mahilig sa pareho. Ilan ang ${ask === 'onlyA' ? 'basketball LANG ang gusto' : ask === 'either' ? 'mahilig sa kahit isa sa dalawa' : 'walang gusto sa dalawa'}?`, ans, {
    hints: ['Gumuhit ng Venn diagram. Ilagay muna ang "pareho" sa gitna.', `Basketball lang = ${a} − ${both}.`],
    solution: [`Basketball lang: ${a} − ${both} = ${onlyA}`, `Volleyball lang: ${b} − ${both} = ${onlyB}`, ask === 'onlyA' ? `Sagot: ${onlyA}` : ask === 'either' ? `${onlyA} + ${onlyB} + ${both} = ${ans}` : `${total} − (${onlyA} + ${onlyB} + ${both}) = ${none}`],
  })
}

/** Integers: four operations, comparing, absolute value */
export const integers: Generator = () => {
  const kind = pick(['add', 'sub', 'mul', 'div', 'abs', 'expr'] as const)
  const a = ri(-20, 20) || 7, b = ri(-12, 12) || -5
  if (kind === 'abs') {
    const x = ri(-30, -1), y = ri(-15, 15)
    const v = Math.abs(x) - Math.abs(y)
    return input('Ano ang value?', v, {
      latex: `|${x}| - |${y}|`,
      hints: ['Ang absolute value ay ang layo mula sa 0 — laging positive (o 0).'],
      solution: [`|${x}| = ${-x}, |${y}| = ${Math.abs(y)}`, `${-x} − ${Math.abs(y)} = ${v}`],
    })
  }
  if (kind === 'expr') {
    const c = ri(-6, 6) || 2
    const v = a - b * c
    return input('Sundin ang GEMDAS at ang rules ng signs.', v, {
      latex: `${a} - ${par(b)} \\times ${par(c)}`,
      hints: ['Multiplication muna.', 'Ang pagbawas ng negative ay katumbas ng pagdagdag.'],
      solution: [`${par(b)} × ${par(c)} = ${b * c}`, `${a} − ${par(b * c)} = ${v}`],
    })
  }
  if (kind === 'div') {
    const q = ri(-12, 12) || 3, d = ri(-9, 9) || -4
    return input('I-divide.', q, {
      latex: `${q * d} \\div ${par(d)}`,
      hints: ['Magkaparehong sign → positive. Magkaibang sign → negative.'],
      solution: [`${Math.abs(q * d)} ÷ ${Math.abs(d)} = ${Math.abs(q)}`, `Sign: ${(q * d < 0) !== (d < 0) ? 'magkaiba → −' : 'pareho → +'}`, `Sagot: ${q}`],
    })
  }
  const op = { add: '+', sub: '-', mul: '\\times' }[kind]
  const v = kind === 'add' ? a + b : kind === 'sub' ? a - b : a * b
  return input('Sagutin.', v, {
    latex: `${a} ${op} ${par(b)}`,
    hints: kind === 'add' ? ['Magkaparehong sign: i-add at panatilihin ang sign.', 'Magkaibang sign: ibawas, at kunin ang sign ng mas malaki ang absolute value.'] : kind === 'sub' ? ['Gawing addition: idagdag ang kabaligtaran.', `${a} − ${par(b)} = ${a} + ${par(-b)}`] : ['Magkaparehong sign → positive. Magkaibang sign → negative.'],
    solution: kind === 'sub' ? [`${a} + ${par(-b)} = ${v}`] : [`${a} ${kind === 'add' ? '+' : '×'} ${par(b)} = ${v}`],
  })
}

/** Square roots of perfect squares, cube roots of perfect cubes, estimating irrational roots */
export const roots: Generator = () => {
  const kind = pick(['sq', 'cube', 'between', 'irr'] as const)
  if (kind === 'sq') {
    const r = ri(2, 25)
    return input('Ano ang value?', r, { latex: `\\sqrt{${r * r}}`, hints: [`Anong numero ang × sa sarili = ${r * r}?`], solution: [`${r} × ${r} = ${r * r}`, `√${r * r} = ${r}`] })
  }
  if (kind === 'cube') {
    const r = ri(-6, 10) || 4
    return input('Ano ang value?', r, { latex: `\\sqrt[3]{${r ** 3}}`, hints: [`Anong numero ang × sa sarili nang 3 beses = ${r ** 3}?`], solution: [`${par(r)} × ${par(r)} × ${par(r)} = ${r ** 3}`, `∛${r ** 3} = ${r}`] })
  }
  if (kind === 'between') {
    const lo = ri(2, 14)
    let n = ri(lo * lo + 1, (lo + 1) ** 2 - 1)
    if (n === lo * lo) n++
    return choice(`Ang √${n} ay nasa pagitan ng aling dalawang magkasunod na whole numbers?`, `${lo} at ${lo + 1}`, [`${lo - 1} at ${lo}`, `${lo + 1} at ${lo + 2}`, `${Math.floor(n / 2)} at ${Math.floor(n / 2) + 1}`], {
      hints: ['Hanapin ang perfect squares sa paligid ng numero.'],
      solution: [`${lo}² = ${lo * lo} < ${n} < ${(lo + 1) ** 2} = ${(lo + 1)}²`, `Kaya ${lo} < √${n} < ${lo + 1}`],
    })
  }
  const opts = shuffle([['\\sqrt{2}', true], ['\\sqrt{49}', false], ['\\frac{3}{4}', false], ['\\pi', true], ['0.25', false], ['\\sqrt{10}', true], ['\\sqrt{16}', false], ['-5', false]] as const)
  const irr = opts.find((o) => o[1])!
  return choice('Alin ang irrational number?', irr[0], opts.filter((o) => !o[1]).map((o) => o[0]), {
    tex: true, display: irr[0],
    hints: ['Ang irrational ay hindi maisusulat bilang fraction ng dalawang integers.', 'Ang √ ng hindi perfect square ay irrational.'],
    solution: [`${irr[0]} ay hindi natatapos at hindi umuulit ang decimal → irrational.`],
  })
}

/** Scientific notation: write, read, multiply */
export const sciNotation: Generator = () => {
  const kind = pick(['toSci', 'fromSci', 'small'] as const)
  const m = round(ri(11, 99) / 10, 1), e = ri(3, 7)
  if (kind === 'small') {
    const ee = ri(2, 6)
    const n = round(m * 10 ** -ee, 10)
    return choice(`Isulat sa scientific notation: ${n.toFixed(ee + 1)}`, `${m} \\times 10^{-${ee}}`, [`${m} \\times 10^{${ee}}`, `${m} \\times 10^{-${ee + 1}}`, `${round(m * 10, 1)} \\times 10^{-${ee + 1}}`], {
      tex: true, display: `${m} × 10^-${ee}`,
      hints: ['Ilipat ang decimal point pakanan hanggang may 1 digit (1–9) sa kaliwa nito.', 'Bawat lipat pakanan = −1 sa exponent.'],
      solution: [`${n.toFixed(ee + 1)} → ${m} (inilipat nang ${ee} place pakanan)`, `= ${m} × 10^-${ee}`],
    })
  }
  const n = round(m * 10 ** e, 0)
  if (kind === 'fromSci') return input('Isulat sa standard form.', n, {
    latex: `${m} \\times 10^{${e}}`,
    hints: [`Ilipat ang decimal point nang ${e} place pakanan.`], solution: [`${m} × 10^${e} = ${fmt(n)}`],
  })
  return choice(`Isulat sa scientific notation: ${fmt(n)}`, `${m} \\times 10^{${e}}`, [`${m} \\times 10^{${e - 1}}`, `${round(m * 10, 1)} \\times 10^{${e - 1}}`, `${m} \\times 10^{${e + 1}}`], {
    tex: true, display: `${m} × 10^${e}`,
    hints: ['Ang unang bahagi ay dapat 1 hanggang wala pang 10.', 'Bilangin kung ilang place inilipat ang decimal point.'],
    solution: [`${fmt(n)} = ${m} × 10^${e}`],
  })
}

const POLY: Record<number, string> = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' }

/** Polygons: interior angle sum, each angle of a regular polygon, number of sides */
export const polygonAngles: Generator = () => {
  const n = pick([3, 4, 5, 6, 8, 9, 10, 12])
  const sum = (n - 2) * 180
  const kind = pick(['sum', 'each', 'sides', 'name'] as const)
  if (kind === 'name') return choice(`Ano ang tawag sa polygon na may ${n} sides?`, POLY[n], Object.values(POLY), {
    visual: { type: 'polygon', sides: n },
    hints: ['penta = 5, hexa = 6, octa = 8, deca = 10'], solution: [`${n} sides → ${POLY[n]}`],
  })
  if (kind === 'sides') return input(`Ang sum ng interior angles ng isang polygon ay ${fmt(sum)}°. Ilan ang sides nito?`, n, {
    latex: 'S = (n - 2) \\times 180^\\circ',
    hints: ['I-divide ang sum sa 180, tapos dagdagan ng 2.'], solution: [`${fmt(sum)} ÷ 180 = ${n - 2}`, `n = ${n - 2} + 2 = ${n}`],
  })
  if (kind === 'each') return input(`Ilang degrees ang bawat interior angle ng regular ${POLY[n]}?`, sum / n, {
    suffix: '°', visual: { type: 'polygon', sides: n },
    hints: ['Kunin muna ang sum: (n − 2) × 180.', `I-divide sa ${n} dahil pantay-pantay ang angles.`],
    solution: [`(${n} − 2) × 180 = ${fmt(sum)}°`, `${fmt(sum)} ÷ ${n} = ${round(sum / n, 2)}°`],
  })
  return input(`Ano ang sum ng interior angles ng ${POLY[n]} (${n} sides)?`, sum, {
    suffix: '°', latex: 'S = (n - 2) \\times 180^\\circ', visual: { type: 'polygon', sides: n },
    hints: ['Ang polygon ay mahahati sa (n − 2) na triangles.', 'Bawat triangle = 180°.'], solution: [`(${n} − 2) × 180 = ${fmt(sum)}°`],
  })
}

/** Rates, rearranging formulas, volume of cylinders and pyramids */
export const ratesFormulas: Generator = () => {
  const kind = pick(['rate', 'formula', 'cyl', 'pyr'] as const)
  if (kind === 'rate') {
    const speed = pick([40, 45, 50, 60, 80]), t = pick([2, 3, 4, 1.5, 2.5])
    const d = speed * t
    return input(`Ang bus ay naglakbay ng ${d} km sa loob ng ${t} oras. Ano ang average speed nito (km bawat oras)?`, speed, {
      suffix: 'km/h', topic: 'ratio-proportion', hints: ['Rate = distance ÷ time.'], solution: [`${d} ÷ ${t} = ${speed} km/h`],
    })
  }
  if (kind === 'formula') {
    const f = pick([
      ['P = 2l + 2w', 'l', 'l = \\frac{P - 2w}{2}', ['l = P - 2w', 'l = \\frac{P}{2} - 2w', 'l = 2P - w']],
      ['A = \\frac{1}{2}bh', 'h', 'h = \\frac{2A}{b}', ['h = \\frac{A}{2b}', 'h = 2Ab', 'h = \\frac{b}{2A}']],
      ['d = rt', 't', 't = \\frac{d}{r}', ['t = dr', 't = \\frac{r}{d}', 't = d - r']],
      ['I = Prt', 'r', 'r = \\frac{I}{Pt}', ['r = IPt', 'r = \\frac{Pt}{I}', 'r = I - Pt']],
    ] as const)
    return choice(`Gawing subject ang ${f[1]} sa formula.`, f[2], [...f[3]], {
      latex: f[0], tex: true, display: f[2], topic: 'algebraic-expressions',
      hints: [`Ihiwalay ang ${f[1]}: gawin ang kabaligtarang operasyon sa magkabilang side.`],
      solution: [`${f[0]}`, `→ ${f[2]}`],
    })
  }
  const r = ri(2, 10), h = ri(3, 15)
  if (kind === 'cyl') {
    const v = round(3.14 * r * r * h, 2)
    return input(`Ano ang volume ng cylinder na may radius na ${r} cm at taas na ${h} cm? (π = 3.14)`, v, {
      suffix: 'cu. cm', tolerance: 0.011, latex: 'V = \\pi r^2 h', topic: 'measurement-volume',
      hints: ['Area ng base (π r²) × taas.'], solution: [`V = 3.14 × ${r}² × ${h}`, `V = ${v} cu. cm`],
    })
  }
  const s = ri(2, 12) * 1, hh = ri(1, 6) * 3
  const v = (s * s * hh) / 3
  return input(`Ano ang volume ng square pyramid na may base edge na ${s} m at taas na ${hh} m?`, v, {
    suffix: 'cu. m', latex: 'V = \\frac{1}{3}s^2 h', topic: 'measurement-volume',
    hints: ['Ang pyramid ay ⅓ ng prism na may parehong base at taas.'], solution: [`V = ⅓ × ${s}² × ${hh}`, `V = ${fmt(v)} cu. m`],
  })
}

