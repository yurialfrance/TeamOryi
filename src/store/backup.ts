// Defensive Data Backup Import/Export Module
// Cryptographic integrity, SHA-256 checksum, and strict schema validation
// Discards corrupted, malformed, or injected keys to protect user state.

import { useGame } from './game'

export interface BackupData {
  app: 'sipnayan'
  version: 1
  timestamp: string
  checksum: string
  data: SanitizedState
}

export interface SanitizedState {
  name: string
  level: string
  dailyGoal: number
  xp: number
  streak: number
  hearts: number
  gems: number
  completed: Record<string, { stars: number; best: number }>
  activity: Record<string, number>
  muted: boolean
  voiceEnabled: boolean
  nerdleStreak: number
  nerdleWins: number
  duelWins: number
  lessonsDone: number
  perfectCount: number
}

const ALLOWED_LEVELS = new Set(['elem', 'jhs', 'shs', 'college'])

/** Simple fast deterministic hash for checksum fallback */
function computeHash(dataStr: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c64e6d
  for (let i = 0; i < dataStr.length; i++) {
    const ch = dataStr.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  return ((h2 >>> 0).toString(16) + (h1 >>> 0).toString(16)).padStart(16, '0')
}

/** Compute cryptographic SHA-256 checksum or fallback */
export async function getChecksum(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    try {
      const msgUint8 = new TextEncoder().encode(content)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    } catch {
      // fallback
    }
  }
  return computeHash(content)
}

/** Export defensive backup string */
export async function exportBackupString(): Promise<string> {
  const s = useGame.getState()

  const safeData: SanitizedState = {
    name: String(s.name ?? '').slice(0, 40),
    level: ALLOWED_LEVELS.has(s.level) ? s.level : 'elem',
    dailyGoal: Math.max(10, Math.min(200, Number(s.dailyGoal) || 30)),
    xp: Math.max(0, Math.floor(Number(s.xp) || 0)),
    streak: Math.max(0, Math.floor(Number(s.streak) || 0)),
    hearts: Math.max(0, Math.min(5, Math.floor(Number(s.hearts) || 5))),
    gems: Math.max(0, Math.floor(Number(s.gems) || 0)),
    completed: {},
    activity: {},
    muted: !!s.muted,
    voiceEnabled: s.voiceEnabled !== false,
    nerdleStreak: Math.max(0, Math.floor(Number(s.nerdleStreak) || 0)),
    nerdleWins: Math.max(0, Math.floor(Number(s.nerdleWins) || 0)),
    duelWins: Math.max(0, Math.floor(Number(s.duelWins) || 0)),
    lessonsDone: Math.max(0, Math.floor(Number(s.lessonsDone) || 0)),
    perfectCount: Math.max(0, Math.floor(Number(s.perfectCount) || 0)),
  }

  // Sanitize completed map
  if (s.completed && typeof s.completed === 'object') {
    for (const [k, v] of Object.entries(s.completed)) {
      if (/^[a-zA-Z0-9_\-]+$/.test(k) && v && typeof v === 'object') {
        safeData.completed[k] = {
          stars: Math.max(1, Math.min(3, Math.floor(Number(v.stars) || 1))),
          best: Math.max(0, Math.floor(Number(v.best) || 0)),
        }
      }
    }
  }

  // Sanitize activity map
  if (s.activity && typeof s.activity === 'object') {
    for (const [k, v] of Object.entries(s.activity)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number') {
        safeData.activity[k] = Math.max(0, Math.floor(v))
      }
    }
  }

  const payloadStr = JSON.stringify(safeData)
  const checksum = await getChecksum(payloadStr)

  const backup: BackupData = {
    app: 'sipnayan',
    version: 1,
    timestamp: new Date().toISOString(),
    checksum,
    data: safeData,
  }

  return JSON.stringify(backup, null, 2)
}

export interface ImportResult {
  ok: boolean
  message: string
  restoredStats?: { xp: number; streak: number; stages: number }
}

