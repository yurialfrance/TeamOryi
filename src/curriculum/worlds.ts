import type { Generator, KeyboardTab, Question } from '../engine/types'
import type { IconName } from '../components/Icon'
import { shuffle } from '../engine/rand'
import * as E from './elementary'
import * as J from './jhs'
import * as S from './shs'
import * as C from './college'
import * as P from './primary'
import * as I from './intermediate'
import * as G9 from './grade9'
import * as ST from './stats'

export interface Stage {
  id: string
  title: string
  /** Learning competency (plain language). Map to official MATATAG / CHED codes in curriculum-map.md */
  competency: string
  gens: Generator[]
  icon: IconName
}

export interface GuideItem {
  title: string
  tex?: string
  text: string
}

export interface World {
  id: string
  name: string
  level: string
  curriculum: string
  icon: IconName
  guide: GuideItem[]
  color: string
  colorDark: string
  soft: string
  tabs: KeyboardTab[]
  stages: Stage[]
}

/** A topic on the roadmap that isn't playable yet */
export interface SoonWorld {
  id: string
  name: string
  level: string
  curriculum: string
  icon: IconName
  color: string
  topics: string[]
}

export const WORLDS: World[] = [
  {
    id: 'primary',
    guide: [
      { title: 'Place value', tex: '4{,}582 = 4000 + 500 + 80 + 2', text: 'Mula kanan: ones, tens, hundreds, thousands.' },
      { title: 'Regrouping', tex: '48 + 37 = 85', text: 'Kapag 10 pataas ang sum sa isang column, i-carry ang 1 sa susunod.' },
      { title: 'Pera', tex: '3 \\times ₱20 = ₱60', text: 'I-multiply ang halaga sa dami, tapos i-add lahat.' },
    ],
    name: 'Tindahan ni Aling Nena',
    level: 'Grade 1–3',
    curriculum: 'DepEd MATATAG · Whole Numbers, Operations & Money',
    icon: 'store',
    color: '#FF4B6E',
    colorDark: '#D93355',
    soft: '#FFE6EC',
    tabs: ['basic'],
    stages: [
      { id: 'p1', title: 'Place Value', icon: 'blocks', competency: 'Identifies place value of digits in numbers up to 10,000', gens: [P.placeValue] },
      { id: 'p2', title: 'Pagdaragdag', icon: 'plus', competency: 'Adds whole numbers with regrouping', gens: [P.addWhole] },
      { id: 'p3', title: 'Pagbabawas', icon: 'steps', competency: 'Subtracts whole numbers with regrouping', gens: [P.subWhole] },
      { id: 'p4', title: 'Bilang ng Pera', icon: 'coins', competency: 'Counts and computes money in pesos', gens: [P.countMoney] },
      { id: 'p5', title: 'Multiplication Table', icon: 'abacus', competency: 'Multiplies numbers up to 10 × 10', gens: [P.timesTable, P.countMoney] },
    ],
  },
  {
    id: 'elem',
    guide: [
      { title: 'Ang fraction ay bahagi ng buo', tex: '\\frac{\\text{numerator}}{\\text{denominator}}', text: 'Ang denominator (ibaba) ay kung ilang pantay na hiwa. Ang numerator (itaas) ay kung ilan ang kinuha.' },
      { title: 'Equivalent fractions', tex: '\\frac{1}{2} = \\frac{2}{4} = \\frac{4}{8}', text: 'I-multiply o i-divide ang itaas at ibaba sa parehong numero — hindi nagbabago ang value.' },
      { title: 'Pagkumpara', tex: '\\frac{3}{8} < \\frac{5}{8}', text: 'Kapag pareho ang denominator, mas malaki ang may mas malaking numerator.' },
      { title: 'Similar fractions', tex: '\\frac{2}{9} + \\frac{4}{9} = \\frac{6}{9} = \\frac{2}{3}', text: 'I-add ang numerators, panatilihin ang denominator, tapos i-simplify.' },
    ],
    name: 'Hati-hati sa Pizza',
    level: 'Grade 3–4',
    curriculum: 'DepEd MATATAG · Number & Algebra — Fractions',
    icon: 'pizza',
    color: '#FF8A1F',
    colorDark: '#D96A00',
    soft: '#FFF0E0',
    tabs: ['basic'],
    stages: [
      { id: 'e1', title: 'Ano ang Fraction?', icon: 'pizza', competency: 'Represents fractions using regions and the number line', gens: [E.identifyFraction, E.fractionNumberLine, E.pizzaChefGen] },
      { id: 'e2', title: 'Magkapantay na Fractions', icon: 'scale', competency: 'Identifies and generates equivalent fractions', gens: [E.equivalentFraction, E.pizzaChefGen] },
      { id: 'e3', title: 'Alin ang Mas Malaki?', icon: 'magnifier', competency: 'Compares fractions with the same numerator or denominator', gens: [E.compareFractions, E.fractionNumberLine] },
      { id: 'e4', title: 'Pagsasama ng Hiwa', icon: 'plus', competency: 'Adds and subtracts similar fractions in lowest terms', gens: [E.addSimilar] },
      { id: 'e5', title: 'Pizza Party!', icon: 'party', competency: 'Solves word problems involving fractions', gens: [E.fractionWord, E.pizzaChefGen, E.addSimilar] },
    ],
  },
  {
    id: 'inter',
    guide: [
      { title: 'GCF at LCM', tex: '\\text{GCF}(12,18)=6,\; \\text{LCM}(4,6)=12', text: 'GCF: pinakamalaking common factor. LCM: pinakamaliit na common multiple.' },
      { title: 'Ratio', tex: '12:18 = 2:3', text: 'I-divide ang dalawang numero sa kanilang GCF.' },
      { title: 'Proportion', tex: '\\frac{2}{30} = \\frac{5}{x} \\Rightarrow x = 75', text: 'Mag-cross multiply, o hanapin muna ang halaga ng isa.' },
      { title: 'Discount', tex: '₱400 - 25\\% = ₱300', text: 'Hanapin ang discount, tapos ibawas sa presyo.' },
    ],
    name: 'Hatian ng Barkada',
    level: 'Grade 5–6',
    curriculum: 'DepEd MATATAG · Factors, Ratio, Decimals & Percent',
    icon: 'blocks',
    color: '#00A6A6',
    colorDark: '#007F80',
    soft: '#DDF6F6',
    tabs: ['basic'],
    stages: [
      { id: 'i1', title: 'GCF', icon: 'blocks', competency: 'Finds the greatest common factor of two numbers', gens: [I.gcfGen] },
      { id: 'i2', title: 'LCM', icon: 'clock', competency: 'Finds the least common multiple and applies it', gens: [I.lcmGen] },
      { id: 'i3', title: 'Ratio', icon: 'versus', competency: 'Expresses ratios in simplest form', gens: [I.ratioSimplify] },
      { id: 'i4', title: 'Proportion', icon: 'scale', competency: 'Solves problems involving direct proportion', gens: [I.proportion] },
      { id: 'i5', title: 'Decimals at Discount', icon: 'tag', competency: 'Performs operations on decimals and solves percent problems', gens: [I.decimalOps, I.percentWord] },
    ],
  },
  {
    id: 'jhs',
    guide: [
      { title: 'Variable', tex: '2x + 5', text: 'Ang x ay numerong hindi pa natin alam. Palitan ito ng value para ma-evaluate.' },
      { title: 'Balanse ang equation', tex: 'x + 7 = 12 \\Rightarrow x = 5', text: 'Kung ano ang ginawa mo sa kaliwa, gawin din sa kanan — parang timbangan.' },
      { title: 'Dalawang hakbang', tex: '3x + 4 = 19', text: 'Una, alisin ang +4. Pangalawa, i-divide sa 3. Sagot: x = 5.' },
      { title: 'Salita → simbolo', tex: '\\text{kabuuan} \\to +,\\; \\text{produkto} \\to \\times', text: '“Mas kaunti sa” ay minus, “quotient” ay division.' },
    ],
    name: 'Balanse ng Timbangan',
    level: 'Grade 7',
    curriculum: 'DepEd MATATAG · Algebra — Linear Equations',
    icon: 'scale',
    color: '#2F6BFF',
    colorDark: '#1F4FD1',
    soft: '#E6EEFF',
    tabs: ['basic', 'algebra'],
    stages: [
      { id: 'j1', title: 'Palitan ang x', icon: 'swap', competency: 'Evaluates algebraic expressions for given values', gens: [J.evaluateExpr] },
      { id: 'j2', title: 'Isang Hakbang', icon: 'steps', competency: 'Solves one-step linear equations', gens: [J.oneStep] },
      { id: 'j3', title: 'Dalawang Hakbang', icon: 'stairs', competency: 'Solves two-step linear equations', gens: [J.twoStep] },
      { id: 'j4', title: 'Salita → Simbolo', icon: 'puzzle', competency: 'Translates verbal phrases into algebraic expressions', gens: [J.translateTiles] },
      { id: 'j5', title: 'Jeep, Load, Tindahan', icon: 'jeep', competency: 'Solves real-life problems using linear equations', gens: [J.linearWord, J.twoStep] },
    ],
  },
  {
    id: 'g9',
    guide: [
      { title: 'Standard form', tex: 'ax^2 + bx + c = 0', text: 'Ilipat lahat sa isang side para zero ang kabila.' },
      { title: 'Factoring', tex: 'x^2 - 5x + 6 = (x-2)(x-3)', text: 'Dalawang numero na ang product ay c at ang sum ay b.' },
      { title: 'Discriminant', tex: 'D = b^2 - 4ac', text: 'D > 0: dalawang roots, D = 0: isa, D < 0: walang real root.' },
      { title: 'Sum at product', tex: 'r_1 + r_2 = -\\frac{b}{a},\; r_1 r_2 = \\frac{c}{a}', text: 'Makukuha mo agad kahit hindi i-solve.' },
    ],
    name: 'Kurba ng Bola',
    level: 'Grade 9',
    curriculum: 'DepEd MATATAG · Quadratic Equations & Functions',
    icon: 'target',
    color: '#E64A8A',
    colorDark: '#B8326A',
    soft: '#FDE5EF',
    tabs: ['basic', 'algebra'],
    stages: [
      { id: 'g1', title: 'Quadratic Function', icon: 'chartUp', competency: 'Evaluates quadratic functions', gens: [G9.evalQuad] },
      { id: 'g2', title: 'Factoring', icon: 'puzzle', competency: 'Solves quadratic equations by factoring', gens: [G9.factorRoots] },
      { id: 'g3', title: 'Discriminant', icon: 'magnifier', competency: 'Uses the discriminant to describe the nature of roots', gens: [G9.discriminant] },
      { id: 'g4', title: 'Sum at Product', icon: 'plus', competency: 'Relates coefficients to the sum and product of roots', gens: [G9.sumProduct] },
      { id: 'g5', title: 'Taniman ni Mang Tonyo', icon: 'sunflower', competency: 'Solves problems involving quadratic equations', gens: [G9.quadWord, G9.factorRoots] },
    ],
  },
  {
    id: 'shs',
    guide: [
      { title: 'Percent', tex: '25\\% = 0.25', text: 'I-divide sa 100 para gawing decimal bago i-multiply.' },
      { title: 'Simple interest', tex: 'I = Prt', text: 'P = principal, r = rate kada taon (decimal), t = taon.' },
      { title: 'Maturity value', tex: 'F = P(1 + rt)', text: 'Ang kabuuang babayaran o matatanggap: principal + interest.' },
      { title: 'Compound interest', tex: 'F = P(1 + r)^{t}', text: 'Kumikita rin ng interest ang interest — kaya mas mabilis lumaki.' },
    ],
    name: 'Ipon Challenge',
    level: 'SHS General Math',
    curriculum: 'DepEd SHS General Mathematics · Business Math — Interest',
    icon: 'coins',
    color: '#3DBE6B',
    colorDark: '#2A9A51',
    soft: '#E3F8EA',
    tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 's1', title: 'Percent Power', icon: 'tag', competency: 'Computes percentages in real-life contexts', gens: [S.percentOf] },
      { id: 's2', title: 'Simple Interest', icon: 'bank', competency: 'Computes simple interest (I = Prt)', gens: [S.simpleInterest] },
      { id: 's3', title: 'Maturity Value', icon: 'calendar', competency: 'Computes maturity value under simple interest', gens: [S.maturitySimple] },
      { id: 's4', title: 'Compound Interest', icon: 'chartUp', competency: 'Computes compound interest and future value', gens: [S.compoundInterest] },
      { id: 's5', title: 'Simple vs Compound', icon: 'versus', competency: 'Compares simple and compound interest', gens: [S.simpleVsCompound, S.compoundInterest] },
    ],
  },
  {
    id: 'stats',
    guide: [
      { title: 'Mean', tex: '\\bar{x} = \\frac{\\sum x}{n}', text: 'I-add lahat, i-divide sa dami.' },
      { title: 'Median', tex: '1, 3, \\underline{5}, 8, 9', text: 'Ang nasa gitna kapag naka-ayos na.' },
      { title: 'Probability', tex: 'P = \\frac{\\text{gusto}}{\\text{lahat}}', text: 'Laging nasa pagitan ng 0 at 1.' },
      { title: 'z-score', tex: 'z = \\frac{x - \\mu}{\\sigma}', text: 'Ilang standard deviation ang layo mo sa mean.' },
    ],
    name: 'Datos ng Barangay',
    level: 'SHS Stats & Probability',
    curriculum: 'DepEd SHS Statistics & Probability · Data & Chance',
    icon: 'chartUp',
    color: '#1F9BD1',
    colorDark: '#167AA6',
    soft: '#E0F3FB',
    tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 't1', title: 'Mean', icon: 'chartUp', competency: 'Computes the mean of a data set', gens: [ST.meanGen] },
      { id: 't2', title: 'Median', icon: 'blocks', competency: 'Finds the median of a data set', gens: [ST.medianGen] },
      { id: 't3', title: 'Mode', icon: 'target', competency: 'Identifies the mode of a data set', gens: [ST.modeGen] },
      { id: 't4', title: 'Probability', icon: 'party', competency: 'Computes the probability of simple events', gens: [ST.probabilityGen] },
      { id: 't5', title: 'z-Score', icon: 'medal', competency: 'Computes and interprets z-scores of a normal distribution', gens: [ST.zScore, ST.meanGen] },
    ],
  },
  {
    id: 'college',
    guide: [
      { title: 'Arithmetic sequence', tex: 'a_n = a_1 + (n-1)d', text: 'Pare-pareho ang difference d sa pagitan ng magkasunod na terms.' },
      { title: 'Geometric sequence', tex: 'a_n = a_1 r^{n-1}', text: 'Pare-pareho ang ratio r.' },
      { title: 'Fibonacci', tex: 'F_n = F_{n-1} + F_{n-2}', text: '1, 1, 2, 3, 5, 8, 13… makikita sa sunflower, pinya, at kabibe.' },
      { title: 'Golden ratio', tex: '\\varphi = \\frac{1+\\sqrt{5}}{2} \\approx 1.618', text: 'Ang ratio ng magkasunod na Fibonacci numbers ay lumalapit sa φ.' },
    ],
    name: 'Sipnayan sa Kalikasan',
    level: 'College GE',
    curriculum: 'CHED GE · Mathematics in the Modern World — Patterns in Nature',
    icon: 'sunflower',
    color: '#9B5DE5',
    colorDark: '#7B3FC4',
    soft: '#F2EAFD',
    tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 'c1', title: 'Hanapin ang Pattern', icon: 'blocks', competency: 'Identifies patterns in sequences', gens: [C.nextTerm] },
      { id: 'c2', title: 'Fibonacci', icon: 'spiral', competency: 'Recognizes the Fibonacci sequence in nature', gens: [C.fibonacciNext] },
      { id: 'c3', title: 'Formula ng nth Term', icon: 'abacus', competency: 'Writes the general term of an arithmetic sequence', gens: [C.nthTermFormula] },
      { id: 'c4', title: 'Golden Ratio', icon: 'sunflower', competency: 'Relates the Fibonacci sequence to the golden ratio', gens: [C.goldenRatio, C.fibonacciNext] },
      { id: 'c5', title: 'Hilera ng Pinya', icon: 'pineapple', competency: 'Computes the sum of an arithmetic series', gens: [C.seriesSum, C.nextTerm] },
    ],
  },
]

