// Grade 3 (MATATAG Key Stage 1): numbers up to 10 000, 4-digit addition and subtraction (money up
// to ₱10 000), estimating products and quotients, division of 2- to 4-digit numbers, areas of
// squares and rectangles, lines, mass and capacity, and single bar graphs.
import type { Generator } from '../engine/types'
import { NAMES, pick, ri } from '../engine/rand'
import { choice, fmt, input, tnum } from './kit'

/** Rounding to the nearest 10, 100 or 1000 */
export const roundWhole: Generator = () => {
  const n = ri(1001, 9999)
  const to = pick([10, 100, 1000])
  const ans = Math.round(n / to) * to
  const name = to === 10 ? 'tens' : to === 100 ? 'hundreds' : 'thousands'
  return input(`I-round off ang ${fmt(n)} sa pinakamalapit na ${name} (${fmt(to)}).`, ans, {
    hints: [`Tingnan ang digit sa kanan ng ${name} place.`, '5 pataas: round up. 4 pababa: round down.'],
    solution: [`Kanang digit: ${Math.floor((n % to) / (to / 10))}`, `${fmt(n)} → ${fmt(ans)}`],
  })
}

/** 4-digit addition and subtraction, sometimes with money */
export const addSub4: Generator = () => {
  const add = Math.random() < 0.5
  const a = ri(1200, 6999), b = add ? ri(1005, 9999 - a) : ri(1005, a - 100)
  const ans = add ? a + b : a - b
  const money = Math.random() < 0.4
  const name = pick(NAMES)
  const prompt = money
    ? add ? `Nag-ipon si ${name} ng ₱${fmt(a)} noong Hunyo at ₱${fmt(b)} noong Hulyo. Magkano lahat?` : `May ₱${fmt(a)} si ${name}. Bumili siya ng cellphone load at gamit na ₱${fmt(b)}. Magkano ang natira?`
    : add ? 'I-add.' : 'I-subtract.'
  return input(prompt, ans, {
    latex: money ? undefined : `${tnum(a)} ${add ? '+' : '-'} ${tnum(b)} = ?`, prefix: money ? '₱' : undefined,
    topic: money ? 'money-word-problems' : add ? 'whole-numbers-addition' : 'whole-numbers-subtraction',
    hints: ['I-align ang ones, tens, hundreds at thousands.', add ? 'Mag-carry kapag 10 pataas.' : 'Humiram kapag mas maliit ang itaas.'],
    solution: [`${fmt(a)} ${add ? '+' : '−'} ${fmt(b)} = ${fmt(ans)}`, add ? `Check: ${fmt(ans)} − ${fmt(b)} = ${fmt(a)}` : `Check: ${fmt(ans)} + ${fmt(b)} = ${fmt(a)}`],
  })
}

/** Estimate a product or quotient by rounding to the nearest 10 first */
export const estimate: Generator = () => {
  if (Math.random() < 0.55) {
    let a = ri(12, 98)
    if (a % 10 === 5) a++
    const b = ri(3, 9)
    const ra = Math.round(a / 10) * 10
    const est = ra * b
    return choice(`Tantiyahin (estimate) ang ${a} × ${b} sa pamamagitan ng pag-round off muna sa pinakamalapit na 10.`, est, [a * b, (ra + 10) * b, (ra - 10) * b, ra * (b + 1)], {
      hints: [`I-round off ang ${a} sa pinakamalapit na 10.`, `Tapos i-multiply sa ${b}.`],
      solution: [`${a} → ${ra}`, `${ra} × ${b} = ${est}`, `(Eksaktong sagot: ${a * b} — malapit!)`],
    })
  }
  const d = ri(2, 9)
  const rd = d // single-digit divisor stays
  const q = ri(3, 9) * 10
  const n = q * rd + ri(-4, 4)
  const rn = Math.round(n / 10) * 10
  const est = Math.round(rn / rd)
  if (rn % rd !== 0) return estimate()
  return choice(`Tantiyahin ang ${n} ÷ ${d}. I-round off muna ang ${n} sa pinakamalapit na 10.`, est, [est + 10, est - 10, est * 2, Math.round(n / d) + 3], {
    hints: [`${n} → ${rn}`, `${rn} ÷ ${d} = ?`],
    solution: [`${n} → ${rn}`, `${rn} ÷ ${d} = ${est}`],
  })
}

/** Division of 2- to 4-digit numbers by a 1-digit number */
export const divide4: Generator = () => {
  const d = ri(2, 9)
  const exact = Math.random() < 0.65
  const q = ri(12, exact ? 999 : 99)
  if (exact) {
    const n = q * d
    if (n > 9999) return divide4()
    return input(Math.random() < 0.4 ? `Hinati nang pantay ang ${fmt(n)} na piso sa ${d} na magkakapatid. Magkano ang bawat isa?` : 'I-divide.', q, {
      latex: `${tnum(n)} \\div ${d} = ?`,
      hints: ['Long division: hatiin mula sa kaliwang digit.', `Check: sagot × ${d} = ${fmt(n)}.`],
      solution: [`${fmt(n)} ÷ ${d} = ${fmt(q)}`, `Check: ${fmt(q)} × ${d} = ${fmt(n)}`],
    })
  }
  const r = ri(1, d - 1)
  const n = q * d + r
  return choice(`Ano ang quotient at remainder ng ${n} ÷ ${d}?`, `${q} R ${r}`, [`${q + 1} R ${r}`, `${q} R ${(r + 1) % d || d - 1}`, `${q - 1} R ${r + d > 9 ? r : r + d}`], {
    latex: `${n} \\div ${d}`,
    hints: [`Ilang beses kasya ang ${d} sa ${n}?`, `Ang remainder ay laging mas maliit sa ${d}.`],
    solution: [`${d} × ${q} = ${q * d}`, `${n} − ${q * d} = ${r}`, `Sagot: ${q} R ${r}`],
  })
}

