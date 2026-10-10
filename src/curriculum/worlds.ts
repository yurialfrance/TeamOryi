import type { KeyboardTab, Question, Visual } from '../engine/types'
import type { IconName } from '../components/Icon'
import { shuffle } from '../engine/rand'
import { tag, type TaggedGen } from './kit'
import * as E from './elementary'
import * as J from './jhs'
import * as S from './shs'
import * as C from './college'
import * as P from './primary'
import * as I from './intermediate'
import * as G9 from './grade9'
import * as ST from './stats'
import * as G1 from './grade1'
import * as G2 from './grade2'
import * as G3 from './grade3'
import * as G4 from './grade4'
import * as G5 from './grade5'
import * as G6 from './grade6'
import * as G7 from './grade7'
import * as G8 from './grade8'
import * as G10 from './grade10'
import * as STEM from './stem'
import * as GM from './genmath'

export type { TaggedGen } from './kit'

export interface GuideItem {
  title: string
  tex?: string
  text: string
}

export interface Stage {
  id: string
  title: string
  /** Learning competency (plain language), sequenced after DepEd MATATAG (G1–10) / SHS / CHED GE */
  competency: string
  /** Every generator carries its topic, so every answer lands in the right row of the reports */
  gens: TaggedGen[]
  icon: IconName
  /** "Matuto muna" cards shown before the first attempt, and in the island's Gabay */
  guide: GuideItem[]
  /** Optional picture for the first teaching card */
  visual?: Visual
}

export interface World {
  id: string
  name: string
  /** Grade label shown on the island card, e.g. "Grade 4" */
  level: string
  curriculum: string
  /** 'grade' = the Grade 1–10 path; 'sampler' = SHS / college tasting islands */
  tier: 'grade' | 'sampler'
  icon: IconName
  color: string
  colorDark: string
  soft: string
  tabs: KeyboardTab[]
  stages: Stage[]
}

const g = (title: string, tex: string | undefined, text: string): GuideItem => ({ title, tex, text })