export const SOON: SoonWorld[] = [
  { id: 'g8', name: 'Factoring at Systems', level: 'Grade 8', curriculum: 'DepEd MATATAG', icon: 'puzzle', color: '#7A6F85',
    topics: ['Factoring polynomials', 'Rational algebraic expressions', 'Linear equations in two variables', 'Systems of linear equations', 'Triangle congruence', 'Basic probability'] },
  { id: 'g10', name: 'Bilog at Pagkakataon', level: 'Grade 10', curriculum: 'DepEd MATATAG', icon: 'target', color: '#7A6F85',
    topics: ['Arithmetic & geometric sequences', 'Polynomial equations', 'Circles', 'Coordinate geometry', 'Permutations at combinations'] },
  { id: 'stem', name: 'Pre-Calculus at Basic Calculus', level: 'SHS STEM', curriculum: 'DepEd SHS STEM', icon: 'chartUp', color: '#7A6F85',
    topics: ['Conic sections', 'Trigonometric identities', 'Limits at continuity', 'Derivatives', 'Integration'] },
  { id: 'genmath2', name: 'Functions at Logic', level: 'SHS General Math', curriculum: 'DepEd SHS General Mathematics', icon: 'puzzle', color: '#7A6F85',
    topics: ['Rational, exponential at logarithmic functions', 'Annuities, stocks at bonds', 'Propositions at syllogisms'] },
  { id: 'mmw2', name: 'Math sa Modernong Mundo', level: 'College GE', curriculum: 'CHED GE · Mathematics in the Modern World', icon: 'book', color: '#7A6F85',
    topics: ['Data management at regression', 'Amortization at inflation', 'Voting methods at fair division', 'Tessellations at symmetry', 'Graph theory at Euler paths', "Polya's problem solving"] },
]

/** Full learning path in curriculum order: playable worlds + coming-soon topics */
export type RoadmapItem = { kind: 'world'; world: World } | { kind: 'soon'; soon: SoonWorld }
const W = (id: string): RoadmapItem => ({ kind: 'world', world: WORLDS.find((w) => w.id === id)! })
const N = (id: string): RoadmapItem => ({ kind: 'soon', soon: SOON.find((w) => w.id === id)! })
export const ROADMAP: RoadmapItem[] = [W('primary'), W('elem'), W('inter'), W('jhs'), N('g8'), W('g9'), N('g10'), W('shs'), N('genmath2'), W('stats'), N('stem'), W('college'), N('mmw2')]

export const QUESTIONS_PER_LESSON = 6

export function buildLesson(stage: Stage): Question[] {
  const qs: Question[] = []
  const order = shuffle(Array.from({ length: QUESTIONS_PER_LESSON }, (_, i) => stage.gens[i % stage.gens.length]))
  for (const g of order) qs.push(g())
  return qs
}

export const findStage = (stageId: string) => {
  for (const w of WORLDS) {
    const s = w.stages.find((x) => x.id === stageId)
    if (s) return { world: w, stage: s, index: w.stages.indexOf(s) }
  }
  return null
}
