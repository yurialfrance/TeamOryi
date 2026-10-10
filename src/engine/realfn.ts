// Real-valued evaluator compiled from compute-engine MathJSON — for graph sampling and the
// numeric re-checks of calculus answers. Two reasons not to use ce.subs().N() for this:
//   1. it returns complex values: ln(−2) has real part 0.69 and √(−2) real part 0, so a graph
//      built on `.re` draws curves where the function is undefined;
//   2. it's ~2 ms per call — far too slow for hundreds of samples on a phone.
// Outside the real domain this returns NaN; callers treat NaN/±Infinity as "undefined here".

export type RealFn = (x: number) => number

const CONST: Record<string, number> = { Pi: Math.PI, ExponentialE: Math.E, PositiveInfinity: Infinity, NegativeInfinity: -Infinity, Half: 0.5 }

/** a^b for real numbers; odd roots of negatives stay real (x^{1/3}), even roots don't */
function realPow(a: number, b: number): number {
  if (a >= 0 || Number.isInteger(b)) return Math.pow(a, b)
  // b = p/q with small odd q → real root of a negative base
  for (let q = 3; q <= 15; q += 2) {
    const p = Math.round(b * q)
    if (Math.abs(p / q - b) < 1e-12) return (p % 2 === 0 ? 1 : -1) * Math.pow(-a, b)
  }
  return NaN
}

const UNARY: Record<string, (a: number) => number> = {
  Negate: (a) => -a,
  Sqrt: (a) => (a < 0 ? NaN : Math.sqrt(a)),
  Exp: Math.exp,
  Ln: (a) => (a <= 0 ? NaN : Math.log(a)),
  Lb: (a) => (a <= 0 ? NaN : Math.log2(a)),
  Lg: (a) => (a <= 0 ? NaN : Math.log10(a)),
  Abs: Math.abs,
  Sin: Math.sin,
  Cos: Math.cos,
  Tan: (a) => (Math.abs(Math.cos(a)) < 1e-12 ? NaN : Math.tan(a)),
  Sec: (a) => 1 / Math.cos(a),
  Csc: (a) => 1 / Math.sin(a),
  Cot: (a) => Math.cos(a) / Math.sin(a),
  Arcsin: (a) => Math.asin(a),
  Arccos: (a) => Math.acos(a),
  Arctan: Math.atan,
  Sinh: Math.sinh,
  Cosh: Math.cosh,
  Tanh: Math.tanh,
  Square: (a) => a * a,
  Floor: Math.floor,
  Ceil: Math.ceil,
}

/**
 * Compile MathJSON into a plain JS function of one variable. Returns null when the expression
 * uses something we don't evaluate (other free symbols, unknown functions) — callers then fall
 * back to compute-engine or skip the graph.
 */
export function compileReal(json: unknown, v: string): RealFn | null {
  const build = (j: unknown): RealFn | null => {
    if (typeof j === 'number') return () => j
    if (typeof j === 'string') {
      if (j === v) return (x) => x
      if (j in CONST) { const c = CONST[j]; return () => c }
      return null
    }
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      const num = (j as { num?: string }).num
      if (typeof num === 'string') { const n = Number(num.replace(/\.\.\.$/, '')); return Number.isNaN(n) ? null : () => n }
      return null
    }
    if (!Array.isArray(j) || typeof j[0] !== 'string') return null
    const [op, ...args] = j as [string, ...unknown[]]
    const fs = args.map(build)
    if (fs.some((f) => !f)) return null
    const f = fs as RealFn[]
    switch (op) {
      case 'Add': return (x) => f.reduce((s, g) => s + g(x), 0)
      case 'Multiply': return (x) => f.reduce((s, g) => s * g(x), 1)
      case 'Subtract': return f.length === 1 ? (x) => -f[0](x) : (x) => f[0](x) - f[1](x)
      case 'Divide': return (x) => { const d = f[1](x); return d === 0 ? NaN : f[0](x) / d }
      case 'Rational': return (x) => f[0](x) / f[1](x)
      case 'Power': return (x) => realPow(f[0](x), f[1](x))
      case 'Root': return (x) => realPow(f[0](x), 1 / f[1](x))
      case 'Log': return f.length === 1 ? (x) => UNARY.Lg(f[0](x)) : (x) => { const a = f[0](x), b = f[1](x); return a <= 0 || b <= 0 || b === 1 ? NaN : Math.log(a) / Math.log(b) }
      case 'Delimiter': return f.length === 1 ? f[0] : null
      default: {
        if (!Object.hasOwn(UNARY, op) || f.length !== 1) return null
        const u = UNARY[op]
        return (x) => u(f[0](x))
      }
    }
  }
  return build(json)
}
