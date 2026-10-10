// Tagisan ng Talino question bank: generators per grade band (DepEd strands), each taking a
// difficulty level 1–3, every question tagged with a topic for the assessment reports.
// createDuelPicker() runs a match: no repeated question, topics rotate, difficulty adapts.
import type { GradeBand, TopicId } from '../engine/topics'
import { gcd, pick, ri, shuffle } from '../engine/rand'

export type Level = 1 | 2 | 3
export interface DuelQ { id: string; prompt: string; tex?: string; choices: string[]; correct: number; topic: TopicId; key: string }
type Gen = (lvl: Level) => DuelQ

let qid = 0
/** Build a question from a correct answer + 3 distinct wrong ones (strings) */
function q(topic: TopicId, prompt: string, answer: string, wrong: string[], tex?: string): DuelQ {
  const uniq = [...new Set(wrong.filter((w) => w !== answer))]
  // top up with nearby values (never negative for a non-negative answer)
  const n = Number(answer)
  for (let pad = 1; uniq.length < 3 && pad < 50; pad++) {
    const cand = Number.isFinite(n) ? String(n + (pad % 2 ? Math.ceil(pad / 2) : -Math.ceil(pad / 2))) : `${answer} (${pad})`
    if (cand !== answer && !uniq.includes(cand) && !(Number(cand) < 0 && n >= 0)) uniq.push(cand)
  }
  const choices = shuffle([answer, ...uniq.slice(0, 3)])
  return { id: `d${qid++}`, prompt, tex, choices, correct: choices.indexOf(answer), topic, key: `${prompt}|${tex ?? ''}` }
}
/** Numeric answer with nearby distractors (never negative unless the answer is) */
function num(topic: TopicId, prompt: string, answer: number, spread: number, tex?: string, fmt: (n: number) => string = String): DuelQ {
  const wrong = new Set<string>()
  let guard = 0
  while (wrong.size < 3 && guard++ < 100) {
    const d = answer + (ri(1, spread) * (Math.random() < 0.5 ? -1 : 1))
    if (d !== answer && (d >= 0 || answer < 0)) wrong.add(fmt(d))
  }
  return q(topic, prompt, fmt(answer), [...wrong], tex)
}
const dec = (n: number) => String(Math.round(n * 100) / 100)
const frac = (n: number, d: number) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}` }
const by = <T,>(lvl: Level, a: T, b: T, c: T) => (lvl === 1 ? a : lvl === 2 ? b : c)

// ---------------------------------------------------------------- Grade 1–3
const G13: Gen[] = [
  (l) => { const [a, b] = by(l, [ri(1, 9), ri(1, 9)], [ri(10, 49), ri(10, 40)], [ri(100, 499), ri(100, 399)]); return num('whole-numbers-addition', `${a} + ${b} = ?`, a + b, by(l, 3, 10, 30)) },
  (l) => { const a = by(l, ri(6, 18), ri(30, 99), ri(300, 900)), b = by(l, ri(1, 5), ri(11, 29), ri(101, 299)); return num('whole-numbers-subtraction', `${a} − ${b} = ?`, a - b, by(l, 3, 10, 30)) },
  (l) => { const a = by(l, pick([2, 5, 10]), ri(2, 5), ri(6, 10)), b = ri(2, 10); return num('whole-numbers-multiplication', `${a} × ${b} = ?`, a * b, by(l, 4, 6, 10)) },
  (l) => { const d = by(l, pick([2, 5]), ri(2, 6), ri(6, 9)), qq = ri(2, 10); return num('whole-numbers-division', `${d * qq} ÷ ${d} = ?`, qq, 3) },
  (l) => { const n = by(l, ri(11, 99), ri(100, 999), ri(1000, 9999)); const places = by(l, ['tens', 'ones'], ['hundreds', 'tens', 'ones'], ['thousands', 'hundreds', 'tens']); const p = pick(places); const div = { ones: 1, tens: 10, hundreds: 100, thousands: 1000 }[p]!; return q('whole-numbers-place-value', `Anong digit ang nasa ${p} place ng ${n}?`, String(Math.floor(n / div) % 10), String(n).split('').filter((x) => x !== String(Math.floor(n / div) % 10))) },
  (l) => { const base = by(l, ri(10, 50), ri(100, 500), ri(1000, 5000)); const ns = shuffle([...new Set([base, base + ri(1, 9), base + by(l, 10, 100, 1000), base - ri(1, 9)])]); return q('whole-numbers-comparing', 'Alin ang pinakamalaki?', String(Math.max(...ns)), ns.filter((x) => x !== Math.max(...ns)).map(String)) },
  (l) => { const d = by(l, 2, pick([2, 4]), pick([3, 4, 5])), whole = d * ri(2, by(l, 5, 6, 8)); return num('fractions-of-a-number', `Ano ang 1/${d} ng ${whole}?`, whole / d, 3) },
  (l) => { const d = by(l, pick([2, 4]), pick([3, 4, 6]), pick([5, 8, 10])); return num('fractions-concept', `Ilang 1/${d} ang bumubuo sa isang buo?`, d, 2) },
  (l) => { const coins = by(l, [[5, ri(1, 3)], [1, ri(1, 4)]], [[10, ri(1, 4)], [5, ri(1, 3)], [1, ri(1, 4)]], [[20, ri(1, 3)], [10, ri(1, 4)], [5, ri(1, 3)]]); const total = coins.reduce((s, [v, c]) => s + v * c, 0); return num('money-counting', `Magkano lahat: ${coins.map(([v, c]) => `${c} na ₱${v}`).join(', ')}?`, total, 5, undefined, (n) => `₱${n}`) },
  (l) => { const h = by(l, ri(1, 3), ri(2, 5), ri(3, 8)); return l === 3 ? num('measurement-time', `Ilang minuto ang ${h} oras at 15 minuto?`, h * 60 + 15, 15) : num('measurement-time', `Ilang minuto sa ${h} oras?`, h * 60, 10) },
  (l) => { const m = by(l, ri(1, 5), ri(2, 9), ri(10, 25)); return num('measurement-length', `Ilang sentimetro (cm) sa ${m} metro?`, m * 100, by(l, 2, 3, 5) * 10) },
  () => { const s = pick([['tatsulok (triangle)', 3], ['parisukat (square)', 4], ['pentagon', 5], ['hexagon', 6]] as [string, number][]); return num('geometry-shapes', `Ilang gilid (sides) mayroon ang ${s[0]}?`, s[1], 2) },
  (l) => { const step = by(l, pick([2, 5, 10]), ri(3, 9), ri(11, 25)), start = ri(1, 20); const seq = [0, 1, 2, 3].map((i) => start + i * step); return num('number-patterns', `${seq.join(', ')}, ?`, start + 4 * step, 3) },
]

// ---------------------------------------------------------------- Grade 4–6
const G46: Gen[] = [
  (l) => { const a = by(l, ri(12, 49), ri(23, 99), ri(101, 499)), b = by(l, ri(2, 9), ri(11, 29), ri(12, 49)); return num('whole-numbers-multiplication', `${a} × ${b} = ?`, a * b, by(l, 20, 50, 100)) },
  (l) => { const d = by(l, ri(2, 9), ri(11, 19), ri(12, 25)), qq = by(l, ri(12, 99), ri(10, 50), ri(21, 99)); return num('whole-numbers-division', `${d * qq} ÷ ${d} = ?`, qq, by(l, 4, 5, 8)) },
  (l) => { const g = by(l, ri(2, 6), ri(3, 9), ri(6, 15)); let a = ri(2, 6), b = ri(2, 7); while (gcd(a, b) !== 1 || a === b) { a = ri(2, 6); b = ri(2, 7) } return num('factors-multiples', `GCF(${g * a}, ${g * b}) = ?`, g, 3) },
  (l) => { let a = by(l, ri(2, 6), ri(3, 9), ri(4, 12)), b = by(l, ri(2, 6), ri(4, 10), ri(6, 15)); if (a === b) b++; return num('factors-multiples', `LCM(${a}, ${b}) = ?`, (a * b) / gcd(a, b), by(l, 4, 8, 12)) },
  (l) => {
    const d1 = by(l, 8, ri(2, 6), ri(3, 8)), d2 = by(l, 8, ri(2, 6), ri(4, 9))
    const n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1)
    const D = (d1 * d2) / gcd(d1, d2), N = n1 * (D / d1) + n2 * (D / d2)
    return q('fractions-addition-subtraction', 'Ano ang sum?', frac(N, D), [frac(n1 + n2, d1 + d2), frac(N + 1, D), frac(n1 + n2, D)], `\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`)
  },
  (l) => { const d = by(l, pick([2, 4, 5]), pick([3, 4, 8]), pick([6, 7, 9])), n = ri(1, d - 1), whole = d * ri(2, by(l, 6, 9, 12)); return num('fractions-of-a-number', `Ano ang ${n}/${d} ng ${whole}?`, (n * whole) / d, 4) },
  (l) => { const a = by(l, ri(10, 99) / 10, ri(100, 999) / 100, ri(1000, 9999) / 100), b = by(l, ri(10, 99) / 10, ri(10, 99) / 100, ri(100, 999) / 100); const add = Math.random() < 0.5; const [x, y] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)]; return q('decimals-addition-subtraction', `${x} ${add ? '+' : '−'} ${y} = ?`, dec(add ? x + y : x - y), [dec((add ? x + y : x - y) + 0.1), dec((add ? x + y : x - y) - 0.1), dec((add ? x + y : x - y) + 1)]) },
  (l) => { const a = by(l, ri(11, 99) / 10, ri(101, 999) / 100, ri(11, 99) / 10), m = by(l, pick([10, 100]), pick([10, 100, 1000]), ri(2, 9)); const ans = a * m; return q('decimals-multiplication-division', `${a} × ${m} = ?`, dec(ans), [dec(ans / 10), dec(ans * 10), dec(ans + m)]) },
  (l) => { const p = by(l, pick([10, 50]), pick([20, 25, 75]), pick([15, 35, 12])), base = by(l, ri(2, 20) * 10, ri(2, 20) * 20, ri(2, 10) * 100); return num('percent-of-a-number', `${p}% ng ${base} = ?`, (p * base) / 100, Math.max(5, (p * base) / 400 | 0)) },
  (l) => { const k = ri(2, by(l, 5, 9, 12)); let a = ri(1, 9), b = ri(1, 9); while (gcd(a, b) !== 1 || a === b) { a = ri(1, 9); b = ri(2, 9) } return q('ratio-proportion', `Isulat sa simplest form ang ratio ${a * k} : ${b * k}`, `${a} : ${b}`, [`${b} : ${a}`, `${a * k} : ${b}`, `${a + 1} : ${b}`]) },
  (l) => { const a = ri(2, 6), b = ri(2, 9), k = ri(2, by(l, 4, 6, 9)); return num('ratio-proportion', 'Hanapin ang n', b * k, by(l, 3, 5, 7), `${a} : ${b} = ${a * k} : n`) },
  (l) => { const w = by(l, ri(2, 9), ri(5, 15), ri(10, 30)), h = by(l, ri(2, 9), ri(3, 12), ri(8, 25)); return Math.random() < 0.5 ? num('measurement-perimeter-area', `Perimeter ng rectangle na ${w} cm × ${h} cm?`, 2 * (w + h), 6, undefined, (n) => `${n} cm`) : num('measurement-perimeter-area', `Area ng rectangle na ${w} cm × ${h} cm?`, w * h, 8, undefined, (n) => `${n} cm²`) },
  (l) => { const c = pick([['m', 'cm', 100], ['kg', 'g', 1000], ['L', 'mL', 1000], ['km', 'm', 1000]] as [string, string, number][]); const v = by(l, ri(2, 9), ri(11, 50) / 10, ri(101, 999) / 100); return q('measurement-conversion', `${v} ${c[0]} = ? ${c[1]}`, dec(v * c[2]), [dec(v * c[2] * 10), dec(v * c[2] / 10), dec(v * c[2] + c[2])]) },
  (l) => { const a = by(l, ri(40, 80), ri(25, 90), ri(15, 110)), b = ri(20, 180 - a - 10); return num('geometry-triangles-polygons', `Ang dalawang angle ng triangle ay ${a}° at ${b}°. Ano ang ikatlo?`, 180 - a - b, 10, undefined, (n) => `${n}°`) },
  (l) => { const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9), d = ri(1, 9); const [expr, ans] = by(l, [`${a} + ${b} × ${c}`, a + b * c], [`${a * c} ÷ ${c} + ${b} × ${d}`, a + b * d], [`(${a} + ${b}) × ${c} − ${d}`, (a + b) * c - d]); return q('order-of-operations', `${expr} = ?`, String(ans), by(l, [String((a + b) * c), String(ans + 1), String(ans - 2)], [String((a * c) / c + b), String(ans + d), String(ans - 1)], [String(a + b * c - d), String(ans + c), String(ans - 3)])) },
  (l) => { const n = by(l, 3, 4, 5); const m = ri(5, 30); const xs = Array.from({ length: n }, () => m + ri(-5, 5)); const s = xs.reduce((a, b) => a + b, 0); xs[n - 1] += (n - (s % n)) % n; return num('statistics-mean-median-mode', `Mean ng ${xs.join(', ')}?`, xs.reduce((a, b) => a + b, 0) / n, 3) },
]

// ---------------------------------------------------------------- Grade 7–8
const G78: Gen[] = [
  (l) => { const a = ri(-20, 20) || 3, b = ri(-15, 15) || -4; const op = by(l, pick(['+', '−']), pick(['+', '−', '×']), pick(['×', '÷'])); const ans = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a; const paren = (v: number) => (v < 0 ? `(${v})` : String(v))
    const shown = op === '÷' ? `${a * b} ÷ ${paren(b)}` : `${a} ${op} ${paren(b)}`; return num('integers-operations', `${shown} = ?`, ans, by(l, 6, 10, 8)) },
  (l) => { const b = ri(2, by(l, 3, 5, 10)), e = by(l, ri(2, 3), ri(2, 4), ri(0, 3)); return num('exponents-laws', `${b}^${e} = ?`, b ** e, Math.max(3, b), `${b}^{${e}}`) },
  (l) => { const b = pick(['a', 'x', 'y']), m = ri(2, 6), n = ri(2, 6); return by(l, q('exponents-laws', 'I-simplify', `${b}^${m + n}`, [`${b}^${m * n}`, `${b}^${Math.abs(m - n)}`, `2${b}^${m + n}`], `${b}^{${m}} \\cdot ${b}^{${n}}`), q('exponents-laws', 'I-simplify', `${b}^${m * n}`, [`${b}^${m + n}`, `${b}^${m}`, `${b}^${n}`], `(${b}^{${m}})^{${n}}`), q('exponents-laws', 'I-simplify', `${b}^${Math.max(m, n) - Math.min(m, n)}`, [`${b}^${m + n}`, `${b}^${m * n}`, `${b}^${Math.max(m, n)}`], `\\frac{${b}^{${Math.max(m, n)}}}{${b}^{${Math.min(m, n)}}}`)) },
  (l) => { const r = by(l, ri(2, 10), ri(11, 20), ri(21, 30)); return num('square-roots-radicals', `√${r * r} = ?`, r, 3, `\\sqrt{${r * r}}`) },
  (l) => { const x = ri(-9, 15) || 4, a = ri(2, 9), b = ri(1, 20); const [tex, ans] = by(l, [`x + ${b} = ${x + b}`, x], [`${a}x = ${a * x}`, x], [`${a}x + ${b} = ${a * x + b}`, x]); return num('linear-equations-one-variable', 'Ano ang x?', ans, 4, tex) },
  (l) => { const x = ri(-5, 9), a = ri(2, 6), b = ri(1, 9), c = ri(1, 5); const [tex, ans] = by(l, [`${a}x + ${b}`, a * x + b], [`${a}x^2 - ${b}`, a * x * x - b], [`${a}x^2 + ${b}x - ${c}`, a * x * x + b * x - c]); return num('algebraic-expressions', `Kung x = ${x}, ano ang value?`, ans, 6, tex) },
  (l) => { const a = ri(2, 9), b = ri(2, 9), c = ri(1, 9), v = pick(['x', 'y', 'a']); const [tex, ans, wr] = by(l, [`${a}${v} + ${b}${v}`, `${a + b}${v}`, [`${a * b}${v}`, `${a + b}${v}^2`, `${a}${b}${v}`]], [`${a}${v} + ${b}${v} - ${c}${v}`, `${a + b - c}${v}`, [`${a + b + c}${v}`, `${a - b - c}${v}`, `${a * b}${v}`]], [`${a}(${v} + ${c})`, `${a}${v} + ${a * c}`, [`${a}${v} + ${c}`, `${a + c}${v}`, `${a}${v} + ${a + c}`]]); return q('polynomials-operations', 'I-simplify', ans, wr, tex) },
  (l) => { const p = by(l, pick([10, 20, 50]), pick([15, 25, 30]), pick([12, 35, 40])), price = by(l, ri(2, 20) * 50, ri(2, 20) * 100, ri(5, 40) * 50); const sale = price * (1 - p / 100); return num('percent-applications', `${p}% discount sa ₱${price}. Magkano ang babayaran?`, sale, Math.max(10, price / 20 | 0), undefined, (n) => `₱${dec(n)}`) },
  (l) => { const x1 = ri(-5, 5), y1 = ri(-5, 5), m = by(l, ri(1, 4), ri(-4, 4) || 2, ri(-6, 6) || -3), dx = ri(1, 4); const x2 = x1 + dx, y2 = y1 + m * dx; return num('linear-equations-two-variables', `Slope ng linya sa (${x1}, ${y1}) at (${x2}, ${y2})?`, m, 3) },
  (l) => { const x = ri(1, by(l, 9, 15, 25)), y = ri(1, by(l, 9, 15, 25)); return num('systems-of-equations', 'Ano ang x?', x, 4, `x + y = ${x + y},\\; x - y = ${x - y}`) },
  (l) => { const a = by(l, ri(2, 9), ri(2, 12), ri(3, 15)), v = pick(['x', 'y', 'a']); return by(l, q('special-products-factoring', 'I-factor', `${a}(${v} + ${a + 1})`, [`${v}(${a} + ${a + 1})`, `${a}(${v} + ${a * (a + 1)})`, `(${v} + ${a})(${v} + ${a + 1})`], `${a}${v} + ${a * (a + 1)}`), q('special-products-factoring', 'I-factor', `(${v} + ${a})(${v} - ${a})`, [`(${v} - ${a})^2`, `(${v} + ${a})^2`, `${v}(${v} - ${a * a})`], `${v}^2 - ${a * a}`), q('special-products-factoring', 'I-factor', `(${v} + ${a})^2`, [`(${v} - ${a})^2`, `(${v} + ${a})(${v} - ${a})`, `(${v} + ${2 * a})^2`], `${v}^2 + ${2 * a}${v} + ${a * a}`)) },
  (l) => { const r = by(l, ri(1, 5), ri(3, 10), ri(5, 20)); return Math.random() < 0.5 ? q('geometry-circles', `Area ng bilog na may radius ${r} cm (π ≈ 3.14)?`, `${dec(3.14 * r * r)} cm²`, [`${dec(3.14 * 2 * r)} cm²`, `${dec(3.14 * r)} cm²`, `${dec(3.14 * r * r * 2)} cm²`]) : q('geometry-circles', `Circumference ng bilog na may radius ${r} cm (π ≈ 3.14)?`, `${dec(2 * 3.14 * r)} cm`, [`${dec(3.14 * r * r)} cm`, `${dec(3.14 * r)} cm`, `${dec(4 * 3.14 * r)} cm`]) },
  (l) => { const [a, b, c] = pick(by(l, [[3, 4, 5], [6, 8, 10]], [[5, 12, 13], [8, 15, 17], [9, 12, 15]], [[7, 24, 25], [20, 21, 29], [12, 16, 20]])); return num('geometry-pythagorean', `Right triangle: legs ${a} at ${b}. Ano ang hypotenuse?`, c, 4) },
  (l) => { const comp = Math.random() < 0.5, a = by(l, ri(2, 8) * 10, ri(11, 79), ri(13, 77)); return comp ? num('geometry-angles', `Complement ng ${a}°?`, 90 - a, 10, undefined, (n) => `${n}°`) : num('geometry-angles', `Supplement ng ${a}°?`, 180 - a, 10, undefined, (n) => `${n}°`) },
  (l) => { const ev = by(l, pick([['even na numero', 3], ['numerong 6', 1]] as [string, number][]), pick([['numerong mas malaki sa 4', 2], ['prime number', 3]] as [string, number][]), pick([['numerong hindi 3', 5], ['multiple ng 3', 2]] as [string, number][])); return q('probability-simple', `Isang die ang ini-roll. Probability na ${ev[0]}?`, frac(ev[1], 6), [frac(6 - ev[1], 6), frac(ev[1], 12), frac(1, ev[1] + 1)]) },
  (l) => { const a = by(l, ri(2, 6), ri(3, 10), ri(5, 15)), b = ri(2, 8), c = ri(2, 9); return num('measurement-volume', `Volume ng box na ${a} × ${b} × ${c} cm?`, a * b * c, 12, undefined, (n) => `${n} cm³`) },
]

// ---------------------------------------------------------------- Grade 9–10
const G910: Gen[] = [
  () => { const r1 = ri(-6, 6) || 2, r2 = ri(-6, 9) || -3; const b = -(r1 + r2), c = r1 * r2; const sgn = (n: number) => (n < 0 ? `- ${-n}` : `+ ${n}`); return q('quadratic-equations', 'Ano ang mga roots?', `${Math.min(r1, r2)}, ${Math.max(r1, r2)}`, [`${-r1}, ${-r2}`, `${r1 + 1}, ${r2}`, `${-Math.max(r1, r2)}, ${-Math.min(r1, r2)}`], `x^2 ${sgn(b)}x ${sgn(c)} = 0`.replace('+ 0x ', '').replace(/ \+ 0$/, '')) },
  (l) => { const a = by(l, 1, ri(1, 3), ri(2, 5)), b = ri(-8, 8), c = ri(-9, 9); const D = b * b - 4 * a * c; return Math.random() < 0.5 ? num('quadratic-equations', 'Ano ang discriminant?', D, 8, `${a === 1 ? '' : a}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)} = 0`) : q('quadratic-equations', `Discriminant = ${D}. Anong uri ng roots?`, D > 0 ? 'Dalawang real, magkaiba' : D === 0 ? 'Isang real (magkapareho)' : 'Walang real roots', ['Dalawang real, magkaiba', 'Isang real (magkapareho)', 'Walang real roots', 'Tatlong real roots'].filter((x) => x !== (D > 0 ? 'Dalawang real, magkaiba' : D === 0 ? 'Isang real (magkapareho)' : 'Walang real roots'))) },
  (l) => { const a = by(l, 1, ri(2, 3), ri(-3, 3) || 2), b = ri(-5, 5), c = ri(-9, 9), x = ri(-4, 4); return num('quadratic-functions', `f(${x}) = ?`, a * x * x + b * x + c, 6, `f(x) = ${a}x^2 + ${b}x + ${c}`.replace(/\+ -/g, '- ')) },
  (l) => { const a = by(l, 1, ri(1, 3), ri(2, 4)), h = ri(-5, 5), b = -2 * a * h, c = ri(-9, 9); return num('quadratic-functions', 'x-coordinate ng vertex?', h, 3, `y = ${a}x^2 + ${b}x + ${c}`.replace(/\+ -/g, '- ')) },
  (l) => { const k = ri(2, by(l, 5, 9, 15)), x1 = ri(2, 6), x2 = ri(7, 15); return num('variation', `Ang y ay directly proportional sa x. Kung y = ${k * x1} kapag x = ${x1}, ano ang y kapag x = ${x2}?`, k * x2, by(l, 4, 6, 9)) },
  (l) => { const a1 = ri(-10, 20), d = by(l, ri(2, 5), ri(-6, 9) || 3, ri(-12, 15) || 7), n = by(l, ri(5, 10), ri(10, 25), ri(20, 50)); return num('sequences-arithmetic', `Arithmetic sequence: ${a1}, ${a1 + d}, ${a1 + 2 * d}, … Ano ang term #${n}?`, a1 + (n - 1) * d, Math.abs(d) + 2) },
  (l) => { const a1 = ri(1, 5), r = by(l, 2, ri(2, 3), pick([-2, 3, 4])), n = by(l, 5, ri(5, 6), ri(5, 7)); return num('sequences-geometric', `Geometric: ${a1}, ${a1 * r}, ${a1 * r * r}, … Ano ang term #${n}?`, a1 * r ** (n - 1), Math.max(4, Math.abs(a1 * r ** (n - 2)))) },
  (l) => { const a = ri(-3, 3) || 1, c3 = ri(1, 3), c2 = ri(-5, 5), c1 = ri(-6, 6), c0 = ri(-9, 9); const P = c3 * a ** 3 + c2 * a * a + c1 * a + c0; return num('polynomial-division-theorems', `Remainder kapag hinati sa (x ${a < 0 ? '+' : '−'} ${Math.abs(a)})?`, P, by(l, 4, 6, 10), `P(x) = ${c3}x^3 + ${c2}x^2 + ${c1}x + ${c0}`.replace(/\+ -/g, '- ')) },
  (l) => { const n = by(l, ri(3, 5), ri(5, 7), ri(6, 9)), r = by(l, 2, ri(2, 3), ri(2, 4)); const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1)); const P = fact(n) / fact(n - r), C = P / fact(r); return Math.random() < 0.5 ? q('probability-counting', `Ilang paraan para ayusin ang ${r} sa ${n} na tao (order matters)?`, String(P), [String(C), String(P + n), String(n * r)]) : q('probability-counting', `Ilang paraan pumili ng ${r} sa ${n} (order doesn't matter)?`, String(C), [String(P), String(C + n), String(n * r)]) },
  (l) => { const [dx, dy, d] = pick(by(l, [[3, 4, 5]], [[6, 8, 10], [5, 12, 13]], [[8, 15, 17], [7, 24, 25], [9, 12, 15]])); const x1 = ri(-5, 5), y1 = ri(-5, 5); return num('geometry-coordinate', `Distance ng (${x1}, ${y1}) at (${x1 + dx}, ${y1 + dy})?`, d, 3) },
  (l) => { const x1 = ri(-9, 9), y1 = ri(-9, 9), x2 = x1 + 2 * ri(1, by(l, 3, 5, 8)), y2 = y1 + 2 * ri(-5, 5); const m = `(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`; return q('geometry-coordinate', `Midpoint ng (${x1}, ${y1}) at (${x2}, ${y2})?`, m, [`(${x2 - x1}, ${y2 - y1})`, `(${(x1 + x2) / 2 + 1}, ${(y1 + y2) / 2})`, `(${x1 + x2}, ${y1 + y2})`]) },
  () => { const t = pick([['sin 30°', '1/2'], ['cos 60°', '1/2'], ['tan 45°', '1'], ['sin 90°', '1'], ['cos 0°', '1'], ['sin 0°', '0'], ['cos 90°', '0']] as [string, string][]); return q('trigonometry-right-triangles', `Ano ang ${t[0]}?`, t[1], ['1/2', '1', '0', '√2/2', '√3/2'].filter((x) => x !== t[1])) },
  (l) => { const s = by(l, pick([2, 3, 5]), pick([2, 3, 5, 6]), pick([2, 3, 5, 7])), k = by(l, ri(2, 4), ri(2, 6), ri(3, 9)); return q('square-roots-radicals', 'I-simplify', `${k}√${s}`, [`${k * k}√${s}`, `√${k + s}`, `${s}√${k}`], `\\sqrt{${k * k * s}}`) },
  (l) => { const central = by(l, pick([60, 90, 120]), ri(4, 16) * 10, ri(5, 34) * 5); return num('geometry-circles', `Central angle = ${central}°. Ano ang inscribed angle na humaharap sa parehong arc?`, central / 2, 10, undefined, (n) => `${n}°`) },
  (l) => { const n = by(l, 7, 9, 11); const xs = Array.from({ length: n }, () => ri(10, 60)).sort((a, b) => a - b); return num('statistics-measures-of-position', `Median ng ${xs.join(', ')}?`, xs[(n - 1) / 2], 4) },
]

