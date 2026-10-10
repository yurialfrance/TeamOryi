// Filipino settings for "Kwento ni Pipo" word problems — DATA ONLY. The math (numbers, answer)
// never comes from here or from the AI: it comes from the spec producers in word-problems/spec.ts.
// A setting only says WHERE a story happens, WHO is in it, WHAT they handle and which kinds of math
// it suits, so the AI prompt stays small and new settings are a data change, not a prompt change.
import { ITEMS } from '../games/cashier'

/** The kinds of math a story can carry (one spec producer each, in word-problems/spec.ts) */
export type WPKind = 'change'

export interface WPItem {
  /** as written in the story — never contains digits (the validator would count them as numbers) */
  name: string
  en: string
  /** whole pesos */
  price: number
}

export interface WPContext {
  id: string
  name: string
  nameEn: string
  /** grade range the setting suits (vocabulary + situations) */
  grades: [number, number]
  kinds: WPKind[]
  /** in the Taglish story: "sa tindahan ni Aling Nena" */
  place: string
  placeEn: string
  people: string[]
  items: WPItem[]
  /** words that place a story in this setting — offered to the AI as vocabulary it may use (the
   *  validator anchors stories by the facts' person and items instead, which is stricter) */
  vocab: string[]
  /** a few words of atmosphere for the AI prompt */
  flavor: string
}

/** "Sardinas" → "sardinas", "Toyo (sachet)" → "toyo"; names with digits or fractions are left out entirely */
const storeName = (name: string) => name.replace(/\s*\([^)]*\)\s*/g, ' ').trim().toLowerCase()
const SARI_SARI_ITEMS: WPItem[] = ITEMS
  .filter((i) => !/[\d¼½¾₱]/.test(i.name) && !i.unit && i.cents % 100 === 0)
  .map((i) => ({ name: storeName(i.name), en: storeName(i.name), price: i.cents / 100 }))

export const CONTEXTS: WPContext[] = [
  {
    id: 'sari-sari',
    name: 'Sari-sari store',
    nameEn: 'Neighborhood store',
    grades: [1, 6],
    kinds: ['change'],
    place: 'sari-sari store ni Aling Nena',
    placeEn: "Aling Nena's sari-sari store",
    people: ['Ana', 'Juan', 'Bea', 'Kiko', 'Liza', 'Paolo', 'Jasmine', 'Rafa', 'Nina', 'Jomar', 'Totoy', 'Carlo', 'Maria'],
    items: SARI_SARI_ITEMS,
    vocab: ['tindahan', 'sari-sari', 'tindera', 'aling nena', 'suki', 'store', 'bumili', 'binili', 'nagbayad', 'bought', 'paid'],
    flavor: 'a small neighborhood store; the friendly tindera Aling Nena; kids buying snacks or errands for Nanay',
  },
]

export const contextById = (id: string) => CONTEXTS.find((c) => c.id === id)
/** Settings that suit this grade and kind of math */
export const contextsFor = (kind: WPKind, grade: number) =>
  CONTEXTS.filter((c) => c.kinds.includes(kind) && grade >= c.grades[0] && grade <= c.grades[1])
