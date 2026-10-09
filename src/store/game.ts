import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { World } from '../curriculum/worlds'

export const MAX_HEARTS = 5

export const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
const yesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA')
}

export type Screen = 'onboarding' | 'path' | 'lesson' | 'complete' | 'tutor' | 'profile' | 'quests'

export const REFILL_COST = 30
export const CHEST_GEMS = 20

export interface LessonResult {
  stageId: string
  correct: number
  total: number
  xp: number
  seconds: number
  streakUp: boolean
  failed: boolean
  bestCombo: number
}

interface Persisted {
  onboarded: boolean
  name: string
  level: World['id']
  dailyGoal: number
  xp: number
  todayXp: number
  todayDate: string
  streak: number
  lastLessonDate: string | null
  hearts: number
  completed: Record<string, { stars: number; best: number }>
  activity: Record<string, number> // date → xp
  history: string[]
  aiEnabled: boolean
  aiModel: string
  aiLang: 'taglish' | 'english'
  muted: boolean
  gems: number
  todayLessons: number
  todayBestCombo: number
  todayPerfect: number
  claimed: Record<string, string> // questId → date claimed
  openedChests: string[]
  perfectCount: number
  lessonsDone: number
}

interface Volatile {
  screen: Screen
  stageId: string | null
  result: LessonResult | null
}

interface Actions {
  set: (p: Partial<Persisted & Volatile>) => void
  go: (screen: Screen) => void
  startLesson: (stageId: string) => void
  loseHeart: () => void
  refillHearts: () => void
  finishLesson: (r: Omit<LessonResult, 'streakUp'>) => void
  openChest: (id: string) => boolean
  claimQuest: (id: string, gems: number) => void
  buyRefill: () => boolean
  pushHistory: (latex: string) => void
  isUnlocked: (worldStages: { id: string }[], index: number) => boolean
  reset: () => void
}

const initial: Persisted = {
  onboarded: false,
  name: '',
  level: 'elem',
  dailyGoal: 30,
  xp: 0,
  todayXp: 0,
  todayDate: today(),
  streak: 0,
  lastLessonDate: null,
  hearts: MAX_HEARTS,
  completed: {},
  activity: {},
  history: [],
  aiEnabled: false,
  aiModel: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  aiLang: 'taglish',
  muted: false,
  gems: 100,
  todayLessons: 0,
  todayBestCombo: 0,
  todayPerfect: 0,
  claimed: {},
  openedChests: [],
  perfectCount: 0,
  lessonsDone: 0,
}

export const useGame = create<Persisted & Volatile & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      screen: 'onboarding',
      stageId: null,
      result: null,

      set: (p) => set(p),
      go: (screen) => set({ screen }),
      startLesson: (stageId) => set({ stageId, screen: 'lesson', result: null }),
      loseHeart: () => set((s) => ({ hearts: Math.max(0, s.hearts - 1) })),
      refillHearts: () => set({ hearts: MAX_HEARTS }),

      finishLesson: (r) => {
        const s = get()
        const d = today()
        let streak = s.streak
        let streakUp = false
        if (!r.failed) {
          if (s.lastLessonDate === d) {
            /* already counted today */
          } else if (s.lastLessonDate === yesterday()) {
            streak += 1
            streakUp = true
          } else {
            streak = 1
            streakUp = true
          }
        }
        const sameDay = s.todayDate === d
        const todayXp = (sameDay ? s.todayXp : 0) + r.xp
        const perfect = !r.failed && r.correct === r.total
        const acc = r.total ? r.correct / r.total : 0
        const stars = r.failed ? 0 : acc === 1 ? 3 : acc >= 0.8 ? 2 : 1
        const prev = s.completed[r.stageId]
        const completed = r.failed
          ? s.completed
          : { ...s.completed, [r.stageId]: { stars: Math.max(stars, prev?.stars ?? 0), best: Math.max(acc, prev?.best ?? 0) } }
        set({
          xp: s.xp + r.xp,
          todayXp,
          todayDate: d,
          todayLessons: (sameDay ? s.todayLessons : 0) + (r.failed ? 0 : 1),
          todayBestCombo: Math.max(sameDay ? s.todayBestCombo : 0, r.bestCombo),
          todayPerfect: (sameDay ? s.todayPerfect : 0) + (perfect ? 1 : 0),
          perfectCount: s.perfectCount + (perfect ? 1 : 0),
          lessonsDone: s.lessonsDone + (r.failed ? 0 : 1),
          streak,
          lastLessonDate: r.failed ? s.lastLessonDate : d,
          completed,
          activity: { ...s.activity, [d]: (s.activity[d] ?? 0) + r.xp },
          result: { ...r, streakUp },
          screen: 'complete',
        })
      },

      openChest: (id) => {
        const s = get()
        if (s.openedChests.includes(id)) return false
        set({ openedChests: [...s.openedChests, id], gems: s.gems + CHEST_GEMS })
        return true
      },
      claimQuest: (id, gems) => set((s) => ({ claimed: { ...s.claimed, [id]: today() }, gems: s.gems + gems })),
      buyRefill: () => {
        const s = get()
        if (s.gems < REFILL_COST) return false
        set({ gems: s.gems - REFILL_COST, hearts: MAX_HEARTS })
        return true
      },

      pushHistory: (latex) =>
        set((s) => ({ history: [latex, ...s.history.filter((h) => h !== latex)].slice(0, 16) })),

      isUnlocked: (stages, index) => index === 0 || !!get().completed[stages[index - 1].id],

      reset: () => set({ ...initial, screen: 'onboarding', stageId: null, result: null }),
    }),
    {
      name: 'sipnayan-v1',
      partialize: (s) => {
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(s)) if (typeof v !== 'function' && !['screen', 'stageId', 'result'].includes(k)) out[k] = v
        return out as Partial<Persisted>
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (state.todayDate !== today()) {
          state.todayXp = 0
          state.todayLessons = 0
          state.todayBestCombo = 0
          state.todayPerfect = 0
          state.todayDate = today()
          state.hearts = MAX_HEARTS // daily refill
        }
        if (state.lastLessonDate && state.lastLessonDate !== today() && state.lastLessonDate !== yesterday()) state.streak = 0
        if ((state.aiLang as string) === 'filipino') state.aiLang = 'taglish'
        state.screen = state.onboarded ? 'path' : 'onboarding'
      },
    },
  ),
)
