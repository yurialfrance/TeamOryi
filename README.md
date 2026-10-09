# Sipnayan — Math na Masaya

**Duolingo-style math learning in Taglish, aligned to DepEd MATATAG & CHED, with an offline AI tutor.**
Built by **TeamOryi** for the **AppBuildersPH Hackathon 2026**.

Learners climb a stage-by-stage path, earn XP, keep a daily streak, and protect their hearts — while Pipo the pig
gives hints and explains mistakes using an AI model that runs **on the device itself**. No account, no server, no data leaves the phone.

**Live app:** https://yurialfrance.github.io/TeamOryi/

---

## 1. Subukan agad (walang install)

Buksan ang link sa itaas sa **Chrome** (Android / laptop) o **Safari** (iPhone). Gumagana na agad ang lessons, keyboard, at calculator.

## 2. I-install sa phone (parang app)

Ang Sipnayan ay isang **PWA** — puwedeng i-install sa home screen at gumagana kahit offline pagkatapos ng unang bukas.

**Android (Chrome)**
1. Buksan ang https://yurialfrance.github.io/TeamOryi/ sa Chrome.
2. I-tap ang **⋮** (menu, kanang itaas) → **Add to Home screen** / **Install app**.
3. I-tap ang **Install**. Lalabas ang Sipnayan icon sa home screen.

**iPhone / iPad (Safari)**
1. Buksan ang link sa **Safari** (hindi Chrome).
2. I-tap ang **Share** button (kahon na may pataas na arrow).
3. Piliin ang **Add to Home Screen** → **Add**.

> Tip: Buksan muna ang app nang isang beses habang may internet para ma-save lahat. Pagkatapos noon, puwede na kahit naka-airplane mode.

## 3. I-on ang offline AI ni Pipo (optional)

1. Sa app, pumunta sa **Ako → Offline AI** (o sa huling step ng onboarding).
2. Piliin ang **Pipo Smart (≈1 GB)** para sa laptop / malakas na phone, o **Pipo Lite (≈0.4 GB)** para sa mas mahinang phone.
3. I-tap ang **I-download ang AI** at hintayin ang progress bar. Isang beses lang ito — naka-save na sa browser pagkatapos.

Kailangan ng browser na may **WebGPU** (bagong Chrome o Edge sa laptop, at maraming bagong Android phones).
Kung walang WebGPU, gumagana pa rin ang app: gagamit si Pipo ng built-in na hints at ng step-by-step na sagot ng calculator.

## 4. Patakbuhin sa sariling computer (para sa developers)

