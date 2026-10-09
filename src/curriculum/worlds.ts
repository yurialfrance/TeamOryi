import type { Generator, KeyboardTab, Question } from '../engine/types'
import type { IconName } from '../components/Icon'
import { shuffle } from '../engine/rand'
import * as E from './elementary'
import * as J from './jhs'
import * as S from './shs'
import * as C from './college'

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
  id: 'elem' | 'jhs' | 'shs' | 'college'
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

export const WORLDS: World[] = [
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
      { id: 'e1', title: 'Ano ang Fraction?', icon: 'pizza', competency: 'Represents fractions using regions and the number line', gens: [E.identifyFraction, E.identifyFraction, E.fractionNumberLine] },
      { id: 'e2', title: 'Magkapantay na Fractions', icon: 'scale', competency: 'Identifies and generates equivalent fractions', gens: [E.equivalentFraction] },
      { id: 'e3', title: 'Alin ang Mas Malaki?', icon: 'magnifier', competency: 'Compares fractions with the same numerator or denominator', gens: [E.compareFractions, E.fractionNumberLine] },
      { id: 'e4', title: 'Pagsasama ng Hiwa', icon: 'plus', competency: 'Adds and subtracts similar fractions in lowest terms', gens: [E.addSimilar] },
      { id: 'e5', title: 'Pizza Party!', icon: 'party', competency: 'Solves word problems involving fractions', gens: [E.fractionWord, E.addSimilar] },
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
