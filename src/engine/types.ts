import type { IconName } from '../components/Icon'
import type { TopicId } from './topics'

export type KeyboardTab = 'history' | 'basic' | 'algebra' | 'advanced' | 'calculus' | 'abc' | 'quick'

export type Visual =
  | { type: 'pizza'; num: number; den: number }
  | { type: 'bar'; num: number; den: number }
  | { type: 'scale'; left: string; right: string }
  | { type: 'sequence'; items: (string | null)[] }
  | { type: 'scene'; icons: IconName[] }
  /** analog clock face */
  | { type: 'clock'; h: number; m: number }
  /** single bar graph; values are read off the bars */
  | { type: 'barGraph'; title: string; labels: string[]; values: number[]; unit?: string }
  /** small data table (first row is the header) */
  | { type: 'table'; rows: string[][] }
  /** right triangle with optional side labels (legs a, b and hypotenuse c) and an optional marked angle */
  | { type: 'rightTriangle'; a?: string; b?: string; c?: string; angle?: string }
  /** regular polygon with n sides */
  | { type: 'polygon'; sides: number; label?: string }

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
  /** Topic tag (set by buildLesson from the stage) — feeds the assessment reports */
  topic?: TopicId
  /** "Kwento ni Pipo" word problem: 'ai-story' = the on-device AI wrote the story (and it passed
   *  validation); 'story-template' = the AI's story was rejected, so the code-written facts are shown */
  origin?: 'ai-story' | 'story-template'
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