/** Area of squares and rectangles in square units */
export const areaRect: Generator = () => {
  const sq = Math.random() < 0.35
  const l = ri(2, 15), w = sq ? l : ri(2, 12)
  const unit = pick(['cm', 'm'])
  const area = l * w
  const name = pick(['sahig', 'banig', 'bintana', 'pisara', 'garden'])
  return input(sq ? `Ang ${name} ay hugis square na ${l} ${unit} bawat gilid. Ano ang area nito?` : `Ang ${name} ay rectangle na ${l} ${unit} ang haba at ${w} ${unit} ang lapad. Ano ang area?`, area, {
    suffix: `sq. ${unit}`,
    hints: ['Area = haba × lapad.', 'Ang sagot ay nasa square units.'],
    solution: [`A = ${l} × ${w}`, `A = ${area} sq. ${unit}`],
  })
}

/** Points, lines, rays and line pairs */
export const linesGen: Generator = () => {
  const items = [
    ['Dalawang linya na hindi kailanman nagtatagpo kahit pahabain.', 'Parallel lines'],
    ['Dalawang linya na nagtatagpo at bumubuo ng right angle (sulok ng papel).', 'Perpendicular lines'],
    ['Dalawang linya na nagtatagpo pero hindi right angle ang nabubuo.', 'Intersecting lines'],
    ['Bahagi ng linya na may simula at walang katapusan sa isang direksyon.', 'Ray'],
    ['Bahagi ng linya na may dalawang dulo (endpoints).', 'Line segment'],
    ['Tuwid na daan na walang simula at walang katapusan sa magkabilang direksyon.', 'Line'],
  ]
  const [desc, ans] = pick(items)
  return choice(`Ano ito? ${desc}`, ans, items.map((x) => x[1]), {
    hints: ['Parallel: parang riles ng tren. Perpendicular: parang letrang T o sulok ng papel.'],
    solution: [`${desc} → ${ans}`],
  })
}

/** Single bar graph: read a value or compare two bars */
export const barGraph: Generator = () => {
  const labels = ['Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes']
  const step = pick([1, 2, 5, 10])
  const values = labels.map(() => ri(1, 9) * step)
  const i = ri(0, 4)
  let j = ri(0, 4)
  while (j === i || values[j] === values[i]) { j = ri(0, 4); if (new Set(values).size === 1) values[j] += step }
  const compare = Math.random() < 0.5
  const v = { type: 'barGraph' as const, title: 'Bilang ng nabentang pandesal (dosena)', labels, values }
  if (compare) {
    const diff = Math.abs(values[i] - values[j])
    return input(`Ilan ang pagitan (difference) ng benta noong ${labels[i]} at ${labels[j]}?`, diff, {
      visual: v,
      hints: ['Basahin ang taas ng dalawang bar.', 'Ibawas ang mas maliit sa mas malaki.'],
      solution: [`${labels[i]}: ${values[i]}, ${labels[j]}: ${values[j]}`, `${Math.max(values[i], values[j])} − ${Math.min(values[i], values[j])} = ${diff}`],
    })
  }
  const most = Math.random() < 0.5
  const target = most ? Math.max(...values) : Math.min(...values)
  if (values.filter((x) => x === target).length > 1) {
    return input(`Ilan ang nabenta noong ${labels[i]}?`, values[i], {
      visual: v, hints: ['Sundan ang tuktok ng bar papunta sa numero sa gilid.'], solution: [`${labels[i]}: ${values[i]}`],
    })
  }
  const ans = labels[values.indexOf(target)]
  return choice(`Anong araw ang may ${most ? 'pinakamaraming' : 'pinakakaunting'} benta?`, ans, labels, {
    visual: v, hints: [most ? 'Hanapin ang pinakamataas na bar.' : 'Hanapin ang pinakamababang bar.'],
    solution: [`${labels.map((l, k) => `${l}: ${values[k]}`).join(', ')}`, `Sagot: ${ans}`],
  })
}

/** Mass (g, kg) and capacity (mL, L): compare and convert whole units */
export const massCapacity: Generator = () => {
  const mass = Math.random() < 0.5
  const [big, small, f] = mass ? ['kg', 'g', 1000] : ['L', 'mL', 1000]
  if (Math.random() < 0.5) {
    const n = ri(1, 9)
    return input(`Ilang ${small} ang ${n} ${big}?`, n * f, {
      suffix: small,
      hints: [`1 ${big} = 1,000 ${small}.`], solution: [`${n} × 1,000 = ${fmt(n * f)} ${small}`],
    })
  }
  const a = ri(1, 5), b = ri(500, 6000)
  if (a * f === b) return massCapacity()
  const ans = a * f > b ? `${a} ${big}` : `${fmt(b)} ${small}`
  return choice(`Alin ang mas ${mass ? 'mabigat' : 'marami'}?`, ans, [`${a} ${big}`, `${fmt(b)} ${small}`, 'Pareho lang'], {
    visual: { type: 'scene', icons: mass ? ['sack', 'scale'] : ['bottle', 'milk'] },
    hints: [`Gawing pareho ang unit: 1 ${big} = 1,000 ${small}.`],
    solution: [`${a} ${big} = ${fmt(a * f)} ${small}`, `${fmt(a * f)} vs ${fmt(b)} → ${ans}`],
  })
}

