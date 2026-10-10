// One shared compute-engine instance for the tutor's calculator modules.
import { ComputeEngine } from '@cortex-js/compute-engine'

export const ce = new ComputeEngine()
export type Expr = NonNullable<ReturnType<typeof ce.parse>>

/** compute-engine LaTeX → what we show (and can parse back): plain e, |x|, no thin spaces */
export const clean = (tex: string) =>
  tex
    .replace(/\\,/g, '')
    .replace(/\\overline\{(\d+)\}/g, '$1$1$1…')
    .replace(/\\exponentialE/g, 'e')
    .replace(/\\exp\(([^()]*)\)/g, 'e^{$1}')
    .replace(/\\imaginaryI/g, 'i')
    .replace(/\\vert\s*([^\\]*?)\\vert/g, '|$1|')
    .replace(/\\mathrm\{d\}/g, 'd')
