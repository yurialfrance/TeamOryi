// Path layout for a Landas island, sized to its stage count. Pure (no React) so tests can check it.

export type Pt = { x: number; y: number }
export interface Layout { H: number; s: Pt[]; chest: Pt; chestAfter: number; trophy: Pt; route: Pt[] }

const ROW = 76 // vertical gap between path nodes (px)
const XS = [17, 40, 70, 82, 60, 32] // snake columns (x in %)

/** Snake path from bottom-left up to the trophy, sized to the island's stage count (5–12). */
export function islandLayout(n: number): Layout {
  const chestAfter = Math.max(0, Math.floor(n / 2)) // chest opens after this stage index
  const slots = n + 1
  const H = 150 + slots * ROW
  const pts: Pt[] = Array.from({ length: slots }, (_, i) => ({ x: XS[i % XS.length], y: H - 70 - i * ROW }))
  const chest = pts[chestAfter + 1]
  const s = pts.filter((_, i) => i !== chestAfter + 1)
  const trophy = { x: s[s.length - 1].x > 50 ? 24 : 74, y: 64 }
  return { H, s, chest, chestAfter, trophy, route: [...pts, trophy] }
}