export const BANK: Record<GradeBand, Gen[]> = { 'g1-3': G13, 'g4-6': G46, 'g7-8': G78, 'g9-10': G910 }

export const BAND_NOTE: Record<GradeBand, string> = {
  'g1-3': 'Add, subtract, multiply, divide, place value, pera, oras, hugis',
  'g4-6': 'Fractions, decimals, percent, ratio, GCF/LCM, area, conversions',
  'g7-8': 'Integers, exponents, equations, slope, factoring, circles, probability',
  'g9-10': 'Quadratics, sequences, polynomials, coordinates, trig, counting',
}

/**
 * One match: never the same question twice, topics rotate so one strand doesn't dominate, and
 * difficulty follows the learner — two right in a row → harder, a miss → easier.
 */
export function createDuelPicker(band: GradeBand, startLevel: Level = 1) {
  const gens = BANK[band]
  const seen = new Set<string>()
  let order: Gen[] = []
  let level: Level = startLevel
  let streak = 0
  let lastTopic: TopicId | null = null
  return {
    get level() { return level },
    next(): DuelQ {
      for (let tries = 0; tries < 60; tries++) {
        if (!order.length) order = shuffle([...gens])
        const qq = order.pop()!(level)
        if (seen.has(qq.key) || (qq.topic === lastTopic && tries < 30)) continue
        seen.add(qq.key)
        lastTopic = qq.topic
        return qq
      }
      const qq = pick(gens)(level)
      seen.add(qq.key)
      return qq
    },
    /** how the learner did on the last question (undefined = no signal, e.g. opponent was faster) */
    feedback(correct: boolean | undefined) {
      if (correct === undefined) return
      if (correct) { streak++; if (streak >= 2 && level < 3) { level = (level + 1) as Level; streak = 0 } }
      else { streak = 0; if (level > 1) level = (level - 1) as Level }
    },
  }
}
