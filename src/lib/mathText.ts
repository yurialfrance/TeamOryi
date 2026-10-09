const CMD = '\\\\(?:sqrt|frac|dfrac|cdot|times|div|pi|pm|le|ge|leq|geq|approx|neq|ne|varphi|phi|sum|binom|infty|theta|circ)'
const BARE_LATEX = new RegExp(`(?:\\d[\\d.]*\\s*)?${CMD}(?:\\[[^\\]]*\\])?(?:\\{[^{}]*\\})*(?:\\s*(?:[=+\\-]|${CMD})\\s*(?:\\d[\\d.]*|\\{[^{}]*\\})*)*`, 'g')
const POWER = /\b([a-z0-9]+)\^(\{[^}]+\}|[0-9a-z])/gi

/** Turn \( \), \[ \], $$ $$ and bare LaTeX commands into $…$ segments */
export function normalizeMath(text: string): string {
  let t = text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `$${m}$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m}$`)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `$${m}$`)
  // wrap bare LaTeX outside existing $…$
  t = t
    .split(/(\$[^$]+\$)/g)
    .map((seg) => (seg.startsWith('$') ? seg : seg.replace(BARE_LATEX, (m) => `$${m.trim()}$`).replace(POWER, (m) => `$${m}$`)))
    .join('')
  return t
}

