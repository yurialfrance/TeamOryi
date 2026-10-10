// One topic taxonomy for everything a learner answers — Landas stages, Tagisan ng Talino, Sari-Sari
// Cashier, Nerdle — so the assessment reports (src/report) can group results by topic and strand.
// Labels are report-facing Taglish, written for a parent or teacher who has never opened the app.
// grades: DepEd grade range where the topic is taught (11–12 = SHS, 13 = college).

export type Strand =
  | 'numbers'
  | 'operations'
  | 'fractions'
  | 'decimals'
  | 'percent-ratio'
  | 'money'
  | 'integers-exponents'
  | 'algebra'
  | 'geometry'
  | 'measurement'
  | 'statistics-probability'
  | 'patterns-sequences'
  | 'business-math'
  | 'calculus'
  | 'logic'

export const STRANDS: Record<Strand, string> = {
  numbers: 'Bilang at Place Value',
  operations: 'Operasyon (Add, Subtract, Multiply, Divide)',
  fractions: 'Fractions',
  decimals: 'Decimals',
  'percent-ratio': 'Percent, Ratio at Proportion',
  money: 'Pera at Sukli',
  'integers-exponents': 'Integers, Exponents at Radicals',
  algebra: 'Algebra',
  geometry: 'Geometry',
  measurement: 'Measurement',
  'statistics-probability': 'Statistics at Probability',
  'patterns-sequences': 'Patterns at Sequences',
  'business-math': 'Business Math',
  calculus: 'Calculus',
  logic: 'Sets, Logic at Desisyon',
}

export interface TopicInfo { strand: Strand; label: string; grades: readonly [number, number] }

const t = (strand: Strand, label: string, from: number, to: number): TopicInfo => ({ strand, label, grades: [from, to] })

