// Sipnayan Nerdle rules — pure, no puzzle pool, so the pool generator (scripts/gen-nerdle.ts) can use
// the exact same validator the game uses.
import type { TopicId } from '../engine/topics'

export type TileStatus = 'correct' | 'present' | 'absent' | 'empty'
export type NerdleLength = 6 | 8

/** Safe evaluator (no eval): integers only, × ÷ before + −, exact division, no leading zeros */
export function evaluateExpression(expr: string): number | null {
  if (!/^\d+([+\-*/]\d+)*$/.test(expr)) return null
  const tokens = expr.match(/\d+|[+\-*/]/g)
  if (!tokens) return null
  for (const tok of tokens) if (/^\d+$/.test(tok) && tok.length > 1 && tok.startsWith('0')) return null
  const nums: number[] = []
  const ops: string[] = []
  tokens.forEach((tok, i) => (i % 2 === 0 ? nums.push(parseInt(tok, 10)) : ops.push(tok)))
  const terms: number[] = [nums[0]]
  const addOps: string[] = []
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i], next = nums[i + 1]
    if (op === '*') terms[terms.length - 1] *= next
    else if (op === '/') {
      if (next === 0 || terms[terms.length - 1] % next !== 0) return null
      terms[terms.length - 1] /= next
    } else { addOps.push(op); terms.push(next) }
  }
  let result = terms[0]
  addOps.forEach((op, i) => { result = op === '+' ? result + terms[i + 1] : result - terms[i + 1] })
  return result < 0 || !Number.isInteger(result) ? null : result
}

/** Is a guess a well-formed, true equation of the right length? (Taglish error for the toast) */
export function validateEquation(eq: string, targetLength: number): { valid: boolean; error?: string } {
  if (eq.length !== targetLength) return { valid: false, error: `Kulang pa! Dapat ${targetLength} karakter ang equation.` }
  const parts = eq.split('=')
  if (parts.length !== 2) return { valid: false, error: "Kailangan ng eksaktong isang '=' sign!" }
  const [left, right] = parts
  if (!left || !right) return { valid: false, error: "Dapat may math expression bago at pagkatapos ng '='!" }
  if (!/^\d+$/.test(right) || (right.length > 1 && right.startsWith('0'))) return { valid: false, error: "Ang sagot pagkatapos ng '=' ay dapat buong numero lamang." }
  const leftVal = evaluateExpression(left)
  if (leftVal === null) return { valid: false, error: 'Hindi wastong math! Suriin ang mga operator o division.' }
  const rightVal = parseInt(right, 10)
  if (leftVal !== rightVal) return { valid: false, error: `Hindi balance ang equation: ${left} = ${leftVal}, hindi ${rightVal}!` }
  return { valid: true }
}

/** Wordle colouring with correct handling of repeated characters */
export function checkGuess(guess: string, target: string): TileStatus[] {
  const n = target.length
  const res: TileStatus[] = new Array(n).fill('absent')
  const t = target.split(''), g = guess.split('')
  for (let i = 0; i < n; i++) if (g[i] === t[i]) { res[i] = 'correct'; t[i] = ''; g[i] = '' }
  for (let i = 0; i < n; i++) {
    if (!g[i]) continue
    const j = t.indexOf(g[i])
    if (j !== -1) { res[i] = 'present'; t[j] = '' }
  }
  return res
}

/** Topic tag for the reports, from the operations the equation uses */
export function nerdleTopic(eq: string): TopicId {
  const left = eq.split('=')[0]
  const ops = new Set(left.match(/[+\-*/]/g) ?? [])
  const mulDiv = ops.has('*') || ops.has('/')
  const addSub = ops.has('+') || ops.has('-')
  if (mulDiv && addSub) return 'order-of-operations'
  if (ops.size > 1) return 'mixed-operations'
  if (ops.has('+')) return 'whole-numbers-addition'
  if (ops.has('-')) return 'whole-numbers-subtraction'
  if (ops.has('*')) return 'whole-numbers-multiplication'
  return 'whole-numbers-division'
}