**Kailangan:** [Node.js](https://nodejs.org) **v20 o mas bago** at [Git](https://git-scm.com).

```bash
git clone https://github.com/yurialfrance/TeamOryi.git
cd TeamOryi
npm install
npm run dev
```

Buksan ang **http://localhost:5173** sa Chrome.

Iba pang commands:

```bash
npm run build     # production build → dist/
npm run preview   # i-serve ang build (http://localhost:4173)
npm test          # self-tests: 4,000+ generated questions, answer checker, calculator
```

**Subukan sa phone habang nagde-develop (same Wi-Fi):**

```bash
npm run dev -- --host
```

Buksan sa phone ang `http://<IP ng laptop>:5173` (makikita ang IP sa terminal, hal. `http://192.168.1.5:5173`).
Note: sa ganitong `http://` na link, **hindi gagana ang offline AI at ang Install** — kailangan ng `https`. Para doon, gamitin ang live link (GitHub Pages).

## 5. Paano nade-deploy ang live link

Bawat `git push` sa `main` ay automatic na nagbi-build at nagde-deploy sa GitHub Pages (`.github/workflows/deploy.yml`).

Unang setup (isang beses lang): sa GitHub repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Makikita ang progress sa **Actions** tab. Pagkatapos ng ~2 minuto, live na sa https://yurialfrance.github.io/TeamOryi/.

### Troubleshooting

| Problema | Solusyon |
|---|---|
| `npm` not found | I-install ang Node.js v20+, tapos isara at buksan ulit ang terminal |
| Blangko ang page sa live link | Tingnan kung green ang workflow sa **Actions** tab, at naka-set ang Pages source sa **GitHub Actions** |
| Lumang version pa rin ang nakikita | I-close at buksan ulit ang app (auto-update ang PWA), o i-refresh nang 2 beses |
| "Walang WebGPU" | Gamitin ang bagong Chrome/Edge sa laptop; gumagana pa rin ang app kahit wala nito |
| Mabagal ang AI download | ≈1 GB ito — gumamit ng Wi-Fi, o piliin ang **Pipo Lite** |

---

## Features

- **Path map** with 4 worlds × 5 stages, treasure chests, and world trophies
  | World | Level | Topic |
  |---|---|---|
  | Hati-hati sa Pizza | Grade 3–4 (DepEd MATATAG) | Fractions |
  | Balanse ng Timbangan | Grade 7 (DepEd MATATAG) | Linear equations |
  | Ipon Challenge | SHS General Mathematics | Simple & compound interest |
  | Sipnayan sa Kalikasan | CHED GE – Mathematics in the Modern World | Patterns, Fibonacci, golden ratio |
- **4 question types:** multiple choice, math input, tap-to-build tiles, number line
- **Symbolab-style math keyboard:** icon tabs (history · 123 · x² · ƒπ · quick chips), long-press alternates in key corners,
  ABC / ← / → / ⌫ (hold to clear) / CHECK. Tabs unlock per level.
- **Smart answer checking:** `2(x+3)` = `2x+6`, `0.5` = `1/2`, `x = 5` = `5`, `1,102.50` = `1102.5`, plus "i-simplify pa" nudges
- **Game loop:** XP, daily goal, streak, hearts, gems, combo counter, daily quests, achievements, guidebooks per world
- **Pipo AI (offline):** hints, "Bakit mali?" explanations, and a tutor chat (Taglish or English)
- **Custom icon set:** hand-drawn SVG icons made for Sipnayan (no emoji)
- **PWA:** installable, works offline

### Design principle: *code computes, AI explains*

Small on-device models can make arithmetic mistakes, so every lesson problem is generated from a template and **graded by code**.
In the **Tutor**, every math problem goes through the **Sipnayan Calculator** first (`src/engine/solver.ts`): it evaluates,
simplifies, expands/factors, and solves linear & quadratic equations with step-by-step work, shown in a "verified" card.
Pipo only explains those steps. Afterwards the code re-checks every numeric equation the AI wrote (`verifyAiMath`) and fixes
any wrong result. All math in AI replies is rendered as real formulas.

## Tech stack

| Layer | Tech |
|---|---|
| App | Vite + React 19 + TypeScript |
| Styling / motion | Tailwind CSS v4, Motion, canvas-confetti, Nunito |
| Math input & rendering | MathLive (custom keyboard) |
| Math engine | @cortex-js/compute-engine |
| Local AI | @mlc-ai/web-llm (Web Worker), Qwen2.5-1.5B / 0.5B Instruct (q4f16) |
| State | Zustand + localStorage |
| Offline / install | vite-plugin-pwa (Workbox) |
| Hosting | GitHub Pages via GitHub Actions |

## Project structure

```
src/
  curriculum/  worlds.ts (stages, competencies, guidebooks) + question generators per level
  engine/      answer checker, calculator/solver, types, random helpers
  keyboard/    Symbolab-style MathKeyboard + layouts
  ai/          WebLLM worker, prompts (Taglish/English few-shot), streaming with fallback
  screens/     Onboarding, Path, Lesson, Complete, Quests, Tutor, Profile
  components/  Icon set, Pipo mascot, visuals, RichText (math rendering), UI kit
  store/       Zustand game state, quests & achievements
public/pipo/   drop the generated Pipo PNGs here
```

## Pipo artwork

The app ships with a vector placeholder Pipo. Drop the generated PNGs into `public/pipo/` using the names from
`Pipo-Mascot-Prompts.pdf` — they replace the placeholder automatically:

`pipo-01-wave` · `pipo-06-phone` · `pipo-07-think` · `pipo-09-read` · `pipo-10-confused` · `pipo-11-eureka` ·
`pipo-17-jump` · `pipo-18-thumbsup` · `pipo-22-sad` · `pipo-23-oops` · `pipo-24-determined` · `pipo-25-pat` ·
`pipo-27-flame` · `pipo-30-trophy` · `pipo-33-sleep` · `pipo-36-tutor` (`.png`, transparent background)

## Curriculum alignment

Each stage lists its learning competency in plain language (`src/curriculum/worlds.ts` and **Ako → Curriculum progress**).
Official MATATAG / SHS / CHED competency codes should be added against the published curriculum guides before release.

## AI tools disclosure (hackathon rule)

- **Claude (Anthropic)** — used as an AI coding assistant to scaffold and write parts of this codebase
- **WebLLM + Qwen2.5-Instruct** — the on-device model that powers Pipo's hints and tutor chat inside the app
- Open-source libraries listed in `package.json`

All code was written during the hackathon window.
