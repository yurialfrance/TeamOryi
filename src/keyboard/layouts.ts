import type { KeyboardTab } from '../engine/types'

export type KeyAction = 'left' | 'right' | 'back' | 'clear'

export interface KeyDef {
  /** Plain text label */
  label?: string
  /** LaTeX label (rendered with MathLive static markup) */
  tex?: string
  /** LaTeX to insert. #? = placeholder, #@ = previous atom/selection */
  ins?: string
  action?: KeyAction
  kind?: 'num' | 'op' | 'fn' | 'var'
  /** Long-press alternative (shown small in the corner, like Symbolab) */
  alt?: KeyDef
}

const k = (label: string, ins: string, kind: KeyDef['kind'] = 'num', alt?: KeyDef): KeyDef => ({ label, ins, kind, alt })
const t = (tex: string, ins: string, kind: KeyDef['kind'] = 'fn', alt?: KeyDef): KeyDef => ({ tex, ins, kind, alt })

const FRAC = '\\frac{#@}{#?}'
const SQ = 'x'

export const LAYOUTS: Record<Exclude<KeyboardTab, 'history' | 'quick'>, KeyDef[][]> = {
  basic: [
    [k('x', 'x', 'var', k('y', 'y', 'var')), k('(', '(', 'op', k('[', '[', 'op')), k(')', ')', 'op', k(']', ']', 'op')), k('7', '7'), k('8', '8'), k('9', '9'), k('÷', '\\div', 'op', t('\\frac{a}{b}', FRAC))],
    [t(`${SQ}^2`, '#@^{2}', 'fn', t('x^n', '#@^{#?}')), t(`\\sqrt{${SQ}}`, '\\sqrt{#?}', 'fn', t(`\\sqrt[3]{${SQ}}`, '\\sqrt[3]{#?}')), t('\\frac{a}{b}', FRAC, 'fn', t('1\\tfrac{a}{b}', '#?\\frac{#?}{#?}')), k('4', '4'), k('5', '5'), k('6', '6'), k('×', '\\times', 'op', k('·', '\\cdot', 'op'))],
    [k('%', '\\%', 'op'), k('π', '\\pi', 'fn'), k(',', ',', 'op'), k('1', '1'), k('2', '2'), k('3', '3'), k('−', '-', 'op')],
    [k('<', '<', 'op', k('≤', '\\le', 'op')), k('>', '>', 'op', k('≥', '\\ge', 'op')), k('₱', '\\text{₱}', 'op'), k('.', '.', 'num'), k('0', '0'), k('=', '=', 'op', k('≈', '\\approx', 'op')), k('+', '+', 'op')],
  ],
  algebra: [
    [k('x', 'x', 'var'), k('y', 'y', 'var'), k('n', 'n', 'var'), k('a', 'a', 'var'), k('b', 'b', 'var'), t(`${SQ}^2`, '#@^{2}'), t('x^n', '#@^{#?}')],
    [t(`\\sqrt{${SQ}}`, '\\sqrt{#?}'), t(`\\sqrt[3]{${SQ}}`, '\\sqrt[3]{#?}'), t('|x|', '\\left|#?\\right|'), t('\\frac{a}{b}', FRAC), k('(', '(', 'op'), k(')', ')', 'op'), k('±', '\\pm', 'op')],
    [k('=', '=', 'op'), k('≠', '\\ne', 'op'), k('<', '<', 'op'), k('>', '>', 'op'), k('≤', '\\le', 'op'), k('≥', '\\ge', 'op'), k('·', '\\cdot', 'op')],
    [t('x_n', '#@_{#?}'), t('f(x)', 'f(#?)'), t('a_n', 'a_{n}'), k(',', ',', 'op'), k('∞', '\\infty', 'fn'), k('π', '\\pi', 'fn'), k('%', '\\%', 'op')],
  ],
  advanced: [
    [t('\\log', '\\log(#?)', 'fn', t('\\log_b', '\\log_{#?}(#?)')), t('\\ln', '\\ln(#?)'), t('e^x', 'e^{#?}'), t('10^x', '10^{#?}'), k('!', '!', 'op'), k('π', '\\pi', 'fn'), k('φ', '\\varphi', 'fn')],
    [t('\\sin', '\\sin(#?)', 'fn', t('\\sin^{-1}', '\\arcsin(#?)')), t('\\cos', '\\cos(#?)', 'fn', t('\\cos^{-1}', '\\arccos(#?)')), t('\\tan', '\\tan(#?)', 'fn', t('\\tan^{-1}', '\\arctan(#?)')), t('\\Sigma', '\\sum_{#?}^{#?}'), t('_nC_r', '\\binom{#?}{#?}'), t('_nP_r', 'P(#?,#?)'), k('θ', '\\theta', 'fn')],
    [t('a_n', 'a_{n}'), t('a_{n+1}', 'a_{n+1}'), t('F_n', 'F_{n}'), t('S_n', 'S_{n}'), k('r', 'r', 'var'), k('d', 'd', 'var'), k('∞', '\\infty', 'fn')],
    [k('(', '(', 'op'), k(')', ')', 'op'), t('x^n', '#@^{#?}'), t('\\frac{a}{b}', FRAC), k(',', ',', 'op'), k('=', '=', 'op'), k('≈', '\\approx', 'op')],
  ],
  // 5 rows (one more than the other tabs) so integral bounds, limit points and coefficients can be
  // typed without leaving the tab. Less common keys sit on long-press (y, |x|, the constant e).
  calculus: [
    [
      t('\\frac{d}{dx}', '\\frac{d}{dx}\\left(#?\\right)', 'fn', t('\\frac{d^2}{dx^2}', '\\frac{d^2}{dx^2}\\left(#?\\right)')),
      t('\\int', '\\int #?\\,dx', 'fn', t('\\int_a^b', '\\int_{#?}^{#?} #?\\,dx')),
      t('\\lim', '\\lim_{x\\to #?} #?', 'fn', t('\\lim_{\\infty}', '\\lim_{x\\to\\infty} #?')),
      t('\\Sigma', '\\sum_{#?}^{#?} #?'),
      t('e^x', 'e^{#?}', 'fn', k('e', 'e', 'fn')),
      t('\\ln', '\\ln(#?)', 'fn', t('\\log', '\\log(#?)')),
      k('\u221e', '\\infty', 'fn'),
    ],
    [k('x', 'x', 'var', k('y', 'y', 'var')), t('x^n', '#@^{#?}', 'fn', t(`${SQ}^2`, '#@^{2}')), t(`\\sqrt{${SQ}}`, '\\sqrt{#?}', 'fn', t('|x|', '\\left|#?\\right|')), t('\\frac{a}{b}', FRAC), t('\\sin', '\\sin(#?)'), t('\\cos', '\\cos(#?)'), t('\\tan', '\\tan(#?)')],
    [k('7', '7'), k('8', '8'), k('9', '9'), k('(', '(', 'op'), k(')', ')', 'op'), k('\u2192', '\\to ', 'op'), k('\u03c0', '\\pi', 'fn')],
    [k('4', '4'), k('5', '5'), k('6', '6'), k('+', '+', 'op'), k('\u2212', '-', 'op'), k('dx', '\\,dx', 'var'), k('n', 'n', 'var')],
    [k('1', '1'), k('2', '2'), k('3', '3'), k('0', '0'), k('.', '.', 'num'), k('=', '=', 'op'), k('\u00b7', '\\cdot', 'op')],
  ],
  abc: [
    'abcdefg'.split('').map((c) => k(c, c, 'var')),
    'hijklmn'.split('').map((c) => k(c, c, 'var')),
    'opqrstu'.split('').map((c) => k(c, c, 'var')),
    [...'vwxyz'.split('').map((c) => k(c, c, 'var')), k("′", "'", 'op'), k('°', '^{\\circ}', 'op')],
  ],
}

export const QUICK_CHIPS = [
  'I-simplify', 'Solve for x', 'I-factor', 'Ipaliwanag step-by-step', 'Bakit ganito?', 'Bigyan ng halimbawa',
  'LCM', 'GCF', 'Percent', 'Interest', 'Fraction', 'Sequence',
]
