import type { IconName } from '../components/Icon'

export type KeyboardTab = 'history' | 'basic' | 'algebra' | 'advanced' | 'abc' | 'quick'

export type Visual =
  | { type: 'pizza'; num: number; den: number }
  | { type: 'bar'; num: number; den: number }
  | { type: 'scale'; left: string; right: string }
  | { type: 'sequence'; items: (string | null)[] }
  | { type: 'scene'; icons: IconName[] }

export interface Choice {
  latex?: string
  text?: string
}

interface QuestionBase {
  id: string
  /** Taglish instruction shown above the problem */
  prompt: string
  /** Optional display math */
  latex?: string
  visual?: Visual
  /** Progressive Taglish hints (offline fallback + AI context) */
  hints: string[]
  /** Worked solution steps, computed by code — the AI only rephrases these */
  solution: string[]
  /** Canonical correct answer as text (for display + AI prompt) */
  answerDisplay: string
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice'
  choices: Choice[]
  correctIndex: number
}

export interface InputQuestion extends QuestionBase {
  kind: 'input'
  /** Accepted answers in LaTeX; compared with tolerance / equivalence */
  answers: string[]
  /** Numeric tolerance (absolute). Default 1e-9 */
  tolerance?: number
  /** If true, fraction must be in lowest terms */
  requireSimplest?: boolean
  /** Prefix shown before the field, e.g. "x =" or "₱" */
  prefix?: string
  suffix?: string
  placeholder?: string
}

export interface TilesQuestion extends QuestionBase {
  kind: 'tiles'
  tiles: string[] // latex tokens
  answerSeq: string[][] // accepted tile sequences
}

export interface NumberLineQuestion extends QuestionBase {
  kind: 'numberline'
  min: number
  max: number
  divisions: number // number of equal parts between min and max
  answerIndex: number // tick index (0..divisions)
  labelEvery?: number
}

export interface PizzaChefQuestion extends QuestionBase {
  kind: 'pizzaChef'
  targetNum: number
  targetDen: number
  allowedSlices: number[] // e.g. [2, 3, 4, 6, 8]
  topping: 'pepperoni' | 'cheese' | 'mushroom'
}

export type Question = ChoiceQuestion | InputQuestion | TilesQuestion | NumberLineQuestion | PizzaChefQuestion

export type Generator = () => Question
