// Sipnayan icon set — hand-drawn, chunky two-tone SVG icons (no emoji).
// 32×32 grid. Each icon: flat base colour + darker "shade" side + soft white highlight.
import type { CSSProperties, ReactNode } from 'react'

const C = {
  sky: '#2F6BFF', skyD: '#1F4FD1', skyL: '#BFD3FF',
  sun: '#FFC83D', sunD: '#E5A800', sunL: '#FFE7A3',
  red: '#FF4B6E', redD: '#D93355',
  leaf: '#3DBE6B', leafD: '#2A9A51',
  pig: '#FF8FB1', pigL: '#FFC2D4', pigD: '#B4466B',
  grape: '#9B5DE5', grapeD: '#7B3FC4',
  orange: '#FF8A1F', orangeD: '#E26A00',
  wood: '#D9893D', woodD: '#A8611E',
  ink: '#3C3346', grey: '#B7AEC0', greyD: '#9C93A6', white: '#FFFFFF',
}

const Hi = ({ x, y, w = 4, h = 2.4, r = -30 }: { x: number; y: number; w?: number; h?: number; r?: number }) => (
  <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} fill="#fff" opacity=".55" transform={`rotate(${r} ${x} ${y})`} />
)

const rays = (n: number, cx: number, cy: number, r1: number, r2: number, w: number, fill: string) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const p = (r: number, da: number) => `${cx + r * Math.cos(a + da)},${cy + r * Math.sin(a + da)}`
    return <polygon key={i} points={`${p(r2, 0)} ${p(r1, w)} ${p(r1, -w)}`} fill={fill} />
  })

const T = ({ x, y, s = 11, fill = '#fff', children }: { x: number; y: number; s?: number; fill?: string; children: ReactNode }) => (
  <text x={x} y={y} fontSize={s} fontWeight={900} fontFamily="Nunito Variable, Nunito, sans-serif" textAnchor="middle" fill={fill}>{children}</text>
)