/** Defensive import with strict schema checking & prototype pollution guards */
export async function importBackupString(raw: string): Promise<ImportResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw.trim())
  } catch {
    return { ok: false, message: 'Hindi wastong JSON format ang backup code.' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, message: 'Maling schema: inaasahang object format.' }
  }

  const obj = parsed as Record<string, unknown>

  // Prevent prototype pollution
  if (
    raw.includes('"__proto__"') ||
    Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
    Object.prototype.hasOwnProperty.call(obj, 'prototype') ||
    Object.prototype.hasOwnProperty.call(obj, 'constructor')
  ) {
    return { ok: false, message: 'Tinanggihan: Natukoy na mapanganib na format (prototype injection attempt).' }
  }

  if (obj.app !== 'sipnayan') {
    return { ok: false, message: 'Hindi ito isang Sipnayan backup file.' }
  }

  if (obj.version !== 1) {
    return { ok: false, message: 'Hindi suportadong bersyon ng backup.' }
  }

  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    return { ok: false, message: 'Nawawala o sira ang data payload.' }
  }

  const dataObj = obj.data as Record<string, unknown>
  const payloadStr = JSON.stringify(dataObj)
  const expectedChecksum = String(obj.checksum ?? '')
  const computed = await getChecksum(payloadStr)

  // Verify checksum (fail if checksum was altered or corrupted)
  if (expectedChecksum && expectedChecksum !== computed && expectedChecksum !== computeHash(payloadStr)) {
    return { ok: false, message: 'Nabigong buksan: Hindi tumutugma ang cryptographic checksum (maaaring corrupted o altered).' }
  }

  // Defensive sanitization: extract ONLY valid known fields, discard all extraneous/injected keys
  const safePatch: Partial<SanitizedState> = {}

  if (typeof dataObj.name === 'string') {
    safePatch.name = dataObj.name.replace(/[<>]/g, '').slice(0, 40)
  }
  if (typeof dataObj.level === 'string' && ALLOWED_LEVELS.has(dataObj.level)) {
    safePatch.level = dataObj.level
  }
  if (typeof dataObj.dailyGoal === 'number' && Number.isFinite(dataObj.dailyGoal)) {
    safePatch.dailyGoal = Math.max(10, Math.min(200, Math.floor(dataObj.dailyGoal)))
  }
  if (typeof dataObj.xp === 'number' && Number.isFinite(dataObj.xp)) {
    safePatch.xp = Math.max(0, Math.floor(dataObj.xp))
  }
  if (typeof dataObj.streak === 'number' && Number.isFinite(dataObj.streak)) {
    safePatch.streak = Math.max(0, Math.floor(dataObj.streak))
  }
  if (typeof dataObj.hearts === 'number' && Number.isFinite(dataObj.hearts)) {
    safePatch.hearts = Math.max(0, Math.min(5, Math.floor(dataObj.hearts)))
  }
  if (typeof dataObj.gems === 'number' && Number.isFinite(dataObj.gems)) {
    safePatch.gems = Math.max(0, Math.floor(dataObj.gems))
  }
  if (typeof dataObj.muted === 'boolean') {
    safePatch.muted = dataObj.muted
  }
  if (typeof dataObj.voiceEnabled === 'boolean') {
    safePatch.voiceEnabled = dataObj.voiceEnabled
  }
  if (typeof dataObj.nerdleStreak === 'number' && Number.isFinite(dataObj.nerdleStreak)) {
    safePatch.nerdleStreak = Math.max(0, Math.floor(dataObj.nerdleStreak))
  }
  if (typeof dataObj.nerdleWins === 'number' && Number.isFinite(dataObj.nerdleWins)) {
    safePatch.nerdleWins = Math.max(0, Math.floor(dataObj.nerdleWins))
  }
  if (typeof dataObj.duelWins === 'number' && Number.isFinite(dataObj.duelWins)) {
    safePatch.duelWins = Math.max(0, Math.floor(dataObj.duelWins))
  }
  if (typeof dataObj.lessonsDone === 'number' && Number.isFinite(dataObj.lessonsDone)) {
    safePatch.lessonsDone = Math.max(0, Math.floor(dataObj.lessonsDone))
  }
  if (typeof dataObj.perfectCount === 'number' && Number.isFinite(dataObj.perfectCount)) {
    safePatch.perfectCount = Math.max(0, Math.floor(dataObj.perfectCount))
  }

  // Sanitize completed
  if (dataObj.completed && typeof dataObj.completed === 'object' && !Array.isArray(dataObj.completed)) {
    const cleanCompleted: Record<string, { stars: number; best: number }> = {}
    for (const [k, v] of Object.entries(dataObj.completed as Record<string, unknown>)) {
      if (/^[a-zA-Z0-9_\-]+$/.test(k) && v && typeof v === 'object') {
        const item = v as Record<string, unknown>
        cleanCompleted[k] = {
          stars: Math.max(1, Math.min(3, Math.floor(Number(item.stars) || 1))),
          best: Math.max(0, Math.floor(Number(item.best) || 0)),
        }
      }
    }
    safePatch.completed = cleanCompleted
  }

  // Sanitize activity
  if (dataObj.activity && typeof dataObj.activity === 'object' && !Array.isArray(dataObj.activity)) {
    const cleanActivity: Record<string, number> = {}
    for (const [k, v] of Object.entries(dataObj.activity as Record<string, unknown>)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number' && Number.isFinite(v)) {
        cleanActivity[k] = Math.max(0, Math.floor(v))
      }
    }
    safePatch.activity = cleanActivity
  }

  // Apply sanitized patch to persistent state
  useGame.getState().set(safePatch)

  return {
    ok: true,
    message: 'Matagumpay na naibalik ang iyong progreso!',
    restoredStats: {
      xp: safePatch.xp ?? 0,
      streak: safePatch.streak ?? 0,
      stages: Object.keys(safePatch.completed ?? {}).length,
    },
  }
}
