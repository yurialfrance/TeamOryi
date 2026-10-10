// `node scripts/build-currency.mjs` — turn the source peso art in src/lib/currency/ (≈350 KB PNGs) into
// small WebP sprites in public/currency/ for the Sari-Sari Cashier. Re-run after replacing any source PNG.
//   - keeps only the main artwork: drops detached slivers left at the edges by background removal
//   - trims transparent margins, so every bill / coin fills its box the same way
//   - bills → 360 px wide, coins → 192 px tall (≈3× the size they're shown at), WebP with alpha
// coin_10c.png is intentionally skipped: the 10-sentimo coin isn't in the game's BSP denomination set.
import sharp from 'sharp' // comes with @capacitor/assets
import { mkdirSync, statSync } from 'node:fs'

const SRC = 'src/lib/currency/', OUT = 'public/currency/'
const FILES = ['bill_1000', 'bill_500', 'bill_200', 'bill_100', 'bill_50', 'bill_20', 'coin_20', 'coin_10', 'coin_5', 'coin_1', 'coin_25c']
mkdirSync(OUT, { recursive: true })

/** longest run of indices 0..n-1 where `filled(i)` holds — the artwork; shorter runs are stray fragments */
function longestRun(n, filled) {
  const runs = []
  let start = -1
  for (let i = 0; i <= n; i++) {
    const on = i < n && filled(i)
    if (on && start < 0) start = i
    if (!on && start >= 0) { runs.push([start, i - 1]); start = -1 }
  }
  return runs.reduce((best, r) => (r[1] - r[0] > best[1] - best[0] ? r : best))
}

/** bounding box of the main artwork (alpha > 40), ignoring detached slivers along any edge */
async function mainBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const a = (x, y) => data[(y * W + x) * 4 + 3] > 40
  const [x0, x1] = longestRun(W, (x) => { for (let y = 0; y < H; y++) if (a(x, y)) return true; return false })
  const [y0, y1] = longestRun(H, (y) => { for (let x = x0; x <= x1; x++) if (a(x, y)) return true; return false })
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }
}

let total = 0
for (const name of FILES) {
  const file = `${SRC}${name}.png`
  const cropped = await sharp(file).extract(await mainBox(file)).png().toBuffer()
  const trimmed = await sharp(cropped).trim({ threshold: 1 }).toBuffer()
  const resize = name.startsWith('bill') ? { width: 360 } : { height: 192 }
  const out = `${OUT}${name}.webp`
  const info = await sharp(trimmed).resize(resize).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(out)
  total += statSync(out).size
  console.log(`${name.padEnd(10)} ${String(info.width).padStart(3)}×${info.height}  ${(statSync(out).size / 1024).toFixed(1)} KB`)
}
console.log(`total ${(total / 1024).toFixed(0)} KB`)