const ICONS = {
  /* ---------- core stats ---------- */
  flame: (
    <>
      <path d="M16 2c3 5 10 8 10 17a10 10 0 0 1-20 0c0-5 3-8 5-10 0 3 1 5 3 6 0-5 0-9 2-13Z" fill={C.orange} />
      <path d="M16 29a10 10 0 0 0 10-10c0-3-1-5-2-7 1 6-2 13-8 17Z" fill={C.orangeD} />
      <path d="M16 14c3 3 6 5 6 9a6 6 0 0 1-12 0c0-3 2-4 3-5 0 2 1 3 2 3 0-3 0-5 1-7Z" fill={C.sun} />
      <Hi x={10.5} y={17} w={3} h={5} r={20} />
    </>
  ),
  sun: (
    <>
      {rays(8, 16, 16, 9, 15.5, 0.32, C.sun)}
      <circle cx="16" cy="16" r="9" fill={C.sun} />
      <path d="M25 16a9 9 0 0 1-18 0Z" fill={C.sunD} opacity=".55" />
      <circle cx="16" cy="16" r="5.4" fill={C.sunD} />
      <circle cx="16" cy="16" r="5.4" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" />
      <Hi x={12} y={11.5} w={4} h={2.2} />
    </>
  ),
  heart: (
    <>
      <path d="M16 28C6 21 3 15 3 10.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 2.5C29 15 26 21 16 28Z" fill={C.red} />
      <path d="M16 28c10-7 13-13 13-17.5 0-1.5-.4-2.8-1.1-3.9C28 15 22 22 16 28Z" fill={C.redD} />
      <Hi x={9} y={10} w={5} h={3} />
    </>
  ),
  heartPlus: (
    <>
      <path d="M16 28C6 21 3 15 3 10.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 2.5C29 15 26 21 16 28Z" fill={C.red} />
      <path d="M16 11v10M11 16h10" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
    </>
  ),
  heartBroken: (
    <>
      <path d="M15 28C6 21 3 15 3 10.5A6.5 6.5 0 0 1 15 7.5l-2 6 3 3-2 4Z" fill={C.grey} />
      <path d="M17 28c9-7 12-13 12-17.5A6.5 6.5 0 0 0 17 7.5l1.5 6-3 3 2 4Z" fill={C.greyD} />
    </>
  ),
  star: (
    <>
      <path d="M16 3l3.9 8 8.6 1.2-6.3 6 1.5 8.6-7.7-4.1-7.7 4.1 1.5-8.6-6.3-6 8.6-1.2Z" fill={C.sun} />
      <path d="M16 3l3.9 8 8.6 1.2-6.3 6 1.5 8.6-7.7-4.1Z" fill={C.sunD} opacity=".6" />
      <Hi x={12.5} y={13} w={3.6} h={2} />
    </>
  ),
  starGrey: (
    <path d="M16 3l3.9 8 8.6 1.2-6.3 6 1.5 8.6-7.7-4.1-7.7 4.1 1.5-8.6-6.3-6 8.6-1.2Z" fill="#E5E0EA" />
  ),
  bolt: (
    <>
      <path d="M19 2 6 18h8l-2 12 14-18h-8l2-10Z" fill={C.sun} />
      <path d="m19 2-2 10h8L12 30l3-12Z" fill={C.sunD} opacity=".55" />
    </>
  ),

  /* ---------- navigation ---------- */
  home: (
    <>
      <rect x="7" y="14" width="18" height="14" rx="2.5" fill={C.sun} />
      <rect x="17" y="14" width="8" height="14" rx="2" fill={C.sunD} />
      <rect x="13" y="19" width="6" height="9" rx="3" fill={C.sky} />
      <path d="M3.5 14.2 16 3.5l12.5 10.7c.9.8.3 2.3-.9 2.3H4.4c-1.2 0-1.8-1.5-.9-2.3Z" fill={C.red} />
      <path d="M16 3.5 28.5 14.2c.9.8.3 2.3-.9 2.3H16Z" fill={C.redD} />
    </>
  ),
  chest: (
    <>
      <rect x="4" y="14" width="24" height="14" rx="3" fill={C.wood} />
      <rect x="4" y="22" width="24" height="6" rx="3" fill={C.woodD} />
      <path d="M4 14v-3a7 7 0 0 1 7-7h10a7 7 0 0 1 7 7v3Z" fill="#EDA552" />
      <rect x="4" y="12.5" width="24" height="3.5" fill={C.sun} />
      <rect x="13" y="11" width="6" height="8" rx="2" fill={C.sun} />
      <circle cx="16" cy="15" r="1.4" fill={C.woodD} />
      <Hi x={9} y={8} w={5} h={2} r={-10} />
    </>
  ),
  chestOpen: (
    <>
      <path d="M4 10 8 3h16l4 7Z" fill="#EDA552" />
      <rect x="4" y="14" width="24" height="14" rx="3" fill={C.wood} />
      <rect x="4" y="22" width="24" height="6" rx="3" fill={C.woodD} />
      <rect x="5" y="10" width="22" height="5" rx="1" fill={C.sunL} />
      <circle cx="11" cy="11" r="2.5" fill={C.sun} /><circle cx="16" cy="10" r="2.8" fill={C.sun} /><circle cx="21" cy="11" r="2.5" fill={C.sun} />
      <rect x="4" y="14" width="24" height="3" fill={C.sun} />
    </>
  ),
  tutor: (
    <>
      <path d="M6 4h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H14l-7 5v-5H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z" fill={C.pig} />
      <path d="M30 14v6a4 4 0 0 1-4 4H14l-7 5v-5h19a4 4 0 0 0 4-4Z" fill="#E46A92" opacity=".7" />
      <ellipse cx="16" cy="14" rx="7" ry="5" fill={C.pigL} />
      <ellipse cx="13.4" cy="14" rx="1.4" ry="2" fill={C.pigD} />
      <ellipse cx="18.6" cy="14" rx="1.4" ry="2" fill={C.pigD} />
    </>
  ),
  medal: (
    <>
      <path d="M8 2h6l4 11h-6Z" fill={C.sky} />
      <path d="M24 2h-6l-4 11h6Z" fill={C.skyD} />
      <circle cx="16" cy="20" r="9.5" fill={C.sun} />
      <path d="M25.5 20a9.5 9.5 0 0 1-19 0Z" fill={C.sunD} opacity=".55" />
      <path d="m16 14.5 1.7 3.4 3.8.5-2.8 2.6.7 3.7-3.4-1.8-3.4 1.8.7-3.7-2.8-2.6 3.8-.5Z" fill="#fff" />
    </>
  ),
  book: (
    <>
      <path d="M2.5 7.5C7 5 11.5 5 16 7.5v20c-4.5-2.5-9-2.5-13.5 0Z" fill={C.sky} />
      <path d="M29.5 7.5C25 5 20.5 5 16 7.5v20c4.5-2.5 9-2.5 13.5 0Z" fill={C.skyD} />
      <path d="M6 12c2.5-1 4.5-1 7 0M6 16c2.5-1 4.5-1 7 0M19 12c2.5-1 4.5-1 7 0M19 16c2.5-1 4.5-1 7 0" stroke="#fff" strokeOpacity=".6" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),

  /* ---------- states ---------- */
  lock: (
    <>
      <path d="M10 14v-4a6 6 0 0 1 12 0v4" fill="none" stroke={C.greyD} strokeWidth="3.6" />
      <rect x="6" y="13" width="20" height="15" rx="4" fill={C.grey} />
      <path d="M16 13h6a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-6Z" fill={C.greyD} />
      <circle cx="16" cy="19.5" r="2.2" fill="#7A6F85" />
      <rect x="15" y="20" width="2" height="4" rx="1" fill="#7A6F85" />
    </>
  ),
  check: <path d="M7.5 16.5 13 22 24.5 10" fill="none" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />,
  crown: (
    <>
      <path d="m4 10 6.5 5.5L16 6l5.5 9.5L28 10l-2.5 14h-19Z" fill={C.sun} />
      <path d="M16 6l5.5 9.5L28 10l-2.5 14H16Z" fill={C.sunD} opacity=".5" />
      <rect x="6" y="23" width="20" height="5" rx="2" fill={C.sunD} />
      <circle cx="16" cy="18" r="2.2" fill={C.red} />
      <circle cx="4" cy="10" r="2" fill={C.sun} /><circle cx="16" cy="5.5" r="2" fill={C.sun} /><circle cx="28" cy="10" r="2" fill={C.sun} />
    </>
  ),
  trophy: (
    <>
      <path d="M9.5 6H5v2.5a5 5 0 0 0 5 5M22.5 6H27v2.5a5 5 0 0 1-5 5" fill="none" stroke={C.sunD} strokeWidth="2.6" />
      <path d="M8.5 3h15v9a7.5 7.5 0 0 1-15 0Z" fill={C.sun} />
      <path d="M16 3h7.5v9A7.5 7.5 0 0 1 16 19.5Z" fill={C.sunD} opacity=".5" />
      <rect x="14" y="19" width="4" height="4" fill={C.sunD} />
      <rect x="9" y="23" width="14" height="6" rx="2" fill={C.sky} />
      <rect x="16" y="23" width="7" height="6" rx="2" fill={C.skyD} />
      <rect x="11" y="6" width="2.4" height="7" rx="1.2" fill="#fff" opacity=".55" />
    </>
  ),
  target: (
    <>
      <circle cx="16" cy="16" r="13" fill={C.red} />
      <circle cx="16" cy="16" r="9" fill="#fff" />
      <circle cx="16" cy="16" r="5.2" fill={C.red} />
      <circle cx="16" cy="16" r="1.8" fill="#fff" />
    </>
  ),
  clock: (
    <>
      <circle cx="16" cy="16" r="13" fill={C.sky} />
      <path d="M29 16a13 13 0 0 1-26 0Z" fill={C.skyD} opacity=".5" />
      <circle cx="16" cy="16" r="9.5" fill="#fff" />
      <path d="M16 10v6l4 2.5" fill="none" stroke={C.sky} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  bulb: (
    <>
      <path d="M16 3a9 9 0 0 0-5 16.5V22h10v-2.5A9 9 0 0 0 16 3Z" fill={C.sun} />
      <path d="M16 3a9 9 0 0 1 5 16.5V22h-5Z" fill={C.sunD} opacity=".5" />
      <rect x="11" y="22" width="10" height="3.4" rx="1.2" fill={C.greyD} />
      <rect x="12.5" y="25.4" width="7" height="3.2" rx="1.6" fill="#7A6F85" />
      <Hi x={12} y={9} w={3.4} h={5} r={25} />
    </>
  ),
  shield: (
    <>
      <path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7Z" fill={C.leaf} />
      <path d="M16 3l11 4v8c0 7-5 12-11 14Z" fill={C.leafD} />
      <path d="m11 16 3.5 3.5L21.5 12" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  chip: (
    <>
      <path d="M10 3v4M16 3v4M22 3v4M10 25v4M16 25v4M22 25v4M3 10h4M3 16h4M3 22h4M25 10h4M25 16h4M25 22h4" stroke={C.greyD} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="6.5" y="6.5" width="19" height="19" rx="4" fill={C.grape} />
      <path d="M25.5 16v5.5a4 4 0 0 1-4 4H16Z" fill={C.grapeD} />
      <ellipse cx="16" cy="16" rx="5.5" ry="4" fill={C.pigL} />
      <ellipse cx="14" cy="16" rx="1.1" ry="1.6" fill={C.pigD} /><ellipse cx="18" cy="16" rx="1.1" ry="1.6" fill={C.pigD} />
    </>
  ),
  speaker: (
    <>
      <path d="M4 12h5l7-6v20l-7-6H4Z" fill={C.sky} />
      <path d="M21 11a6 6 0 0 1 0 10M24 7.5a11 11 0 0 1 0 17" fill="none" stroke={C.sky} strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),
  speakerOff: (
    <>
      <path d="M4 12h5l7-6v20l-7-6H4Z" fill={C.grey} />
      <path d="m21 12 7 8M28 12l-7 8" stroke={C.grey} strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="24" height="22" rx="4" fill="#fff" stroke="#E8E2EE" strokeWidth="2" />
      <path d="M4 10a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v3H4Z" fill={C.red} />
      <rect x="9" y="3" width="3" height="6" rx="1.5" fill={C.ink} /><rect x="20" y="3" width="3" height="6" rx="1.5" fill={C.ink} />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={8 + c * 4.4} y={16 + r * 3.8} width="2.6" height="2.4" rx=".8" fill={r === 1 && c === 2 ? C.red : C.skyL} />))}
    </>
  ),
  pin: (
    <>
      <path d="M16 30C10 21 6 17 6 12a10 10 0 0 1 20 0c0 5-4 9-10 18Z" fill={C.red} />
      <path d="M16 2a10 10 0 0 1 10 10c0 5-4 9-10 18Z" fill={C.redD} />
      <circle cx="16" cy="12" r="4" fill="#fff" />
    </>
  ),
  party: (
    <>
      <path d="M4 28 10.5 10 22 21.5Z" fill={C.pig} />
      <path d="M7.4 20.6 13.5 14M5.6 25.6 17.5 17.8" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
      <path d="M4 28 22 21.5 16 16Z" fill="#E46A92" opacity=".6" />
      <rect x="20" y="3" width="3" height="5" rx="1" fill={C.sky} transform="rotate(25 21 5)" />
      <rect x="25" y="10" width="3" height="5" rx="1" fill={C.sun} transform="rotate(-30 26 12)" />
      <circle cx="15" cy="5" r="1.8" fill={C.leaf} /><circle cx="27" cy="20" r="1.8" fill={C.grape} />
      <path d="M17 11c2-3 5-3 6-6" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  history: (
    <>
      <circle cx="16.5" cy="16.5" r="11" fill={C.skyL} />
      <path d="M5.5 16.5a11 11 0 1 0 3.2-7.8L5.5 12" fill="none" stroke={C.sky} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 6v6h6" fill="none" stroke={C.sky} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 10v6.5l4 2.5" fill="none" stroke={C.sky} strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),
  gem: (
    <>
      <path d="M8 4h16l5 7-13 18L3 11Z" fill={C.sky} />
      <path d="M3 11h26L16 29Z" fill={C.skyD} />
      <path d="M8 4l3 7 5-7 5 7 3-7" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.4" />
      <path d="M11 11l5 18 5-18" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.4" />
    </>
  ),
  sparkle: (
    <path d="M16 3c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10Z" fill={C.sun} />
  ),

  /* ---------- stage icons ---------- */
  pizza: (
    <>
      <path d="M16 30 4.5 7.5Q16 2 27.5 7.5Z" fill={C.sun} />
      <path d="M16 30 27.5 7.5Q22 5 16 5Z" fill={C.sunD} opacity=".45" />
      <path d="M4.5 7.5Q16 2 27.5 7.5L26 11Q16 6 6 11Z" fill={C.wood} />
      <circle cx="13" cy="15" r="2.6" fill={C.red} /><circle cx="19.5" cy="14" r="2.2" fill={C.red} /><circle cx="16" cy="21.5" r="2" fill={C.red} />
    </>
  ),
  scale: (
    <>
      <rect x="14.8" y="6" width="2.4" height="20" rx="1.2" fill="#7A6F85" />
      <rect x="4" y="7.5" width="24" height="2.6" rx="1.3" fill="#7A6F85" />
      <path d="M6 9.5 3.5 18M6 9.5 8.5 18M26 9.5 23.5 18M26 9.5 28.5 18" stroke="#9C93A6" strokeWidth="1.3" />
      <path d="M2 18h8a4 4 0 0 1-8 0Z" fill={C.sky} />
      <path d="M22 18h8a4 4 0 0 1-8 0Z" fill={C.sun} />
      <rect x="10" y="25" width="12" height="4" rx="2" fill={C.ink} />
      <circle cx="16" cy="6" r="2.4" fill={C.sun} />
    </>
  ),
  magnifier: (
    <>
      <path d="m20 20 8 8" stroke="#7A6F85" strokeWidth="5" strokeLinecap="round" />
      <circle cx="13" cy="13" r="10" fill={C.sky} />
      <circle cx="13" cy="13" r="6.8" fill={C.skyL} />
      <path d="M8.5 11a5 5 0 0 1 4.5-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  plus: (
    <>
      <rect x="11.5" y="3" width="9" height="26" rx="3.5" fill={C.leaf} />
      <rect x="3" y="11.5" width="26" height="9" rx="3.5" fill={C.leaf} />
      <path d="M20.5 20.5V26a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3v-5.5ZM20.5 20.5H26a3 3 0 0 0 3-3v-1.5h-8.5Z" fill={C.leafD} />
      <Hi x={14} y={8} w={2} h={3.5} r={0} />
    </>
  ),
  swap: (
    <>
      <rect x="2.5" y="3" width="13" height="13" rx="3.5" fill={C.sky} /><T x={9} y={13.5} s={11}>x</T>
      <rect x="16.5" y="16" width="13" height="13" rx="3.5" fill={C.sun} /><T x={23} y={26.5} s={11} fill={C.ink}>3</T>
      <path d="M20 5.5h3a4 4 0 0 1 4 4V12m-2.5-2 2.5 2.5L29.5 10" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 26.5H9a4 4 0 0 1-4-4V20m2.5 2L5 19.5 2.5 22" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  steps: (
    <>
      <ellipse cx="10" cy="20" rx="4.6" ry="7" fill={C.pig} transform="rotate(-12 10 20)" />
      <circle cx="6.5" cy="11" r="1.6" fill={C.pig} /><circle cx="9.5" cy="10" r="1.6" fill={C.pig} /><circle cx="12.6" cy="10.6" r="1.5" fill={C.pig} />
      <ellipse cx="22" cy="14" rx="4.6" ry="7" fill="#E46A92" transform="rotate(12 22 14)" />
      <circle cx="19.4" cy="5" r="1.5" fill="#E46A92" /><circle cx="22.5" cy="4.4" r="1.6" fill="#E46A92" /><circle cx="25.6" cy="5.4" r="1.6" fill="#E46A92" />
    </>
  ),
  stairs: (
    <>
      <path d="M3 29v-6h6.5v-6.5H16V10h6.5V3.5H29V29Z" fill={C.sky} />
      <path d="M3 23h6.5M9.5 16.5H16M16 10h6.5M22.5 3.5H29" stroke={C.skyL} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M29 3.5V29H16Z" fill={C.skyD} opacity=".5" />
    </>
  ),
  puzzle: (
    <>
      <path d="M5 9h6.5a3.5 3.5 0 1 1 7 0H25v6.5a3.5 3.5 0 1 1 0 7V29H5v-6.5a3.5 3.5 0 1 0 0-7Z" fill={C.grape} />
      <path d="M25 15.5a3.5 3.5 0 1 1 0 7V29H15Z" fill={C.grapeD} opacity=".6" />
      <Hi x={9.5} y={13} w={3} h={2} />
    </>
  ),
  jeep: (
    <>
      <path d="M2.5 21v-7.5Q2.5 9 7 9h15.5l4.5 6h2.5v6Z" fill={C.sky} />
      <rect x="4" y="6" width="19" height="3.6" rx="1.6" fill={C.sun} />
      <rect x="5" y="11" width="5" height="4" rx="1" fill="#fff" /><rect x="11.5" y="11" width="5" height="4" rx="1" fill="#fff" /><path d="M18 11h3.8l3 4H18Z" fill="#fff" />
      <rect x="2.5" y="17" width="27" height="2.2" fill={C.red} />
      <circle cx="9" cy="22" r="3.6" fill={C.ink} /><circle cx="9" cy="22" r="1.4" fill={C.grey} />
      <circle cx="23" cy="22" r="3.6" fill={C.ink} /><circle cx="23" cy="22" r="1.4" fill={C.grey} />
      <circle cx="28.5" cy="15.8" r="1.2" fill={C.sun} />
      <path d="M13.5 3.2 15 1.5 16.5 3.2V6h-3Z" fill={C.sunD} />
    </>
  ),
  phone: (
    <>
      <rect x="8" y="2.5" width="16" height="27" rx="4" fill={C.ink} />
      <rect x="10.2" y="6" width="11.6" height="18" rx="1.5" fill={C.sky} />
      <rect x="12.5" y="17" width="2" height="4" rx=".6" fill="#fff" /><rect x="15.2" y="14" width="2" height="7" rx=".6" fill="#fff" /><rect x="17.9" y="10.5" width="2" height="10.5" rx=".6" fill="#fff" />
      <rect x="14" y="26" width="4" height="1.6" rx=".8" fill={C.grey} />
    </>
  ),
  store: (
    <>
      <rect x="4" y="13" width="24" height="16" rx="2" fill={C.sun} />
      <rect x="17" y="13" width="11" height="16" rx="2" fill={C.sunD} opacity=".55" />
      <rect x="7" y="17" width="10" height="7" rx="1.5" fill={C.skyL} />
      <rect x="19.5" y="18" width="5.5" height="11" rx="1.5" fill={C.wood} />
      <path d="M2 7h28l-2 6H4Z" fill={C.red} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${2 + i * 4} 13a2 2 0 0 0 4 0`} fill={i % 2 ? '#fff' : C.red} />
      ))}
      {[0, 1, 2].map((i) => <rect key={i} x={7 + i * 8} y="7" width="4" height="6" fill="#fff" />)}
      <rect x="3" y="4" width="26" height="3.4" rx="1.4" fill={C.redD} />
    </>
  ),
  tag: (
    <>
      <path d="M4 6v9l13 13 11-11L15 4H6a2 2 0 0 0-2 2Z" fill={C.red} />
      <path d="M28 17 17 28 10.5 21.5 22 10Z" fill={C.redD} opacity=".6" />
      <circle cx="9.5" cy="9.5" r="2.2" fill="#fff" />
      <T x={17} y={20.5} s={10}>%</T>
    </>
  ),
  bank: (
    <>
      <path d="M2.5 11.5 16 3.5l13.5 8Z" fill={C.leaf} />
      <path d="M16 3.5l13.5 8H16Z" fill={C.leafD} />
      <rect x="4" y="11.5" width="24" height="2.6" fill={C.leafD} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={6 + i * 5.7} y="14.5" width="3.4" height="10" rx="1" fill="#E3F8EA" />)}
      <rect x="3" y="25" width="26" height="4" rx="1.5" fill={C.leaf} />
      <circle cx="16" cy="8.5" r="1.8" fill={C.sun} />
    </>
  ),
  chartUp: (
    <>
      <rect x="4" y="19" width="5.5" height="9" rx="1.5" fill={C.skyL} />
      <rect x="11.5" y="14" width="5.5" height="14" rx="1.5" fill={C.sky} />
      <rect x="19" y="9" width="5.5" height="19" rx="1.5" fill={C.skyD} />
      <path d="M4 14 11 8.5l5 3L27 4" fill="none" stroke={C.leaf} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 3.5H27.5V9.5" fill="none" stroke={C.leaf} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  coins: (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}><ellipse cx="11" cy={25 - i * 4.5} rx="8" ry="3.4" fill={C.sunD} /><ellipse cx="11" cy={23.6 - i * 4.5} rx="8" ry="3.4" fill={C.sun} /></g>
      ))}
      <circle cx="22" cy="13" r="8" fill={C.sunD} /><circle cx="22" cy="12" r="8" fill={C.sun} />
      <T x={22} y={16} s={11} fill={C.sunD}>₱</T>
    </>
  ),
  versus: (
    <>
      <circle cx="10.5" cy="17" r="8.5" fill={C.sky} /><T x={10.5} y={21} s={10}>S</T>
      <circle cx="21.5" cy="13" r="8.5" fill={C.leaf} /><T x={21.5} y={17} s={10}>C</T>
      <path d="M17 3 13 14h4l-2 8" fill="none" stroke={C.sun} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  blocks: (
    <>
      <rect x="2" y="15" width="9" height="13" rx="2.5" fill={C.red} /><T x={6.5} y={25} s={9}>1</T>
      <rect x="11.5" y="10" width="9" height="18" rx="2.5" fill={C.sky} /><T x={16} y={22} s={9}>2</T>
      <rect x="21" y="4" width="9" height="24" rx="2.5" fill={C.leaf} /><T x={25.5} y={19} s={9}>3</T>
    </>
  ),
  spiral: (
    <>
      <circle cx="16" cy="16" r="13" fill={C.pigL} />
      <path d="M16 16a2 2 0 0 1 2 2 4 4 0 0 1-4 4 6 6 0 0 1-6-6 10 10 0 0 1 10-10 13 13 0 0 1 11 9" fill="none" stroke={C.grapeD} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M29 16a13 13 0 0 1-26 0" fill="none" stroke={C.pig} strokeWidth="1.6" opacity=".6" />
    </>
  ),
  abacus: (
    <>
      <rect x="3" y="4" width="26" height="24" rx="3" fill="none" stroke={C.wood} strokeWidth="3" />
      {[10, 16, 22].map((y, r) => (
        <g key={y}>
          <line x1="4.5" y1={y} x2="27.5" y2={y} stroke={C.woodD} strokeWidth="1.4" />
          {[0, 1, 2].map((b) => <circle key={b} cx={8 + b * 4 + r * 3} cy={y} r="2.3" fill={[C.red, C.sky, C.leaf][r]} />)}
        </g>
      ))}
    </>
  ),
  sunflower: (
    <>
      <path d="M16 20v10" stroke={C.leafD} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 26c-3-3-7-3-9-1 3 2 6 2 9 1Z" fill={C.leaf} />
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx="16" cy="5.5" rx="2.6" ry="5" fill={i % 2 ? C.sun : C.sunD} transform={`rotate(${i * 30} 16 14)`} />
      ))}
      <circle cx="16" cy="14" r="5.5" fill="#7A4B1E" />
      {[[14, 12.5], [17.5, 12.5], [16, 15], [13.5, 16], [18.5, 16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#C98A3D" />)}
    </>
  ),
  pineapple: (
    <>
      <path d="M16 11c-2-4-6-5-8-4 3 1 4 3 5 5ZM16 11c2-4 6-5 8-4-3 1-4 3-5 5ZM16 11c0-4 0-7 0-9 2 2 2 5 1 9Z" fill={C.leaf} />
      <ellipse cx="16" cy="20" rx="8" ry="10" fill={C.sun} />
      <path d="M16 10a8 10 0 0 1 0 20Z" fill={C.sunD} opacity=".45" />
      <path d="M10 15l10 10M10 21l6 6M13 12l10 10M22 15 12 25M22 21l-6 6M19 12 9 22" stroke={C.sunD} strokeWidth="1.3" />
    </>
  ),
  bread: (
    <>
      <ellipse cx="16" cy="19" rx="13" ry="9" fill={C.wood} />
      <ellipse cx="16" cy="17" rx="12" ry="7.5" fill="#EDA552" />
      <path d="M10 14q2 3 4 0M15 13q2 3 4 0M20 14q2 3 4 0" fill="none" stroke={C.woodD} strokeWidth="1.6" strokeLinecap="round" />
      <Hi x={10} y={17} w={4} h={1.8} r={-10} />
    </>
  ),
  flan: (
    <>
      <ellipse cx="16" cy="25" rx="14" ry="4" fill="#E8E2EE" />
      <path d="M8 24 10 12h12l2 12Z" fill={C.sun} />
      <path d="M16 12h6l2 12h-8Z" fill={C.sunD} opacity=".45" />
      <path d="M10 12q6-3 12 0l.4 3q-1.5 2-3 0-1.6 2-3.2 0-1.6 2-3.2 0-1.5 2-3.4 0Z" fill={C.woodD} />
    </>
  ),
  coffee: (
    <>
      <path d="M22 14h3a3.5 3.5 0 0 1 0 7h-3" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M22 14h3a3.5 3.5 0 0 1 0 7h-3" fill="none" stroke={C.red} strokeWidth="2.6" />
      <path d="M5 11h18v9a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7Z" fill={C.red} />
      <path d="M14 11h9v9a7 7 0 0 1-7 7h-2Z" fill={C.redD} opacity=".55" />
      <path d="M10 7q-1.5-2 0-4M15 7q-1.5-2 0-4" fill="none" stroke={C.greyD} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
}

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 24, className = '', style, white = false, title }: {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
  /** Render as a flat white glyph (for coloured buttons/nodes) */
  white?: boolean
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
      style={{ ...(white ? { filter: 'brightness(0) invert(1)' } : {}), ...style }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {ICONS[name]}
    </svg>
  )
}
