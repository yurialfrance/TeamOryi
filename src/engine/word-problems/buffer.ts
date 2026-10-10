// Generate a lesson's word problems AHEAD of time, in the background, so no question ever waits
// on the AI. One story at a time (the engine runs one job at a time and live Tutor/hint requests
// pre-empt it); the lesson takes each story as soon as it is ready.
import type { Question } from '../types'
import type { TopicId } from '../topics'
import type { AiLang } from '../../ai/llm'
import { kindsForTopic, makeSpec, type WPSpec } from './spec'
import { dressSpec, storyQuestion, type DressResult, type StoryModel } from './dress'
import type { WPKind } from '../word-problem-contexts'

export interface WPPlan { topic: TopicId; kind: WPKind }

/** Up to `max` word problems for a lesson, spread over the stage topics that have a story kind */
export function planWordProblems(topics: TopicId[], grade: number, max = 2, r: () => number = Math.random): WPPlan[] {
  const options = [...new Set(topics)].flatMap((topic) => kindsForTopic(topic, grade).map((kind) => ({ topic, kind })))
  if (!options.length) return []
  return Array.from({ length: max }, (_, i) => options[(i + Math.floor(r() * options.length)) % options.length])
}

export type SlotState = 'pending' | 'ready' | 'used' | 'skipped'

export interface StorySlot {
  plan: WPPlan
  state: SlotState
  spec?: WPSpec
  result?: DressResult
  question?: Question
}

/** Background generator for one lesson. `onChange` fires whenever a slot changes state. */
export class StoryBuffer {
  readonly slots: StorySlot[]
  private stopped = false
  private grade: number
  private lang: AiLang
  /** null → no story model on this device: every slot gets the code-written facts (no badge) */
  private model: StoryModel | null
  private onChange: () => void

  constructor(plans: WPPlan[], grade: number, lang: AiLang, model: StoryModel | null, onChange: () => void = () => {}) {
    this.slots = plans.map((plan) => ({ plan, state: 'pending' as SlotState }))
    this.grade = grade
    this.lang = lang
    this.model = model
    this.onChange = onChange
  }

  /** Generate every slot, one after another. Safe to call once; stop() ends it early. */
  async run(): Promise<void> {
    for (const slot of this.slots) {
      if (this.stopped) return
      const spec = makeSpec(slot.plan.kind, slot.plan.topic, this.grade, this.lang)
      if (!spec) { slot.state = 'skipped'; this.onChange(); continue }
      slot.spec = spec
      const result = this.model ? await dressSpec(spec, this.model) : { story: spec.facts, source: 'template' as const, attempts: 0, rejected: [] }
      if (this.stopped) return
      if (!result) {
        // no AI text at all (busy / interrupted / unloaded): the lesson keeps its own question
        slot.state = 'skipped'
      } else {
        slot.result = result
        slot.question = storyQuestion(spec, result)
        slot.state = 'ready'
      }
      this.onChange()
    }
  }

  stop() { this.stopped = true }

  /** The next ready story, without taking it */
  peek(): Question | null {
    return this.slots.find((s) => s.state === 'ready')?.question ?? null
  }

  /** Take the next ready story (marks it used). Doesn't fire onChange — only generation progress does,
   *  so a listener that places stories can call take() without re-entering itself. */
  take(): Question | null {
    const slot = this.slots.find((s) => s.state === 'ready')
    if (!slot?.question) return null
    slot.state = 'used'
    return slot.question
  }

  get pending() { return this.slots.filter((s) => s.state === 'pending').length }
  get ready() { return this.slots.filter((s) => s.state === 'ready').length }
}