export const WORLDS: World[] = [
  // ================================================================ GRADE 1
  {
    id: 'grade1', name: 'Bilangan sa Bakuran', level: 'Grade 1', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 1 · Bilang hanggang 100, Pera, Hugis at Oras',
    icon: 'abacus', color: '#FF4B6E', colorDark: '#D93355', soft: '#FFE6EC', tabs: ['basic'],
    stages: [
      { id: 'gr1-1', title: 'Bilang hanggang 100', icon: 'blocks', competency: 'Counts, compares and orders whole numbers up to 100',
        gens: [...tag('whole-numbers-comparing', G1.compare100, G1.beforeAfter)],
        guide: [g('Mas malaki o mas maliit?', '47 > 39', 'Tingnan muna ang tens. Kung pareho, tingnan ang ones.'), g('Kasunod at bago', '56,\\; 57,\\; 58', 'Ang kasunod ay +1. Ang bago ay −1.')] },
      { id: 'gr1-2', title: 'Tens at Ones', icon: 'abacus', competency: 'Gives the place value of digits in any 2-digit number',
        gens: tag('whole-numbers-place-value', G1.tensOnes), visual: { type: 'bar', num: 4, den: 10 },
        guide: [g('Tens at ones', '47 = 40 + 7', 'Ang kaliwang digit ay tens (grupo ng 10). Ang kanan ay ones.')] },
      { id: 'gr1-3', title: 'Ika-ilan?', icon: 'stairs', competency: 'Uses ordinal numbers up to 10th',
        gens: tag('whole-numbers-counting', G1.ordinal), visual: { type: 'scene', icons: ['egg', 'milk', 'bread'] },
        guide: [g('Ordinal numbers', '1^{st},\\, 2^{nd},\\, 3^{rd},\\, 4^{th}', 'Una, ikalawa, ikatlo, ikaapat… Sinasabi nito ang pwesto sa pila.')] },
      { id: 'gr1-4', title: 'Pagdaragdag', icon: 'plus', competency: 'Adds numbers with sums up to 20, then up to 100',
        gens: tag('whole-numbers-addition', G1.addTo20, G1.addTo100),
        guide: [g('Gumawa ng 10', '8 + 5 = 8 + 2 + 3 = 13', 'Kunin ang kulang para maging 10, tapos idagdag ang natira.'), g('Ones muna', '34 + 25 = 59', 'I-add ang ones, tapos ang tens.')] },
      { id: 'gr1-5', title: 'Pagbabawas', icon: 'steps', competency: 'Subtracts numbers where both are less than 100',
        gens: tag('whole-numbers-subtraction', G1.subUnder100),
        guide: [g('Pagbabawas', '58 - 23 = 35', 'Ones muna, tapos tens. Kung kulang ang ones, humiram ng 1 ten.'), g('I-check', '35 + 23 = 58', 'Ang sagot + ang ibinawas = ang simula.')] },
      { id: 'gr1-6', title: 'Barya at Papel', icon: 'coins', competency: 'Counts, adds and subtracts Philippine coins and bills up to ₱100',
        gens: [...tag('money-counting', G1.coins100), ...tag('money-word-problems', G1.moneyLeft)], visual: { type: 'scene', icons: ['coins', 'store'] },
        guide: [g('Barya at papel', '₱1,\\; ₱5,\\; ₱10,\\; ₱20,\\; ₱50,\\; ₱100', 'Bilangin muna ang pinakamalaki, tapos idagdag ang maliliit.'), g('Natirang pera', '₱50 - ₱35 = ₱15', 'Ibawas ang presyo sa perang hawak mo.')] },
      { id: 'gr1-7', title: 'Kalahati at Kapat', icon: 'pizza', competency: 'Illustrates and counts halves (1/2) and quarters (1/4) of a whole',
        gens: tag('fractions-concept', G1.halvesQuarters), visual: { type: 'pizza', num: 1, den: 4 },
        guide: [g('Kalahati', '\\frac{1}{2}', 'Hatiin sa 2 pantay na bahagi, kunin ang isa.'), g('Kapat', '\\frac{1}{4}', 'Hatiin sa 4 na pantay na bahagi, kunin ang isa. 2 kapat = 1 kalahati.')] },
      { id: 'gr1-8', title: 'Hugis at Pattern', icon: 'puzzle', competency: 'Identifies simple 2D shapes and continues repeating patterns',
        gens: [...tag('geometry-shapes', G1.shapes), ...tag('number-patterns', G1.repeating)], visual: { type: 'polygon', sides: 3 },
        guide: [g('Mga hugis', undefined, 'Tatsulok: 3 gilid. Parisukat: 4 na pantay na gilid. Bilog: walang gilid.'), g('Umuulit na pattern', 'A,\\, B,\\, A,\\, B,\\, ?', 'Hanapin ang grupong umuulit, tapos ituloy.')] },
      { id: 'gr1-9', title: 'Anong Oras Na?', icon: 'clock', competency: 'Tells time by the hour, half hour and quarter hour; uses days, weeks and months',
        gens: tag('measurement-time', G1.clockRead, G1.calendar), visual: { type: 'clock', h: 3, m: 30 },
        guide: [g('Orasan', undefined, 'Maikling kamay = oras. Mahabang kamay = minuto. Sa 6 ay :30, sa 3 ay :15.'), g('Kalendaryo', undefined, '7 araw sa isang linggo, 12 buwan sa isang taon.')] },
    ],
  },
  // ================================================================ GRADE 2
  {
    id: 'grade2', name: 'Tindahan ni Aling Nena', level: 'Grade 2', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 2 · Bilang hanggang 1000, Pera, Multiplication at Division',
    icon: 'store', color: '#E8A400', colorDark: '#B88200', soft: '#FFF6D6', tabs: ['basic'],
    stages: [
      { id: 'gr2-1', title: 'Bilang hanggang 1000', icon: 'blocks', competency: 'Reads, writes and compares numbers up to 1000 using place value',
        gens: tag('whole-numbers-place-value', G2.placeValue1000),
        guide: [g('Hundreds, tens, ones', '352 = 300 + 50 + 2', 'Mula kanan: ones, tens, hundreds.')] },
      { id: 'p2', title: 'Pagdaragdag', icon: 'plus', competency: 'Adds whole numbers with sums up to 1000, with regrouping',
        gens: tag('whole-numbers-addition', P.addWhole),
        guide: [g('Regrouping', '48 + 37 = 85', 'Kapag 10 pataas ang sum sa isang column, i-carry ang 1 sa susunod.')] },
      { id: 'p3', title: 'Pagbabawas', icon: 'steps', competency: 'Subtracts numbers less than 1000, with regrouping',
        gens: tag('whole-numbers-subtraction', P.subWhole),
        guide: [g('Paghiram', '52 - 27 = 25', 'Kung mas maliit ang itaas, humiram ng 10 sa katabing column.')] },
      { id: 'gr2-4', title: 'Odd, Even at Pattern', icon: 'spiral', competency: 'Identifies odd and even numbers; completes increasing and decreasing patterns',
        gens: tag('number-patterns', G2.oddEven, G2.skipPattern),
        guide: [g('Odd at even', '24 \\text{ even},\\; 37 \\text{ odd}', 'Even kung 0, 2, 4, 6, 8 ang huling digit.'), g('Skip counting', '5,\\, 10,\\, 15,\\, 20', 'Hanapin ang pagitan ng magkasunod na numero.')] },
      { id: 'gr2-5', title: 'Multiplication', icon: 'abacus', competency: 'Multiplies using the 2, 3, 4, 5 and 10 multiplication tables',
        gens: tag('whole-numbers-multiplication', G2.times2to10), visual: { type: 'scene', icons: ['egg', 'egg', 'egg'] },
        guide: [g('Paulit-ulit na pagdagdag', '3 \\times 4 = 4 + 4 + 4 = 12', 'Ang 3 × 4 ay 3 grupo ng 4.')] },
      { id: 'gr2-6', title: 'Hatian (Division)', icon: 'versus', competency: 'Divides using the 2, 3, 4, 5 and 10 multiplication tables',
        gens: tag('whole-numbers-division', G2.divide2to10),
        guide: [g('Pantay na hatian', '12 \\div 3 = 4', 'Ilang grupo? Ilan sa bawat grupo? Ang division ay kabaligtaran ng multiplication.')] },
      { id: 'e1', title: 'Ano ang Fraction?', icon: 'pizza', competency: 'Represents unit and similar fractions (denominators 2–8) using regions and the number line',
        gens: tag('fractions-concept', E.identifyFraction, E.fractionNumberLine, E.pizzaChefGen), visual: { type: 'pizza', num: 3, den: 4 },
        guide: [g('Ang fraction ay bahagi ng buo', '\\frac{\\text{numerator}}{\\text{denominator}}', 'Ang denominator (ibaba) ay kung ilang pantay na hiwa. Ang numerator (itaas) ay kung ilan ang kinuha.')] },
      { id: 'p4', title: 'Bilang ng Pera', icon: 'coins', competency: 'Counts and adds money up to ₱1000',
        gens: [...tag('money-counting', P.countMoney), ...tag('money-multi-item', G2.money1000)],
        guide: [g('Pera', '3 \\times ₱20 = ₱60', 'I-multiply ang halaga sa dami, tapos i-add lahat.')] },
      { id: 'gr2-9', title: 'Oras, Perimeter at Pictograph', icon: 'clock', competency: 'Finds elapsed time (a.m./p.m.), perimeter of triangles, squares and rectangles, and reads pictographs with a scale',
        gens: [...tag('measurement-time', G2.elapsedTime), ...tag('measurement-perimeter-area', G2.perimeterBasic), ...tag('statistics-graphs', G2.pictograph)],
        guide: [g('Elapsed time', '8{:}30 \\to 10{:}00 = 1\\tfrac{1}{2}\\text{ oras}', 'Bilangin ang buong oras, tapos ang minuto.'), g('Perimeter', 'P = \\text{kabuuang haba ng gilid}', 'I-add ang lahat ng gilid ng hugis.')] },
    ],
  },
  // ================================================================ GRADE 3
  {
    id: 'grade3', name: 'Piyesta sa Barangay', level: 'Grade 3', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 3 · Bilang hanggang 10 000, Multiplication, Division, Fractions at Area',
    icon: 'party', color: '#FF8A1F', colorDark: '#D96A00', soft: '#FFF0E0', tabs: ['basic'],
    stages: [
      { id: 'p1', title: 'Place Value', icon: 'blocks', competency: 'Identifies place value of digits in numbers up to 10 000 and rounds them',
        gens: [...tag('whole-numbers-place-value', P.placeValue), ...tag('whole-numbers-rounding', G3.roundWhole)],
        guide: [g('Place value', '4{,}582 = 4000 + 500 + 80 + 2', 'Mula kanan: ones, tens, hundreds, thousands.'), g('Rounding', '4{,}582 \\approx 4{,}600', 'Tingnan ang digit sa kanan: 5 pataas, round up.')] },
      { id: 'gr3-2', title: 'Add at Subtract hanggang 10 000', icon: 'plus', competency: 'Adds and subtracts numbers up to 4 digits, including money up to ₱10 000',
        gens: [...tag('whole-numbers-addition', G3.addSub4)],
        guide: [g('I-align ang columns', '3{,}456 + 2{,}789 = 6{,}245', 'Ones sa ones, tens sa tens. Mag-carry o humiram kung kailangan.')] },
      { id: 'p5', title: 'Multiplication Table', icon: 'abacus', competency: 'Multiplies numbers up to 10 × 10, including the 6, 7, 8 and 9 tables',
        gens: [...tag('whole-numbers-multiplication', P.timesTable), ...tag('money-counting', P.countMoney)],
        guide: [g('Times table', '7 \\times 8 = 56', 'Kabisaduhin ang 6, 7, 8 at 9 times tables — ito ang pinakamadalas gamitin.')] },
      { id: 'gr3-4', title: 'Pagtantiya', icon: 'magnifier', competency: 'Estimates products and quotients by rounding to the nearest 10',
        gens: tag('whole-numbers-rounding', G3.estimate),
        guide: [g('Estimate muna', '48 \\times 7 \\approx 50 \\times 7 = 350', 'I-round off muna, tapos i-compute. Mabilis at malapit sa tunay na sagot.')] },
      { id: 'gr3-5', title: 'Long Division', icon: 'versus', competency: 'Divides 2- to 4-digit numbers by 1-digit numbers, with and without remainder',
        gens: tag('whole-numbers-division', G3.divide4),
        guide: [g('Divide, multiply, subtract, bring down', '156 \\div 4 = 39', 'Ulitin ang apat na hakbang hanggang maubos ang digits.'), g('Remainder', '17 \\div 5 = 3 \\text{ R } 2', 'Ang natira ay laging mas maliit sa divisor.')] },
      { id: 'e3', title: 'Alin ang Mas Malaki?', icon: 'magnifier', competency: 'Compares fractions with the same numerator or denominator',
        gens: tag('fractions-comparing', E.compareFractions, E.fractionNumberLine), visual: { type: 'pizza', num: 3, den: 8 },
        guide: [g('Pagkumpara', '\\frac{3}{8} < \\frac{5}{8}', 'Kapag pareho ang denominator, mas malaki ang may mas malaking numerator.'), g('Pareho ang numerator', '\\frac{1}{3} > \\frac{1}{5}', 'Kapag pareho ang numerator, mas malaki ang hiwa kung mas kaunti ang hati.')] },
      { id: 'e4', title: 'Pagsasama ng Hiwa', icon: 'plus', competency: 'Adds and subtracts similar fractions in lowest terms',
        gens: tag('fractions-addition-subtraction', E.addSimilar),
        guide: [g('Similar fractions', '\\frac{2}{9} + \\frac{4}{9} = \\frac{6}{9} = \\frac{2}{3}', 'I-add ang numerators, panatilihin ang denominator, tapos i-simplify.')] },
      { id: 'gr3-8', title: 'Area at mga Linya', icon: 'scale', competency: 'Finds areas of squares and rectangles; identifies lines, rays, segments, parallel and perpendicular lines',
        gens: [...tag('measurement-perimeter-area', G3.areaRect), ...tag('geometry-angles', G3.linesGen)],
        guide: [g('Area', 'A = \\text{haba} \\times \\text{lapad}', 'Ang area ay ilang square units ang laman ng hugis.'), g('Mga linya', undefined, 'Parallel: hindi nagtatagpo. Perpendicular: nagtatagpo nang 90°.')] },
      { id: 'gr3-9', title: 'Bar Graph at Timbang', icon: 'chartUp', competency: 'Reads single bar graphs; compares mass (g, kg) and capacity (mL, L)',
        gens: [...tag('statistics-graphs', G3.barGraph), ...tag('measurement-mass-capacity', G3.massCapacity)],
        guide: [g('Bar graph', undefined, 'Sundan ang tuktok ng bar papunta sa numero sa gilid.'), g('Mass at capacity', '1\\text{ kg} = 1000\\text{ g},\\; 1\\text{ L} = 1000\\text{ mL}', 'Gawing pareho ang unit bago ikumpara.')] },
    ],
  },
  // ================================================================ GRADE 4
  {
    id: 'grade4', name: 'Hati-hati sa Pizza', level: 'Grade 4', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 4 · Malalaking Bilang, Fractions, Decimals at Angles',
    icon: 'pizza', color: '#00A6A6', colorDark: '#007F80', soft: '#DDF6F6', tabs: ['basic'],
    stages: [
      { id: 'gr4-1', title: 'Malalaking Bilang', icon: 'blocks', competency: 'Reads and writes numbers up to 1 000 000 in standard and expanded form',
        gens: tag('whole-numbers-place-value', G4.bigNumbers),
        guide: [g('Hanggang milyon', '482{,}316', '4 hundred thousands, 8 ten thousands, 2 thousands, 3 hundreds, 1 ten, 6 ones.')] },
      { id: 'gr4-2', title: 'Multiplication', icon: 'abacus', competency: 'Multiplies 3- to 4-digit numbers by 1-digit, and 2-digit by 2-digit numbers',
        gens: tag('whole-numbers-multiplication', G4.multiDigit),
        guide: [g('Partial products', '23 \\times 14 = 23 \\times 4 + 23 \\times 10', 'I-multiply sa ones, tapos sa tens, tapos i-add.')] },
      { id: 'gr4-3', title: 'Division at MDAS', icon: 'versus', competency: 'Divides up to 4-digit numbers by up to 2-digit numbers; follows the MDAS rules',
        gens: [...tag('whole-numbers-division', G4.longDivision), ...tag('order-of-operations', G4.mdas)],
        guide: [g('MDAS', '2 + 3 \\times 4 = 14', 'Multiplication at Division muna (kaliwa → kanan), saka Addition at Subtraction.')] },
      { id: 'gr4-4', title: 'Factors at Multiples', icon: 'puzzle', competency: 'Finds factors and multiples of numbers up to 100',
        gens: tag('factors-multiples', G4.factorsMultiples),
        guide: [g('Factors', '12: 1, 2, 3, 4, 6, 12', 'Mga numerong naghahati nang walang remainder.'), g('Multiples', '4: 4, 8, 12, 16, \\dots', 'Ang resulta ng pag-multiply sa 1, 2, 3, …')] },
      { id: 'e2', title: 'Magkapantay na Fractions', icon: 'scale', competency: 'Identifies and generates equivalent fractions',
        gens: tag('fractions-equivalent', E.equivalentFraction, E.pizzaChefGen), visual: { type: 'pizza', num: 2, den: 4 },
        guide: [g('Equivalent fractions', '\\frac{1}{2} = \\frac{2}{4} = \\frac{4}{8}', 'I-multiply o i-divide ang itaas at ibaba sa parehong numero — hindi nagbabago ang value.')] },
      { id: 'gr4-6', title: 'Dissimilar Fractions', icon: 'plus', competency: 'Adds and subtracts dissimilar fractions and similar mixed numbers',
        gens: [...tag('fractions-addition-subtraction', G4.dissimilarFractions)],
        guide: [g('LCD muna', '\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}', 'Gawing pareho ang denominator gamit ang LCD, tapos i-add.')] },
      { id: 'e5', title: 'Pizza Party!', icon: 'party', competency: 'Solves word problems involving fractions',
        gens: [...tag('fractions-of-a-number', E.fractionWord), ...tag('fractions-equivalent', E.pizzaChefGen), ...tag('fractions-addition-subtraction', E.addSimilar)],
        guide: [g('Fraction ng isang bilang', '\\frac{2}{3} \\text{ ng } 12 = 8', 'Hatiin sa denominator, i-multiply sa numerator.')] },
      { id: 'gr4-8', title: 'Decimals at Fractions', icon: 'tag', competency: 'Relates decimals (tenths, hundredths) to fractions',
        gens: [...tag('decimals-fractions-conversion', G4.decimalsFractions)], visual: { type: 'bar', num: 7, den: 10 },
        guide: [g('Tenths at hundredths', '0.7 = \\frac{7}{10},\\; 0.25 = \\frac{25}{100}', 'Isang digit pagkatapos ng point = tenths; dalawa = hundredths.')] },
      { id: 'gr4-9', title: 'Angles, Units at Datos', icon: 'target', competency: 'Classifies angles, converts units of length, mass, capacity and time, and reads tables',
        gens: [...tag('geometry-angles', G4.angleType), ...tag('measurement-conversion', G4.convertUnits), ...tag('statistics-graphs', G4.tableRead)],
        guide: [g('Angles', '\\text{acute} < 90^\\circ = \\text{right} < \\text{obtuse}', 'Acute: matulis. Right: sulok ng papel. Obtuse: maluwag.'), g('Conversion', '1\\text{ m} = 100\\text{ cm}', 'Malaki → maliit: i-multiply. Maliit → malaki: i-divide.')] },
    ],
  },
  // ================================================================ GRADE 5
  {
    id: 'grade5', name: 'Karinderya ni Mang Ben', level: 'Grade 5', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 5 · GMDAS, Fractions, Decimals, Area at Probability',
    icon: 'noodles', color: '#6C63FF', colorDark: '#4B42D6', soft: '#ECEBFF', tabs: ['basic'],
    stages: [
      { id: 'gr5-1', title: 'GMDAS', icon: 'steps', competency: 'Applies the GMDAS rules to expressions with grouping symbols',
        gens: tag('order-of-operations', G5.gmdas),
        guide: [g('GMDAS', '(2 + 3) \\times 4 = 20', 'Grouping symbols muna, tapos M/D, saka A/S.')] },
      { id: 'gr5-2', title: 'Divisibility at Prime', icon: 'magnifier', competency: 'Uses divisibility rules; identifies prime and composite numbers',
        gens: tag('factors-multiples', G5.divisibility),
        guide: [g('Divisibility', '3 \\mid 123 \\text{ dahil } 1+2+3 = 6', 'By 3 o 9: tingnan ang sum ng digits. By 5: nagtatapos sa 0 o 5.'), g('Prime', '2, 3, 5, 7, 11, 13', 'Dalawa lang ang factors: 1 at ang sarili.')] },
      { id: 'gr5-3', title: 'Multiply at Divide Fractions', icon: 'pizza', competency: 'Multiplies and divides fractions',
        gens: tag('fractions-multiplication-division', G5.mulDivFractions),
        guide: [g('Multiply', '\\frac{2}{3} \\times \\frac{3}{4} = \\frac{6}{12} = \\frac{1}{2}', 'Itaas × itaas, ibaba × ibaba.'), g('Divide', '\\frac{1}{2} \\div \\frac{1}{4} = \\frac{1}{2} \\times \\frac{4}{1} = 2', 'Keep, change, flip.')] },
      { id: 'gr5-4', title: 'Decimal Place Value', icon: 'blocks', competency: 'Reads, compares and rounds decimals up to ten-thousandths',
        gens: [...tag('decimals-place-value', G5.decimalPlace)],
        guide: [g('Hanggang ten-thousandths', '3.1416', '1 tenths, 4 hundredths, 1 thousandths, 6 ten-thousandths.')] },
      { id: 'gr5-5', title: 'Add at Subtract Decimals', icon: 'plus', competency: 'Adds and subtracts decimal numbers',
        gens: tag('decimals-addition-subtraction', G5.addSubDecimals),
        guide: [g('I-align ang point', '12.5 + 3.75 = 16.25', 'Itapat ang decimal points. Lagyan ng 0 ang kulang.')] },
      { id: 'gr5-6', title: 'Multiply at Divide Decimals', icon: 'abacus', competency: 'Multiplies and divides decimal numbers, including by powers of 10',
        gens: tag('decimals-multiplication-division', G5.mulDivDecimals),
        guide: [g('Bilangin ang decimal places', '1.2 \\times 0.3 = 0.36', 'I-multiply na parang whole number, tapos bilangin ang decimal places.'), g('× at ÷ 10, 100', '4.56 \\times 100 = 456', 'Ilipat ang point pakanan (×) o pakaliwa (÷).')] },
      { id: 'gr5-7', title: 'Area at Surface Area', icon: 'scale', competency: 'Finds the area of parallelograms, triangles and trapezoids and the surface area of prisms',
        gens: [...tag('measurement-perimeter-area', G5.areaPolygons)], visual: { type: 'polygon', sides: 3 },
        guide: [g('Triangle', 'A = \\frac{bh}{2}', 'Kalahati ng parallelogram.'), g('Trapezoid', 'A = \\frac{(b_1 + b_2)h}{2}', 'Average ng dalawang base × taas.')] },
      { id: 'gr5-8', title: 'Probability', icon: 'party', competency: 'Finds the theoretical probability of simple events',
        gens: tag('probability-simple', G5.diceProbability, ST.probabilityGen),
        guide: [g('Probability', 'P = \\frac{\\text{gusto}}{\\text{lahat}}', 'Laging nasa pagitan ng 0 (imposible) at 1 (sigurado).')] },
      { id: 'gr5-9', title: 'Oras at Time Zones', icon: 'clock', competency: 'Converts between 12- and 24-hour time and finds times in other time zones',
        gens: tag('measurement-time', G5.time24), visual: { type: 'clock', h: 9, m: 0 },
        guide: [g('24-hour time', '3{:}00 \\text{ p.m.} = 15{:}00', 'Sa p.m., dagdagan ng 12 ang oras.')] },
    ],
  },
  // ================================================================ GRADE 6
  {
    id: 'grade6', name: 'Hatian ng Barkada', level: 'Grade 6', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 6 · GCF/LCM, Ratio, Percent, Exponents, Bilog at Volume',
    icon: 'blocks', color: '#7CB342', colorDark: '#5A8F25', soft: '#EFF7E3', tabs: ['basic'],
    stages: [
      { id: 'i1', title: 'GCF', icon: 'blocks', competency: 'Finds the greatest common factor of two numbers',
        gens: tag('factors-multiples', I.gcfGen),
        guide: [g('GCF', '\\text{GCF}(12, 18) = 6', 'Ang pinakamalaking factor na pareho nilang mayroon.')] },
      { id: 'i2', title: 'LCM', icon: 'clock', competency: 'Finds the least common multiple and applies it',
        gens: tag('factors-multiples', I.lcmGen),
        guide: [g('LCM', '\\text{LCM}(4, 6) = 12', 'Ang pinakamaliit na multiple na pareho nilang mayroon.')] },
      { id: 'i3', title: 'Ratio', icon: 'versus', competency: 'Expresses ratios in simplest form',
        gens: tag('ratio-proportion', I.ratioSimplify),
        guide: [g('Ratio', '12 : 18 = 2 : 3', 'I-divide ang dalawang numero sa kanilang GCF.')] },
      { id: 'i4', title: 'Proportion', icon: 'scale', competency: 'Solves problems involving direct proportion',
        gens: tag('ratio-proportion', I.proportion),
        guide: [g('Proportion', '\\frac{2}{30} = \\frac{5}{x} \\Rightarrow x = 75', 'Mag-cross multiply, o hanapin muna ang halaga ng isa.')] },
      { id: 'i5', title: 'Decimals at Discount', icon: 'tag', competency: 'Performs operations on decimals and solves percent problems',
        gens: [...tag('decimals-multiplication-division', I.decimalOps), ...tag('percent-applications', I.percentWord)],
        guide: [g('Discount', '₱400 - 25\\% = ₱300', 'Hanapin ang discount, tapos ibawas sa presyo.')] },
      { id: 'gr6-6', title: 'Fraction, Decimal, Percent', icon: 'chartUp', competency: 'Converts among fractions, decimals and percents; reads pie graphs',
        gens: [...tag('decimals-fractions-conversion', G6.fdpConvert), ...tag('statistics-graphs', G6.pieGraph)],
        guide: [g('Tatlong anyo', '\\frac{3}{4} = 0.75 = 75\\%', 'Fraction → decimal: hatiin. Decimal → percent: × 100.')] },
      { id: 'gr6-7', title: 'Exponents', icon: 'stairs', competency: 'Writes and evaluates exponential form; applies GEMDAS',
        gens: tag('exponents-laws', G6.exponents),
        guide: [g('Exponent', '2^5 = 2 \\times 2 \\times 2 \\times 2 \\times 2 = 32', 'Ang base ay inuulit nang ilang beses na sinasabi ng exponent.'), g('GEMDAS', '(1 + 2)^2 - 4 = 5', 'Grouping, Exponents, M/D, A/S.')] },
      { id: 'gr6-8', title: 'Bilog', icon: 'target', competency: 'Finds the circumference and area of a circle',
        gens: tag('geometry-circles', G6.circles), visual: { type: 'polygon', sides: 0 },
        guide: [g('Circumference', 'C = 2\\pi r', 'Ang haba ng palibot ng bilog. π ≈ 3.14.'), g('Area', 'A = \\pi r^2', 'Laging radius ang gamitin — hatiin ang diameter kung kailangan.')] },
      { id: 'gr6-9', title: 'Volume', icon: 'sack', competency: 'Finds the volume of cubes and rectangular prisms',
        gens: tag('measurement-volume', G6.volumePrism),
        guide: [g('Volume', 'V = l \\times w \\times h', 'Ilang cubic units ang kasya sa loob. 1 cu. dm = 1 L.')] },
    ],
  },
  // ================================================================ GRADE 7
  {
    id: 'grade7', name: 'Balanse ng Timbangan', level: 'Grade 7', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 7 · Sets, Integers, Roots, Algebra at Polygons',
    icon: 'scale', color: '#2F6BFF', colorDark: '#1F4FD1', soft: '#E6EEFF', tabs: ['basic', 'algebra'],
    stages: [
      { id: 'gr7-1', title: 'Sets at Venn Diagram', icon: 'puzzle', competency: 'Finds unions and intersections of sets; solves problems with Venn diagrams',
        gens: tag('sets-venn', G7.setsVenn),
        guide: [g('Union at intersection', 'A \\cup B,\\; A \\cap B', '∪: lahat ng nasa A o B. ∩: ang nasa pareho.'), g('Venn diagram', undefined, 'Ilagay muna ang "pareho" sa gitna, tapos ibawas sa bawat bilog.')] },
      { id: 'gr7-2', title: 'Integers', icon: 'plusMinus', competency: 'Performs the four operations on integers; uses absolute value',
        gens: tag('integers-operations', G7.integers),
        guide: [g('Signs', '(-3)(-4) = 12,\\; (-3)(4) = -12', 'Parehong sign → positive. Magkaiba → negative.'), g('Pagbawas', '5 - (-2) = 5 + 2 = 7', 'Ang pagbawas ng negative ay pagdagdag.')] },
      { id: 'gr7-3', title: 'Roots at Irrational Numbers', icon: 'sunflower', competency: 'Finds square and cube roots; recognizes irrational numbers',
        gens: tag('square-roots-radicals', G7.roots),
        guide: [g('Square root', '\\sqrt{49} = 7', 'Anong numero ang × sa sarili?'), g('Irrational', '\\sqrt{2} = 1.41421356\\dots', 'Hindi natatapos at hindi umuulit ang decimal.')] },
      { id: 'gr7-4', title: 'Scientific Notation', icon: 'spiral', competency: 'Writes and reads numbers in scientific notation',
        gens: tag('scientific-notation', G7.sciNotation),
        guide: [g('Scientific notation', '45{,}000 = 4.5 \\times 10^4', 'Isang digit (1–9) bago ang point, × power ng 10.')] },
      { id: 'j1', title: 'Palitan ang x', icon: 'swap', competency: 'Evaluates algebraic expressions for given values',
        gens: tag('algebraic-expressions', J.evaluateExpr),
        guide: [g('Variable', '2x + 5', 'Ang x ay numerong hindi pa natin alam. Palitan ito ng value para ma-evaluate.')] },
      { id: 'j2', title: 'Isang Hakbang', icon: 'steps', competency: 'Solves simple (one-step) linear equations',
        gens: tag('linear-equations-one-variable', J.oneStep), visual: { type: 'scale', left: 'x+3', right: '8' },
        guide: [g('Balanse ang equation', 'x + 7 = 12 \\Rightarrow x = 5', 'Kung ano ang ginawa mo sa kaliwa, gawin din sa kanan — parang timbangan.')] },
      { id: 'j4', title: 'Salita → Simbolo', icon: 'puzzle', competency: 'Translates verbal phrases into algebraic expressions',
        gens: tag('algebraic-expressions', J.translateTiles),
        guide: [g('Salita → simbolo', '\\text{kabuuan} \\to +,\\; \\text{produkto} \\to \\times', '“Mas kaunti sa” ay minus, “quotient” ay division.')] },
      { id: 'gr7-8', title: 'Polygons', icon: 'target', competency: 'Finds interior angle sums and the number of sides of polygons',
        gens: tag('geometry-triangles-polygons', G7.polygonAngles), visual: { type: 'polygon', sides: 6 },
        guide: [g('Sum ng interior angles', 'S = (n - 2) \\times 180^\\circ', 'Hatiin ang polygon sa triangles mula sa isang sulok.')] },
      { id: 'gr7-9', title: 'Rates, Formula at Volume', icon: 'jeep', competency: 'Uses rates, rearranges formulas, and finds the volume of cylinders and pyramids',
        gens: [...tag('ratio-proportion', G7.ratesFormulas)],
        guide: [g('Rate', '\\text{speed} = \\frac{\\text{distance}}{\\text{time}}', 'Dami bawat isang unit (km bawat oras, piso bawat kilo).'), g('Cylinder', 'V = \\pi r^2 h', 'Area ng base × taas.')] },
    ],
  },
  // ================================================================ GRADE 8
  {
    id: 'grade8', name: 'Jeep at Negosyo', level: 'Grade 8', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 8 · Polynomials, Factoring, Linear Equations, Pythagoras at Datos',
    icon: 'jeep', color: '#FF6B3D', colorDark: '#D94E22', soft: '#FFEBE3', tabs: ['basic', 'algebra'],
    stages: [
      { id: 'j3', title: 'Dalawang Hakbang', icon: 'stairs', competency: 'Solves linear equations in one variable',
        gens: tag('linear-equations-one-variable', J.twoStep),
        guide: [g('Dalawang hakbang', '3x + 4 = 19', 'Una, alisin ang +4. Pangalawa, i-divide sa 3. Sagot: x = 5.')] },
      { id: 'j5', title: 'Jeep, Load, Tindahan', icon: 'jeep', competency: 'Solves real-life problems using linear equations',
        gens: tag('linear-equations-one-variable', J.linearWord, J.twoStep),
        guide: [g('Word problem → equation', '13 + 2.5x = 23', 'Ano ang hindi alam? Iyan ang x. Isulat ang equation, tapos i-solve.')] },
      { id: 'gr8-3', title: 'Polynomials', icon: 'blocks', competency: 'Adds, subtracts and multiplies polynomials',
        gens: tag('polynomials-operations', G8.polynomials),
        guide: [g('Like terms', '3x + 5x = 8x', 'Pareho ang variable at exponent → puwedeng pagsamahin.'), g('FOIL', '(x + 2)(x + 3) = x^2 + 5x + 6', 'First, Outer, Inner, Last.')] },
      { id: 'gr8-4', title: 'Special Products at Factoring', icon: 'puzzle', competency: 'Uses special products and factors polynomials completely',
        gens: tag('special-products-factoring', G8.specialProducts),
        guide: [g('Square of a binomial', '(a + b)^2 = a^2 + 2ab + b^2', 'Huwag kalimutan ang 2ab!'), g('Difference of squares', 'a^2 - b^2 = (a + b)(a - b)', 'Dalawang perfect squares na pinagbabawas.')] },
      { id: 'gr8-5', title: 'Rational Expressions', icon: 'swap', competency: 'Simplifies and evaluates rational algebraic expressions',
        gens: tag('rational-expressions', G8.rationalExpr),
        guide: [g('I-factor, i-cancel', '\\frac{x^2 - 9}{x - 3} = x + 3', 'I-factor ang itaas at ibaba, tapos i-cancel ang magkaparehong factor.')] },
      { id: 'gr8-6', title: 'Linear Inequalities', icon: 'versus', competency: 'Solves linear inequalities in one variable',
        gens: tag('linear-inequalities', G8.linearIneq),
        guide: [g('Baligtarin ang sign', '-2x < 6 \\Rightarrow x > -3', 'Kapag nag-multiply o nag-divide sa NEGATIVE, baligtarin ang inequality.')] },
      { id: 'gr8-7', title: 'Slope, Distance at Midpoint', icon: 'chartUp', competency: 'Finds slope, intercepts, distance and midpoint on the Cartesian plane',
        gens: [...tag('linear-equations-two-variables', G8.coordinate)],
        guide: [g('Slope', 'm = \\frac{y_2 - y_1}{x_2 - x_1}', 'Rise over run.'), g('Distance', 'd = \\sqrt{(\\Delta x)^2 + (\\Delta y)^2}', 'Pythagorean theorem sa coordinate plane.')] },
      { id: 'gr8-8', title: 'Systems of Equations', icon: 'scale', competency: 'Solves systems of linear equations in two variables',
        gens: tag('systems-of-equations', G8.systems),
        guide: [g('Elimination', '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}', 'I-add ang equations: 2x = 6, x = 3, kaya y = 2.')] },
      { id: 'gr8-9', title: 'Pythagorean Theorem', icon: 'stairs', competency: 'Applies the Pythagorean theorem and the triangle inequality',
        gens: tag('geometry-pythagorean', G8.pythagorean), visual: { type: 'rightTriangle', a: '3', b: '4', c: '5' },
        guide: [g('Pythagorean theorem', 'a^2 + b^2 = c^2', 'Sa right triangle lang. Ang c ang hypotenuse — ang katapat ng right angle.')] },
      { id: 'gr8-10', title: 'Datos at Pagbilang', icon: 'chartUp', competency: 'Finds measures of central tendency and variability; uses the counting principle',
        gens: [...tag('statistics-mean-median-mode', ST.meanGen, ST.medianGen), ...tag('statistics-variability', G8.variability)],
        guide: [g('Mean, median, mode', '\\bar{x} = \\frac{\\sum x}{n}', 'Mean: average. Median: gitna. Mode: pinakamadalas.'), g('Range', '\\text{range} = \\max - \\min', 'Gaano kalat ang datos.')] },
      { id: 'gr8-11', title: 'Tubo, Lugi at Best Buy', icon: 'tag', competency: 'Solves problems on profit and loss, best buys and buying on terms',
        gens: tag('consumer-math', G8.consumerMath), visual: { type: 'scene', icons: ['store', 'tag', 'coins'] },
        guide: [g('Tubo o lugi', '\\text{tubo} = \\text{benta} - \\text{puhunan}', 'Kapag negative, lugi.'), g('Best buy', '\\text{unit price} = \\frac{\\text{presyo}}{\\text{dami}}', 'Mas mababang unit price = mas sulit.')] },
      { id: 'gr8-12', title: 'Sequences', icon: 'spiral', competency: 'Finds terms of arithmetic and geometric sequences',
        gens: [...tag('sequences-arithmetic', C.nextTerm, C.nthTermFormula), ...tag('sequences-geometric', G8.geometricSeq)],
        guide: [g('Arithmetic', 'a_n = a_1 + (n - 1)d', 'Pare-pareho ang difference.'), g('Geometric', 'a_n = a_1 r^{n-1}', 'Pare-pareho ang ratio.')] },
    ],
  },
  // ================================================================ GRADE 9
  {
    id: 'grade9', name: 'Kurba ng Bola', level: 'Grade 9', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 9 · Functions, Quadratics, Variation, Trigonometry at Probability',
    icon: 'target', color: '#E64A8A', colorDark: '#B8326A', soft: '#FDE5EF', tabs: ['basic', 'algebra'],
    stages: [
      { id: 'gr9-1', title: 'Relations at Functions', icon: 'swap', competency: 'Distinguishes functions from relations and evaluates functions',
        gens: tag('functions-relations', G9.functionsGen),
        guide: [g('Function', 'f(x) = 2x + 1', 'Bawat x ay may IISANG y.')] },
      { id: 'gr9-2', title: 'Linear Functions', icon: 'chartUp', competency: 'Finds the slope, intercepts and zero of a linear function',
        gens: tag('linear-equations-two-variables', G9.linearFunction),
        guide: [g('Slope-intercept form', 'f(x) = mx + b', 'm = slope, b = y-intercept. Ang zero ay kung saan f(x) = 0.')] },
      { id: 'g1', title: 'Quadratic Function', icon: 'chartUp', competency: 'Evaluates quadratic functions',
        gens: tag('quadratic-functions', G9.evalQuad),
        guide: [g('Standard form', 'f(x) = ax^2 + bx + c', 'Unahin ang exponent kapag nag-substitute.')] },
      { id: 'g2', title: 'Factoring', icon: 'puzzle', competency: 'Solves quadratic equations by factoring',
        gens: tag('quadratic-equations', G9.factorRoots),
        guide: [g('Factoring', 'x^2 - 5x + 6 = (x - 2)(x - 3)', 'Dalawang numero na ang product ay c at ang sum ay b.')] },
      { id: 'g3', title: 'Discriminant', icon: 'magnifier', competency: 'Uses the discriminant to describe the nature of roots',
        gens: tag('quadratic-equations', G9.discriminant),
        guide: [g('Discriminant', 'D = b^2 - 4ac', 'D > 0: dalawang roots, D = 0: isa, D < 0: walang real root.')] },
      { id: 'g4', title: 'Sum at Product', icon: 'plus', competency: 'Relates coefficients to the sum and product of roots',
        gens: tag('quadratic-equations', G9.sumProduct),
        guide: [g('Sum at product', 'r_1 + r_2 = -\\frac{b}{a},\\; r_1 r_2 = \\frac{c}{a}', 'Makukuha mo agad kahit hindi i-solve.')] },
      { id: 'g5', title: 'Taniman ni Mang Tonyo', icon: 'sunflower', competency: 'Solves problems involving quadratic equations',
        gens: tag('quadratic-equations', G9.quadWord, G9.factorRoots),
        guide: [g('Word problem', 'x(x + 3) = 40', 'Gawing standard form, i-factor, at piliin ang root na may saysay (walang negative na haba).')] },
      { id: 'gr9-8', title: 'Variation', icon: 'scale', competency: 'Solves problems involving direct and inverse variation',
        gens: tag('variation', G9.variationGen),
        guide: [g('Direct', 'y = kx', 'Lumalaki ang x, lumalaki ang y.'), g('Inverse', 'y = \\frac{k}{x}', 'Lumalaki ang x, lumiliit ang y.')] },
      { id: 'gr9-9', title: 'Parallel Lines at Similarity', icon: 'steps', competency: 'Finds angles formed by parallel lines and a transversal; uses similar triangles',
        gens: [...tag('geometry-angles', G9.transversalSimilar)],
        guide: [g('Transversal', undefined, 'Corresponding at alternate angles: magkapantay. Same-side interior: 180°.'), g('Similar triangles', '\\frac{a}{a\'} = \\frac{b}{b\'}', 'Proportional ang katapat na sides.')] },
      { id: 'gr9-10', title: 'Trigonometric Ratios', icon: 'target', competency: 'Uses the six trigonometric ratios and special right triangles',
        gens: tag('trigonometry-right-triangles', G9.trigRatios), visual: { type: 'rightTriangle', a: 'adj', b: 'opp', c: 'hyp', angle: 'θ' },
        guide: [g('SOH-CAH-TOA', '\\sin\\theta = \\frac{opp}{hyp},\\; \\cos\\theta = \\frac{adj}{hyp},\\; \\tan\\theta = \\frac{opp}{adj}', 'Tukuyin muna kung aling side ang opposite, adjacent at hypotenuse.')] },
      { id: 'gr9-11', title: 'Compound Events', icon: 'party', competency: 'Finds probabilities of compound events',
        gens: tag('probability-compound', G9.compoundProb),
        guide: [g('AT (independent)', 'P(A \\cap B) = P(A) \\cdot P(B)', 'I-multiply.'), g('Complement', 'P(\\text{hindi } A) = 1 - P(A)', 'Ibawas sa 1.')] },
    ],
  },
  // ================================================================ GRADE 10
  {
    id: 'grade10', name: 'Bilog at Pagkakataon', level: 'Grade 10', tier: 'grade',
    curriculum: 'DepEd MATATAG Grade 10 · Inequalities, Radicals, Circles, Interest, Trigonometry at Statistics',
    icon: 'spiral', color: '#0E8C9B', colorDark: '#0A6B77', soft: '#DDF3F5', tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 'gr10-1', title: 'Quadratic Inequalities', icon: 'versus', competency: 'Solves quadratic inequalities in one variable',
        gens: tag('quadratic-inequalities', G10.quadIneq),
        guide: [g('Sa pagitan o sa labas', 'x^2 - 5x + 6 < 0 \\Rightarrow 2 < x < 3', 'Hanapin ang roots. < 0: sa pagitan. > 0: sa labas.')] },
      { id: 'gr10-2', title: 'Absolute Value', icon: 'plusMinus', competency: 'Solves absolute value equations',
        gens: tag('absolute-value', G10.absValue),
        guide: [g('Dalawang kaso', '|x - 2| = 5 \\Rightarrow x = 7 \\text{ o } x = -3', 'Ang loob ay puwedeng +5 o −5.')] },
      { id: 'gr10-3', title: 'Radicals', icon: 'sunflower', competency: 'Simplifies and adds radical expressions',
        gens: tag('square-roots-radicals', G10.radicals),
        guide: [g('Perfect square factor', '\\sqrt{72} = \\sqrt{36 \\cdot 2} = 6\\sqrt{2}', 'Ilabas ang square root ng perfect square.')] },
      { id: 'gr10-4', title: 'Equation ng Bilog', icon: 'target', competency: 'Finds the center and radius from the equation of a circle',
        gens: tag('geometry-coordinate', G10.circleEquation),
        guide: [g('Center-radius form', '(x - h)^2 + (y - k)^2 = r^2', 'Center (h, k), radius r. Mag-ingat sa signs!')] },
      { id: 'gr10-5', title: 'Interest at Depreciation', icon: 'bank', competency: 'Computes compound interest and depreciation',
        gens: [...tag('business-interest', S.compoundInterest, G10.depreciation)],
        guide: [g('Compound interest', 'F = P\\left(1 + \\frac{r}{m}\\right)^{mt}', 'Kumikita rin ng interest ang interest.'), g('Depreciation', 'V = P(1 - r)^t', 'Bumababa ang halaga bawat taon.')] },
      { id: 'gr10-6', title: 'Law of Sines at Cosines', icon: 'stairs', competency: 'Solves triangles using the laws of sines and cosines',
        gens: tag('trigonometry-oblique', G10.lawSinesCosines),
        guide: [g('Law of sines', '\\frac{a}{\\sin A} = \\frac{b}{\\sin B}', 'Kapag may alam kang side at katapat na angle.'), g('Law of cosines', 'c^2 = a^2 + b^2 - 2ab\\cos C', 'Kapag dalawang side at ang angle sa pagitan nila.')] },
      { id: 'gr10-7', title: 'Arcs at Sectors', icon: 'pizza', competency: 'Finds central and inscribed angles, arc lengths and sector areas',
        gens: tag('geometry-circles', G10.circleParts), visual: { type: 'pizza', num: 1, den: 6 },
        guide: [g('Inscribed angle', '\\angle = \\frac{1}{2}\\text{arc}', 'Kalahati ng intercepted arc.'), g('Sector', 'A = \\frac{\\theta}{360^\\circ}\\pi r^2', 'Bahagi ng buong bilog.')] },
      { id: 'gr10-8', title: 'Quartiles at IQR', icon: 'chartUp', competency: 'Finds quartiles and the interquartile range',
        gens: tag('statistics-measures-of-position', G10.quartiles),
        guide: [g('Quartiles', 'Q_1,\\; Q_2,\\; Q_3', 'Q₂ ang median. Q₁ at Q₃ ang median ng lower at upper half.'), g('IQR', 'IQR = Q_3 - Q_1', 'Gaano kalat ang gitnang 50% ng datos.')] },
      { id: 'gr10-9', title: 'Union at Intersection', icon: 'puzzle', competency: 'Finds probabilities of unions, intersections and complements of events',
        gens: tag('probability-compound', G10.unionEvents),
        guide: [g('Addition rule', 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)', 'Ibawas ang "pareho" para hindi mabilang nang dalawang beses.')] },
    ],
  },
  // ================================================================ SHS / COLLEGE SAMPLER
  {
    id: 'shs', name: 'Ipon Challenge', level: 'SHS General Math', tier: 'sampler',
    curriculum: 'DepEd SHS General Mathematics · Business Math — Interest',
    icon: 'coins', color: '#3DBE6B', colorDark: '#2A9A51', soft: '#E3F8EA', tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 's1', title: 'Percent Power', icon: 'tag', competency: 'Computes percentages in real-life contexts',
        gens: tag('percent-of-a-number', S.percentOf),
        guide: [g('Percent', '25\\% = 0.25', 'I-divide sa 100 para gawing decimal bago i-multiply.')] },
      { id: 's2', title: 'Simple Interest', icon: 'bank', competency: 'Computes simple interest (I = Prt)',
        gens: tag('business-interest', S.simpleInterest),
        guide: [g('Simple interest', 'I = Prt', 'P = principal, r = rate kada taon (decimal), t = taon.')] },
      { id: 's3', title: 'Maturity Value', icon: 'calendar', competency: 'Computes maturity value under simple interest',
        gens: tag('business-interest', S.maturitySimple),
        guide: [g('Maturity value', 'F = P(1 + rt)', 'Ang kabuuang babayaran o matatanggap: principal + interest.')] },
      { id: 's4', title: 'Compound Interest', icon: 'chartUp', competency: 'Computes compound interest and future value',
        gens: tag('business-interest', S.compoundInterest),
        guide: [g('Compound interest', 'F = P(1 + r)^{t}', 'Kumikita rin ng interest ang interest — kaya mas mabilis lumaki.')] },
      { id: 's5', title: 'Simple vs Compound', icon: 'versus', competency: 'Compares simple and compound interest',
        gens: tag('business-interest', S.simpleVsCompound, S.compoundInterest),
        guide: [g('Paghambingin', 'P(1 + r)^t > P(1 + rt)', 'Pagkalipas ng 1 taon, mas malaki laging ang compound.')] },
    ],
  },
  {
    id: 'genmath', name: 'Functions at Logic', level: 'SHS General Math', tier: 'sampler',
    curriculum: 'DepEd SHS General Mathematics · Functions, Exponentials, Annuities at Logic',
    icon: 'puzzle', color: '#B7791F', colorDark: '#8F5D12', soft: '#FBF0DC', tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 'gm1', title: 'Composition of Functions', icon: 'swap', competency: 'Performs operations on functions, including composition',
        gens: tag('functions-relations', GM.composeFunctions),
        guide: [g('Composition', '(f \\circ g)(x) = f(g(x))', 'Unahin ang nasa loob (g), tapos ipasok ang sagot sa f.')] },
      { id: 'gm2', title: 'Exponential Equations', icon: 'stairs', competency: 'Solves exponential equations',
        gens: tag('exponential-logarithmic', GM.exponentialEq),
        guide: [g('Parehong base', '2^{x+1} = 32 = 2^5 \\Rightarrow x = 4', 'Kapag pareho ang base, magkapantay ang exponents.')] },
      { id: 'gm3', title: 'Logarithms', icon: 'magnifier', competency: 'Evaluates logarithms and converts between logarithmic and exponential form',
        gens: tag('exponential-logarithmic', GM.logarithms),
        guide: [g('Log', '\\log_2 8 = 3 \\iff 2^3 = 8', 'Ang log ay ang exponent.')] },
      { id: 'gm4', title: 'Annuities', icon: 'bank', competency: 'Computes the future value of a simple ordinary annuity',
        gens: tag('business-annuities', GM.annuity),
        guide: [g('Future value', 'F = R\\cdot\\frac{(1 + j)^n - 1}{j}', 'Pare-parehong hulog (R) sa katapusan ng bawat period.')] },
      { id: 'gm5', title: 'Propositions', icon: 'bulb', competency: 'Determines the truth value of compound propositions',
        gens: tag('logic-propositions', GM.propositions),
        guide: [g('Connectives', 'p \\land q,\\; p \\lor q,\\; p \\to q', 'AND: parehong true. OR: kahit isa. →: false lang kapag T → F.')] },
    ],
  },
  {
    id: 'stats', name: 'Datos ng Barangay', level: 'SHS Stats & Probability', tier: 'sampler',
    curriculum: 'DepEd SHS Statistics & Probability · Data & Chance',
    icon: 'chartUp', color: '#1F9BD1', colorDark: '#167AA6', soft: '#E0F3FB', tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 't1', title: 'Mean', icon: 'chartUp', competency: 'Computes the mean of a data set',
        gens: tag('statistics-mean-median-mode', ST.meanGen),
        guide: [g('Mean', '\\bar{x} = \\frac{\\sum x}{n}', 'I-add lahat, i-divide sa dami.')] },
      { id: 't2', title: 'Median', icon: 'blocks', competency: 'Finds the median of a data set',
        gens: tag('statistics-mean-median-mode', ST.medianGen),
        guide: [g('Median', '1, 3, \\underline{5}, 8, 9', 'Ang nasa gitna kapag naka-ayos na.')] },
      { id: 't3', title: 'Mode', icon: 'target', competency: 'Identifies the mode of a data set',
        gens: tag('statistics-mean-median-mode', ST.modeGen),
        guide: [g('Mode', '2, \\underline{5}, \\underline{5}, 7, 9', 'Ang pinakamadalas lumabas.')] },
      { id: 't4', title: 'Probability', icon: 'party', competency: 'Computes the probability of simple events',
        gens: tag('probability-simple', ST.probabilityGen),
        guide: [g('Probability', 'P = \\frac{\\text{gusto}}{\\text{lahat}}', 'Laging nasa pagitan ng 0 at 1.')] },
      { id: 't5', title: 'z-Score', icon: 'medal', competency: 'Computes and interprets z-scores of a normal distribution',
        gens: [...tag('statistics-z-scores', ST.zScore), ...tag('statistics-mean-median-mode', ST.meanGen)],
        guide: [g('z-score', 'z = \\frac{x - \\mu}{\\sigma}', 'Ilang standard deviation ang layo mo sa mean.')] },
    ],
  },
  {
    id: 'stem', name: 'Bilis ng Pagbabago', level: 'SHS STEM', tier: 'sampler',
    curriculum: 'DepEd SHS STEM · Pre-Calculus at Basic Calculus',
    icon: 'bolt', color: '#E53935', colorDark: '#B71C1C', soft: '#FDE4E4', tabs: ['basic', 'algebra', 'advanced', 'calculus'],
    stages: [
      { id: 'st1', title: 'Conic Sections', icon: 'target', competency: 'Identifies conic sections and reads their key features',
        gens: tag('conic-sections', STEM.conics),
        guide: [g('Apat na conic', '\\text{circle, ellipse, parabola, hyperbola}', 'Tingnan kung aling variable ang squared at ang sign sa pagitan.')] },
      { id: 'st2', title: 'Unit Circle', icon: 'spiral', competency: 'Converts degrees and radians; finds exact trigonometric values',
        gens: tag('trigonometry-unit-circle', STEM.unitCircle),
        guide: [g('Radians', '180^\\circ = \\pi', 'I-multiply sa π/180 para maging radians.')] },
      { id: 'st3', title: 'Limits', icon: 'steps', competency: 'Evaluates limits by substitution and by factoring',
        gens: tag('calculus-limits', STEM.limits),
        guide: [g('Limit', '\\lim_{x \\to 2}\\frac{x^2 - 4}{x - 2} = 4', 'Kapag 0/0, i-factor at i-cancel, tapos i-substitute.')] },
      { id: 'st4', title: 'Derivatives', icon: 'chartUp', competency: 'Differentiates polynomials using the power rule',
        gens: tag('calculus-derivatives', STEM.derivatives),
        guide: [g('Power rule', '\\frac{d}{dx}x^n = nx^{n-1}', 'Ibaba ang exponent, bawasan ng 1.')] },
      { id: 'st5', title: 'Integrals', icon: 'blocks', competency: 'Evaluates definite integrals of polynomials',
        gens: tag('calculus-integrals', STEM.integrals),
        guide: [g('Definite integral', '\\int_a^b f(x)\\,dx = F(b) - F(a)', 'Kunin ang antiderivative, tapos ibawas ang value sa a mula sa value sa b.')] },
    ],
  },
  {
    id: 'college', name: 'Sipnayan sa Kalikasan', level: 'College GE', tier: 'sampler',
    curriculum: 'CHED GE · Mathematics in the Modern World — Patterns in Nature',
    icon: 'sunflower', color: '#9B5DE5', colorDark: '#7B3FC4', soft: '#F2EAFD', tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 'c1', title: 'Hanapin ang Pattern', icon: 'blocks', competency: 'Identifies patterns in sequences',
        gens: tag('sequences-arithmetic', C.nextTerm), visual: { type: 'sequence', items: ['1', '1', '2', '3', '5', '8', null] },
        guide: [g('Arithmetic sequence', 'a_n = a_1 + (n-1)d', 'Pare-pareho ang difference d sa pagitan ng magkasunod na terms.')] },
      { id: 'c2', title: 'Fibonacci', icon: 'spiral', competency: 'Recognizes the Fibonacci sequence in nature',
        gens: tag('patterns-in-nature', C.fibonacciNext),
        guide: [g('Fibonacci', 'F_n = F_{n-1} + F_{n-2}', '1, 1, 2, 3, 5, 8, 13… makikita sa sunflower, pinya, at kabibe.')] },
      { id: 'c3', title: 'Formula ng nth Term', icon: 'abacus', competency: 'Writes the general term of an arithmetic sequence',
        gens: tag('sequences-arithmetic', C.nthTermFormula),
        guide: [g('General term', 'a_n = 3n + 2', 'Ang d ang coefficient ng n.')] },
      { id: 'c4', title: 'Golden Ratio', icon: 'sunflower', competency: 'Relates the Fibonacci sequence to the golden ratio',
        gens: tag('patterns-in-nature', C.goldenRatio, C.fibonacciNext),
        guide: [g('Golden ratio', '\\varphi = \\frac{1+\\sqrt{5}}{2} \\approx 1.618', 'Ang ratio ng magkasunod na Fibonacci numbers ay lumalapit sa φ.')] },
      { id: 'c5', title: 'Hilera ng Pinya', icon: 'pineapple', competency: 'Computes the sum of an arithmetic series',
        gens: tag('sequences-arithmetic', C.seriesSum, C.nextTerm),
        guide: [g('Arithmetic series', 'S_n = \\frac{n}{2}(a_1 + a_n)', 'Ipares ang una at huli — pareho ang sum ng bawat pares.')] },
    ],
  },
  {
    id: 'mmw', name: 'Math sa Modernong Mundo', level: 'College GE', tier: 'sampler',
    curriculum: 'CHED GE · Mathematics in the Modern World — Codes, Voting, Graphs at Data',
    icon: 'book', color: '#5C6BC0', colorDark: '#3F4BA0', soft: '#E8EAF6', tabs: ['basic', 'algebra', 'advanced'],
    stages: [
      { id: 'mm1', title: 'Check Digits', icon: 'scanCheck', competency: 'Uses modular arithmetic to compute ISBN and UPC check digits',
        gens: tag('number-codes', GM.checkDigits),
        guide: [g('Check digit', '\\text{sum} \\equiv 0 \\pmod{10}', 'Ang huling digit ay pinipili para ang weighted sum ay divisible — para mahuli ang typo.')] },
      { id: 'mm2', title: 'Voting Methods', icon: 'versus', competency: 'Determines winners using plurality and Borda count',
        gens: tag('voting-apportionment', GM.voting),
        guide: [g('Plurality vs Borda', undefined, 'Plurality: pinakamaraming 1st choice. Borda: puntos sa bawat ranggo.')] },
      { id: 'mm3', title: 'Graph Theory', icon: 'jeep', competency: 'Applies the handshake lemma and finds Euler paths and circuits',
        gens: tag('graph-theory', GM.graphTheory),
        guide: [g('Euler', undefined, '0 odd-degree vertices: circuit. 2: path lang. Higit pa: wala.'), g('Handshake lemma', '\\sum \\deg = 2E', 'Bawat edge ay may dalawang dulo.')] },
      { id: 'mm4', title: 'Correlation at Regression', icon: 'chartUp', competency: 'Interprets correlation and predicts with a regression line',
        gens: tag('statistics-regression', GM.regression),
        guide: [g('Regression line', '\\hat{y} = mx + b', 'Ipasok ang x para hulaan ang y.'), g('Correlation', '-1 \\le r \\le 1', 'Malapit sa ±1: malakas. Malapit sa 0: mahina.')] },
      { id: 'mm5', title: 'Pera sa Modernong Mundo', icon: 'bank', competency: 'Applies interest and annuity formulas to savings decisions',
        gens: [...tag('business-annuities', GM.annuity), ...tag('business-interest', S.compoundInterest)],
        guide: [g('Ipon sa paglipas ng panahon', 'F = R\\cdot\\frac{(1 + j)^n - 1}{j}', 'Maliit pero regular na ipon + compound interest = malaking halaga.')] },
    ],
  },
]

