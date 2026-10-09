export const ri = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
export const uid = () => Math.random().toString(36).slice(2, 9)

/** Format a number as Philippine peso with 2 decimals */
export const peso = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Round to 2 decimals */
export const r2 = (n: number) => Math.round(n * 100) / 100

export const NAMES = ['Juan', 'Maria', 'Jose', 'Ana', 'Mark', 'Bea', 'Kiko', 'Liza', 'Paolo', 'Jasmine', 'Rafa', 'Nina']

/** Build a set of distinct numeric distractors around a value */
export function distractors(correct: number, count: number, spread = 5, avoid: number[] = []): number[] {
  const out = new Set<number>()
  let guard = 0
  while (out.size < count && guard++ < 200) {
    const d = correct + ri(-spread, spread)
    if (d !== correct && d >= 0 && !avoid.includes(d)) out.add(d)
  }
  return [...out]
}
