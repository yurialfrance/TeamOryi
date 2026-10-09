import { memo } from 'react'
import { Tex } from '../lib/math'
import { normalizeMath } from '../lib/mathText'

/** Renders text with inline math ($…$) typeset by MathLive */
export const RichText = memo(function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts = normalizeMath(text).split(/(\$[^$]+\$)/g)
  const out: React.ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
      // keep trailing punctuation glued to the formula so it never wraps alone
      const next = parts[i + 1] ?? ''
      const punct = next.match(/^[.,!?;:)]+/)?.[0] ?? ''
      if (punct) parts[i + 1] = next.slice(punct.length)
      out.push(
        <span key={i} className="whitespace-nowrap">
          <Tex tex={p.slice(1, -1)} className="mx-0.5 text-[1.05em]" />{punct}
        </span>,
      )
    } else if (p) {
      out.push(<span key={i}>{p.replace(/\*\*(.+?)\*\*/g, '$1')}</span>)
    }
  }
  return <span className={`whitespace-pre-line ${className}`}>{out}</span>
})
