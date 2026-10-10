// `npm run cap:icons` — generate native app icons (Android mipmaps incl. adaptive icons, iOS AppIcon)
// from the web icon set in public/, using @capacitor/assets. Run after `npx cap add android` / `ios`.
//
// Sources (public/):
//   icon-master-500.png     → icon-only: flattened onto the sky blue (iOS rejects icons with transparency;
//                             also the legacy square Android icon)
//   maskable-icon-512.png   → adaptive-icon foreground as-is (@capacitor/assets insets the foreground 16.7%
//                             per side, i.e. the whole image lands in the visible 72dp — no extra padding)
//   SKY (#1E90DC)           → adaptive-icon background (same blue as the maskable icon's field)
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import sharp from 'sharp' // comes with @capacitor/assets (same copy it uses to resize)

const SKY = '#1E90DC'
const TMP = '.capacitor-assets'
const platforms = ['android', 'ios'].filter((p) => existsSync(p))
if (!platforms.length) {
  console.error('cap:icons — walang android/ o ios/ na native project pa. Patakbuhin muna: npx cap add android')
  process.exit(1)
}

rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP)
try {
  const bg = { create: { width: 1024, height: 1024, channels: 4, background: SKY } }
  // icon-only: master art on an opaque sky-blue square, 1024 px (the master is 500 px, so this upscales)
  const master = await sharp('public/icon-master-500.png').resize(1024, 1024, { kernel: 'lanczos3' }).toBuffer()
  await sharp(bg).composite([{ input: master }]).flatten({ background: SKY }).png().toFile(`${TMP}/icon-only.png`)
  await sharp('public/maskable-icon-512.png').png().toFile(`${TMP}/icon-foreground.png`)
  await sharp(bg).png().toFile(`${TMP}/icon-background.png`)

  const args = ['generate', '--assetPath', TMP, ...platforms.map((p) => `--${p}`), '--iconBackgroundColor', SKY, '--iconBackgroundColorDark', SKY]
  console.log('> capacitor-assets', args.join(' '))
  // run the CLI's own entry with this Node (no shell, so arguments are passed as-is on Windows too)
  execFileSync(process.execPath, [createRequire(import.meta.url).resolve('@capacitor/assets/bin/capacitor-assets'), ...args], { stdio: 'inherit' })
} finally {
  rmSync(TMP, { recursive: true, force: true })
}