/** Legacy world ids (one island per band, before one island per grade) → the grade island they map to */
export const LEGACY_WORLD: Record<string, string> = {
  primary: 'grade2', elem: 'grade4', inter: 'grade6', jhs: 'grade7', g9: 'grade9',
}
export const DEFAULT_WORLD = 'grade4'
export const worldIdOrDefault = (id: unknown): string => {
  const s = String(id ?? '')
  if (WORLDS.some((w) => w.id === s)) return s
  return Object.hasOwn(LEGACY_WORLD, s) ? LEGACY_WORLD[s] : DEFAULT_WORLD // hasOwn: '__proto__' from a backup file must not resolve
}

export const QUESTIONS_PER_LESSON = 6

/** Six questions drawn round-robin from the stage's generators; each carries its topic tag. */
export function buildLesson(stage: Stage): Question[] {
  const order = shuffle(Array.from({ length: QUESTIONS_PER_LESSON }, (_, i) => stage.gens[i % stage.gens.length]))
  return order.map((t) => {
    const q = t.make()
    return { ...q, topic: q.topic ?? t.topic }
  })
}

export const findStage = (stageId: string) => {
  for (const w of WORLDS) {
    const s = w.stages.find((x) => x.id === stageId)
    if (s) return { world: w, stage: s, index: w.stages.indexOf(s) }
  }
  return null
}
