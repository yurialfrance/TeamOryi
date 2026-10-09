import { useState } from 'react'

export type Mood =
  | 'wave' | 'bow' | 'peek' | 'sign' | 'point' | 'phone' | 'think' | 'typing' | 'read' | 'confused' | 'eureka' | 'number'
  | 'seesaw' | 'pizza' | 'piggybank' | 'sunflower' | 'jump' | 'thumbsup' | 'clap' | 'dance' | 'star' | 'sad' | 'oops'
  | 'determined' | 'pat' | 'shrug' | 'flame' | 'medal' | 'coins' | 'trophy' | 'rocket' | 'heart' | 'sleep' | 'splash'
  | 'backpack' | 'tutor' | 'calendar' | 'bye'

/** Team Oryi mascot art lives in /public/mascot/<mood>.webp (converted from the Canva SVGs) */
const missing = new Set<string>()

export function Pipo({ mood = 'wave', size = 120, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const [failed, setFailed] = useState(missing.has(mood))
  if (!failed) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}mascot/${mood}.webp`}
        width={size}
        height={size}
        alt="Pipo"
        draggable={false}
        className={`object-contain select-none ${className}`}
        onError={() => { missing.add(mood); setFailed(true) }}
      />
    )
  }
  return <PipoSvg mood={mood} size={size} className={className} />
}

/** Hexagon achievement badge art (falls back to null if missing) */
export const BADGE_ART = new Set(['first', 'fire', 'perfect', 'chest', 'elem', 'jhs', 'college', 'scholar', 'shs'])

/** Placeholder vector Pipo until the generated artwork arrives */
export function PipoSvg({ mood, size, className = '' }: { mood: Mood; size: number; className?: string }) {
  const happy = ['wave', 'jump', 'thumbsup', 'eureka', 'trophy', 'flame', 'tutor', 'phone', 'pat'].includes(mood)
  const closedEyes = ['jump', 'trophy', 'sleep'].includes(mood)
  const sad = mood === 'sad' || mood === 'oops'
  const thinking = ['think', 'confused', 'read'].includes(mood)
  const ink = '#B4466B'
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`select-none ${className}`} aria-label="Pipo the pig">
      <ellipse cx="60" cy="113" rx="30" ry="5" fill="#000" opacity=".08" />
      {/* body */}
      <ellipse cx="60" cy="92" rx="26" ry="20" fill="#FFB3C9" stroke={ink} strokeWidth="2" />
      {/* tail */}
      <path d="M85 92c6-2 8 4 4 6s-6-3-2-5" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      {/* feet */}
      <ellipse cx="47" cy="110" rx="7" ry="4" fill="#FF9DBA" stroke={ink} strokeWidth="1.6" />
      <ellipse cx="73" cy="110" rx="7" ry="4" fill="#FF9DBA" stroke={ink} strokeWidth="1.6" />
      {/* arms */}
      {mood === 'wave' || mood === 'jump' || mood === 'trophy' ? (
        <>
          <path d="M37 84 C28 74 26 66 30 60" stroke={ink} strokeWidth="2" fill="#FFB3C9" strokeLinecap="round" />
          <ellipse cx="30" cy="58" rx="5" ry="5" fill="#FFB3C9" stroke={ink} strokeWidth="1.8" />
          {mood !== 'wave' && <ellipse cx="90" cy="58" rx="5" ry="5" fill="#FFB3C9" stroke={ink} strokeWidth="1.8" />}
        </>
      ) : null}
      {/* neckerchief */}
      <path d="M38 74 Q60 84 82 74 L66 92 Q60 96 54 92 Z" fill="#2F6BFF" stroke="#1F4FD1" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="60" cy="83" r="4.2" fill="#FFC83D" stroke="#E5A800" strokeWidth="1" />
      {/* ears */}
      <path d="M28 28 C20 12 34 6 44 18 Z" fill="#FFB3C9" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M92 28 C100 12 86 6 76 18 Z" fill="#FFB3C9" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M31 25 C27 16 34 13 40 19 Z" fill="#FF8FB1" />
      <path d="M89 25 C93 16 86 13 80 19 Z" fill="#FF8FB1" />
      {/* head */}
      <ellipse cx="60" cy="48" rx="36" ry="31" fill="#FFC2D4" stroke={ink} strokeWidth="2" />
      {/* freckles */}
      {[[54, 24], [60, 22], [66, 24], [57, 28], [63, 28]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.1" fill="#F28CAB" />)}
      {/* cheeks */}
      <ellipse cx="34" cy="56" rx="7" ry="4.5" fill="#FF8FB1" opacity=".6" />
      <ellipse cx="86" cy="56" rx="7" ry="4.5" fill="#FF8FB1" opacity=".6" />
      {/* eyes */}
      {closedEyes ? (
        <>
          <path d="M38 44 q6 -7 12 0" stroke="#2B2233" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M70 44 q6 -7 12 0" stroke="#2B2233" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="44" cy={thinking ? 41 : 44} rx="6" ry="7" fill="#2B2233" />
          <ellipse cx="76" cy={thinking ? 41 : 44} rx="6" ry="7" fill="#2B2233" />
          <circle cx={thinking ? 46 : 46} cy={thinking ? 38 : 41} r="2.2" fill="#fff" />
          <circle cx={78} cy={thinking ? 38 : 41} r="2.2" fill="#fff" />
        </>
      )}
      {sad && (
        <>
          <path d="M37 33 l10 3" stroke="#2B2233" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M83 33 l-10 3" stroke="#2B2233" strokeWidth="2.2" strokeLinecap="round" />
          {mood === 'sad' && <path d="M38 52 q-3 6 0 8 q3 -2 0 -8" fill="#7CC8FF" />}
        </>
      )}
      {mood === 'determined' && (
        <>
          <path d="M36 33 l11 5" stroke="#2B2233" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M84 33 l-11 5" stroke="#2B2233" strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}
      {/* snout */}
      <ellipse cx="60" cy="58" rx="14" ry="10" fill="#FF9DBA" stroke={ink} strokeWidth="2" />
      <ellipse cx="55" cy="58" rx="2.6" ry="3.6" fill={ink} />
      <ellipse cx="65" cy="58" rx="2.6" ry="3.6" fill={ink} />
      {/* mouth */}
      {happy ? (
        <path d="M51 69 q9 9 18 0 q-9 4 -18 0" fill="#E2477A" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
      ) : sad ? (
        <path d="M52 73 q8 -6 16 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      ) : mood === 'sleep' ? (
        <ellipse cx="60" cy="71" rx="3" ry="2" fill={ink} />
      ) : (
        <path d="M54 70 q6 3 12 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      )}
      {/* extras */}
      {thinking && mood !== 'read' && <text x="94" y="20" fontSize="20" fontWeight="900" fill="#2F6BFF">?</text>}
      {mood === 'confused' && <path d="M92 36 q3 5 0 7 q-3 -2 0 -7" fill="#7CC8FF" />}
      {mood === 'eureka' && (
        <g transform="translate(88 2)">
          <path d="M8 0a8 8 0 0 0-4.5 14.6V17h9v-2.4A8 8 0 0 0 8 0Z" fill="#FFC83D" stroke="#E5A800" strokeWidth="1.2" />
          <rect x="4" y="17.5" width="8" height="3" rx="1.2" fill="#9C93A6" />
          <path d="M-3 4l-3-2M19 4l3-2M-4 10h-3M20 10h3" stroke="#FFC83D" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {mood === 'sleep' && <text x="88" y="22" fontSize="16" fontWeight="900" fill="#7A6F85">Zz</text>}
      {(mood === 'jump' || mood === 'trophy') && (
        <>
          <path d="M10 6c.6 4 1.8 5.2 5.8 5.8-4 .6-5.2 1.8-5.8 5.8-.6-4-1.8-5.2-5.8-5.8 4-.6 5.2-1.8 5.8-5.8Z" fill="#FFC83D" />
          <path d="M104 4c.4 2.6 1.2 3.4 3.8 3.8-2.6.4-3.4 1.2-3.8 3.8-.4-2.6-1.2-3.4-3.8-3.8 2.6-.4 3.4-1.2 3.8-3.8Z" fill="#2F6BFF" />
        </>
      )}
      {mood === 'flame' && (
        <g transform="translate(90 2) scale(.75)">
          <path d="M16 2c3 5 10 8 10 17a10 10 0 0 1-20 0c0-5 3-8 5-10 0 3 1 5 3 6 0-5 0-9 2-13Z" fill="#FF8A1F" />
          <path d="M16 14c3 3 6 5 6 9a6 6 0 0 1-12 0c0-3 2-4 3-5 0 2 1 3 2 3 0-3 0-5 1-7Z" fill="#FFC83D" />
        </g>
      )}
      {mood === 'thumbsup' && (
        <>
          <path d="M83 84 C92 76 94 68 92 62" stroke="#B4466B" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="92" cy="60" rx="5.5" ry="5" fill="#FFB3C9" stroke="#B4466B" strokeWidth="1.8" />
          <path d="M92 55v-5" stroke="#B4466B" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