export const TOPICS = {
  // numbers
  'whole-numbers-counting': t('numbers', 'Pagbilang, ordinal numbers at pagbasa ng numero', 1, 4),
  'whole-numbers-place-value': t('numbers', 'Place value ng whole numbers', 1, 4),
  'whole-numbers-comparing': t('numbers', 'Paghahambing at pagsusunod-sunod ng numero', 1, 3),
  'whole-numbers-rounding': t('numbers', 'Pag-round off at pagtantiya (estimation)', 2, 4),
  'factors-multiples': t('numbers', 'Factors, multiples, prime numbers, GCF at LCM', 4, 6),
  'number-codes': t('numbers', 'Modular arithmetic at codes (ISBN, UPC)', 13, 13),
  // operations
  'whole-numbers-addition': t('operations', 'Pagdaragdag ng whole numbers', 1, 4),
  'whole-numbers-subtraction': t('operations', 'Pagbabawas ng whole numbers', 1, 4),
  'whole-numbers-multiplication': t('operations', 'Pagpaparami (multiplication)', 2, 5),
  'whole-numbers-division': t('operations', 'Paghahati (division)', 2, 5),
  'mixed-operations': t('operations', 'Halo-halong operasyon', 3, 6),
  'order-of-operations': t('operations', 'Order of operations (GEMDAS)', 5, 7),
  // fractions
  'fractions-concept': t('fractions', 'Kahulugan ng fraction (bahagi ng buo)', 1, 4),
  'fractions-equivalent': t('fractions', 'Equivalent fractions at lowest terms', 3, 5),
  'fractions-comparing': t('fractions', 'Paghahambing ng fractions', 3, 5),
  'fractions-addition-subtraction': t('fractions', 'Pagdaragdag at pagbabawas ng fractions', 3, 6),
  'fractions-multiplication-division': t('fractions', 'Pagpaparami at paghahati ng fractions', 5, 6),
  'fractions-of-a-number': t('fractions', 'Fraction ng isang bilang', 3, 6),
  'fractions-mixed-numbers': t('fractions', 'Mixed numbers at improper fractions', 4, 6),
  // decimals
  'decimals-place-value': t('decimals', 'Place value at pagbasa ng decimals', 4, 5),
  'decimals-addition-subtraction': t('decimals', 'Pagdaragdag at pagbabawas ng decimals', 4, 6),
  'decimals-multiplication-division': t('decimals', 'Pagpaparami at paghahati ng decimals', 5, 6),
  'decimals-rounding': t('decimals', 'Pag-round off ng decimals', 4, 6),
  'decimals-fractions-conversion': t('decimals', 'Pag-convert ng fraction, decimal at percent', 5, 7),
  // percent & ratio
  'percent-of-a-number': t('percent-ratio', 'Percent ng isang bilang', 5, 11),
  'percent-applications': t('percent-ratio', 'Discount, tubo at percent increase/decrease', 6, 8),
  'ratio-proportion': t('percent-ratio', 'Ratio, rate at proportion', 6, 7),
  // money
  'money-counting': t('money', 'Pagbilang ng pera (barya at papel)', 1, 3),
  'money-exact-payment': t('money', 'Eksaktong bayad (whole pesos)', 1, 4),
  'money-exact-decimal': t('money', 'Eksaktong bayad na may sentimo', 4, 6),
  'money-sukli-whole': t('money', 'Pagbibigay ng sukli (whole pesos)', 2, 5),
  'money-sukli-decimal': t('money', 'Pagbibigay ng sukli na may sentimo', 4, 6),
  'money-multi-item': t('money', 'Kabuuang halaga ng maraming bilihin', 2, 6),
  'money-word-problems': t('money', 'Word problems tungkol sa pera', 1, 6),
  // integers, exponents, radicals
  'integers-operations': t('integers-exponents', 'Operasyon sa integers (positive at negative)', 6, 7),
  'exponents-laws': t('integers-exponents', 'Exponents at laws of exponents', 6, 9),
  'square-roots-radicals': t('integers-exponents', 'Square roots, cube roots at radicals', 7, 10),
  'scientific-notation': t('integers-exponents', 'Scientific notation', 7, 8),
  // algebra
  'algebraic-expressions': t('algebra', 'Algebraic expressions (pag-evaluate at pagsulat)', 6, 8),
  'polynomials-operations': t('algebra', 'Polynomials: like terms, add, subtract, multiply', 7, 8),
  'special-products-factoring': t('algebra', 'Special products at factoring', 8, 8),
  'rational-expressions': t('algebra', 'Rational algebraic expressions', 8, 8),
  'linear-equations-one-variable': t('algebra', 'Linear equations sa isang variable', 6, 7),
  'linear-inequalities': t('algebra', 'Linear inequalities', 7, 8),
  'linear-equations-two-variables': t('algebra', 'Linear equations sa dalawang variable (slope, intercept)', 8, 8),
  'systems-of-equations': t('algebra', 'Systems of linear equations', 8, 8),
  'functions-relations': t('algebra', 'Relations at functions', 9, 11),
  'quadratic-equations': t('algebra', 'Quadratic equations', 9, 9),
  'quadratic-functions': t('algebra', 'Quadratic functions', 9, 10),
  'quadratic-inequalities': t('algebra', 'Quadratic inequalities', 10, 10),
  'absolute-value': t('algebra', 'Absolute value equations', 10, 10),
  variation: t('algebra', 'Variation (direct, inverse, joint)', 9, 9),
  'polynomial-division-theorems': t('algebra', 'Polynomial division, remainder at factor theorem', 10, 10),
  'polynomial-equations': t('algebra', 'Polynomial equations', 10, 10),
  'exponential-logarithmic': t('algebra', 'Exponential at logarithmic functions', 11, 11),
  // geometry
  'geometry-shapes': t('geometry', 'Mga hugis (2D at 3D)', 1, 3),
  'geometry-angles': t('geometry', 'Angles at mga linya (pati transversal)', 4, 9),
  'geometry-triangles-polygons': t('geometry', 'Triangles at polygons', 5, 8),
  'geometry-congruence-similarity': t('geometry', 'Congruence at similarity', 8, 9),
  'geometry-pythagorean': t('geometry', 'Pythagorean theorem', 8, 9),
  'geometry-circles': t('geometry', 'Circles (circumference, area, arcs, chords)', 6, 10),
  'geometry-coordinate': t('geometry', 'Coordinate geometry (distance, midpoint, slope, equation ng bilog)', 8, 10),
  'conic-sections': t('geometry', 'Conic sections', 11, 11),
  'trigonometry-right-triangles': t('geometry', 'Trigonometry ng right triangles', 9, 9),
  'trigonometry-oblique': t('geometry', 'Law of sines at law of cosines', 10, 10),
  'trigonometry-unit-circle': t('geometry', 'Unit circle, radians at trig values', 11, 11),
  // measurement
  'measurement-length': t('measurement', 'Haba (length)', 1, 4),
  'measurement-mass-capacity': t('measurement', 'Bigat (mass) at capacity', 2, 5),
  'measurement-time': t('measurement', 'Oras at kalendaryo', 1, 4),
  'measurement-conversion': t('measurement', 'Pag-convert ng units of measure', 4, 7),
  'measurement-perimeter-area': t('measurement', 'Perimeter at area', 3, 7),
  'measurement-volume': t('measurement', 'Volume ng solids', 5, 7),
  // statistics & probability
  'statistics-graphs': t('statistics-probability', 'Pagbasa ng tables at graphs', 1, 6),
  'statistics-mean-median-mode': t('statistics-probability', 'Mean, median at mode', 6, 11),
  'statistics-variability': t('statistics-probability', 'Range, variance at standard deviation', 8, 11),
  'statistics-regression': t('statistics-probability', 'Correlation at linear regression', 13, 13),
  'statistics-measures-of-position': t('statistics-probability', 'Quartiles, deciles at percentiles', 10, 10),
  'statistics-z-scores': t('statistics-probability', 'Normal distribution at z-scores', 11, 11),
  'probability-simple': t('statistics-probability', 'Probability ng simpleng pangyayari', 5, 11),
  'probability-counting': t('statistics-probability', 'Counting principle, permutations at combinations', 8, 10),
  'probability-compound': t('statistics-probability', 'Compound events (union, intersection, complement)', 9, 10),
  // patterns & sequences
  'number-patterns': t('patterns-sequences', 'Number patterns at odd/even', 1, 4),
  'sequences-arithmetic': t('patterns-sequences', 'Arithmetic sequences at series', 8, 13),
  'sequences-geometric': t('patterns-sequences', 'Geometric sequences', 8, 10),
  'patterns-in-nature': t('patterns-sequences', 'Fibonacci at golden ratio sa kalikasan', 13, 13),
  // SHS / college
  'consumer-math': t('business-math', 'Kita, tubo at lugi, best buy at hulugan', 8, 8),
  'business-interest': t('business-math', 'Interest at depreciation', 10, 11),
  'business-annuities': t('business-math', 'Annuities at loans', 11, 11),
  'calculus-limits': t('calculus', 'Limits', 12, 12),
  'calculus-derivatives': t('calculus', 'Derivatives', 12, 12),
  'calculus-integrals': t('calculus', 'Integrals', 12, 12),
  'logic-propositions': t('logic', 'Propositions at logic', 11, 13),
  'sets-venn': t('logic', 'Sets at Venn diagrams', 7, 7),
  'voting-apportionment': t('logic', 'Voting methods at apportionment', 13, 13),
  'graph-theory': t('logic', 'Graph theory (Euler paths at circuits)', 13, 13),
} as const satisfies Record<string, TopicInfo>

export type TopicId = keyof typeof TOPICS

export const topicLabel = (id: TopicId) => TOPICS[id].label
export const strandOf = (id: TopicId): Strand => TOPICS[id].strand
export const isTopic = (s: string): s is TopicId => Object.hasOwn(TOPICS, s)

/** Grade bands used by the games (Tagisan ng Talino) and by the reports */
export type GradeBand = 'g1-3' | 'g4-6' | 'g7-8' | 'g9-10'
export const GRADE_BANDS: { id: GradeBand; label: string; grades: [number, number] }[] = [
  { id: 'g1-3', label: 'Grade 1–3', grades: [1, 3] },
  { id: 'g4-6', label: 'Grade 4–6', grades: [4, 6] },
  { id: 'g7-8', label: 'Grade 7–8', grades: [7, 8] },
  { id: 'g9-10', label: 'Grade 9–10', grades: [9, 10] },
]
