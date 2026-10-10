import type { IconName } from '../components/Icon'
import { WORLDS } from '../curriculum/worlds'
import { today, useGame } from './game'

type S = ReturnType<typeof useGame.getState>

export interface Quest {
  id: string
  title: string
  icon: IconName
  target: number
  progress: (s: S) => number
  gems: number
}

export const dailyQuests = (s: S): Quest[] => [
  { id: 'xp', title: `Kumita ng ${s.dailyGoal} XP`, icon: 'sun', target: s.dailyGoal, progress: (x) => x.todayXp, gems: 10 },
  { id: 'combo', title: 'Makakuha ng 5 sunod-sunod na tama', icon: 'bolt', target: 5, progress: (x) => x.todayBestCombo, gems: 10 },
  { id: 'lessons', title: 'Tapusin ang 2 stages', icon: 'target', target: 2, progress: (x) => x.todayLessons, gems: 15 },
  { id: 'perfect', title: 'Mag-perfect ng 1 lesson', icon: 'crown', target: 1, progress: (x) => x.todayPerfect, gems: 20 },
]

export const isClaimed = (s: S, id: string) => s.claimed[id] === today()

export interface Achievement {
  id: string
  title: string
  desc: string
  icon: IconName
  color: string
  done: (s: S) => boolean
  /** 0..1 — how close the learner is, for a gradually-coloring-in badge */
  progress: (s: S) => number
  /** mascot badge artwork (public/mascot/badge-<art>.webp) when it differs from the id */
  art?: string
}

/** One badge per island. Islands that inherited an old band's stages keep its artwork. */
const ISLAND_BADGE: Record<string, string> = {
  grade1: 'Batang Bilangero', grade2: 'Suki ng Tindahan', grade3: 'Bida sa Piyesta', grade4: 'Pizza Master', grade5: 'Karinderya Chef',
  grade6: 'Barkada Boss', grade7: 'Timbangan Pro', grade8: 'Negosyante', grade9: 'Quadratic Hero', grade10: 'Bilog Master',
  shs: 'Ipon Hari', genmath: 'Logic Lodi', stats: 'Data Detective', stem: 'Calculus Rookie', college: 'Kalikasan', mmw: 'Modern Math Master',
}
const BADGE_ART_FOR: Record<string, string> = { grade4: 'elem', grade7: 'jhs', shs: 'shs', college: 'college' }

const worldDone = (s: S, id: string) => WORLDS.find((w) => w.id === id)!.stages.every((st) => s.completed[st.id])
const worldProgress = (s: S, id: string) => {
  const stages = WORLDS.find((w) => w.id === id)!.stages
  return stages.filter((st) => s.completed[st.id]).length / stages.length
}
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'Unang Hakbang', desc: 'Tapusin ang unang stage', icon: 'steps', color: '#FF8FB1', done: (s) => s.lessonsDone >= 1, progress: (s) => clamp01(s.lessonsDone / 1) },
  { id: 'fire', title: 'Nag-aapoy', desc: '3-day streak', icon: 'flame', color: '#FF8A1F', done: (s) => s.streak >= 3, progress: (s) => clamp01(s.streak / 3) },
  { id: 'perfect', title: 'Perpekto', desc: 'Isang perfect lesson', icon: 'crown', color: '#FFC83D', done: (s) => s.perfectCount >= 1, progress: (s) => clamp01(s.perfectCount / 1) },
  { id: 'chest', title: 'Kolektor', desc: 'Magbukas ng 3 chest', icon: 'chest', color: '#D9893D', done: (s) => s.openedChests.length >= 3, progress: (s) => clamp01(s.openedChests.length / 3) },
  ...WORLDS.map((w): Achievement => ({
    id: w.id, title: ISLAND_BADGE[w.id] ?? w.name, desc: `Tapusin ang ${w.tier === 'grade' ? `${w.level} island` : w.name}`,
    icon: w.icon, color: w.color, art: BADGE_ART_FOR[w.id],
    done: (s) => worldDone(s, w.id), progress: (s) => worldProgress(s, w.id),
  })),
  { id: 'scholar', title: 'Iskolar', desc: 'Kumita ng 500 XP', icon: 'book', color: '#1F4FD1', done: (s) => s.xp >= 500, progress: (s) => clamp01(s.xp / 500) },
]
