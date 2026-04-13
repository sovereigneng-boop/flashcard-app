import type {
  Card,
  CardSet,
  HistoryEntry,
  PendingUpdate,
  Project,
  QuizMode,
  SessionDraft,
} from './types'

const KEY = 'flashcards-v2'
const DRAFTS_KEY = 'flashcards-drafts-v1'

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayString(): string {
  return formatDate(new Date())
}

function addDaysToToday(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

function timestampToDateString(ts: number): string {
  return formatDate(new Date(ts))
}

/** Days to wait after passing each stage before the next review. */
const REVIEW_INTERVALS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 }

// ── Main data storage ─────────────────────────────────────────────────────────

interface Data {
  projects: Project[]
  sets: CardSet[]
  cards: Card[]
}

function load(): Data {
  if (typeof window === 'undefined') return { projects: [], sets: [], cards: [] }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Data
      parsed.cards = (parsed.cards ?? []).map((c) => {
        const raw = c as unknown as Record<string, unknown>
        return {
          id: raw.id as string,
          setId: raw.setId as string,
          front: (raw.front as string) ?? '',
          back: (raw.back as string) ?? '',
          order: (raw.order as number) ?? 0,
          createdAt: (raw.createdAt as number) ?? Date.now(),
          reviewStage: (raw.reviewStage as number) ?? 1,
          nextReviewDate: (raw.nextReviewDate as string) ?? todayString(),
          history: (raw.history as HistoryEntry[]) ?? [],
        }
      })
      return parsed
    }
  } catch {}
  return { projects: [], sets: [], cards: [] }
}

function save(data: Data): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  return load().projects.sort((a, b) => b.createdAt - a.createdAt)
}

export function getProject(id: string): Project | undefined {
  return load().projects.find((p) => p.id === id)
}

export function createProject(name: string): Project {
  const data = load()
  const project: Project = { id: crypto.randomUUID(), name, createdAt: Date.now() }
  data.projects.push(project)
  save(data)
  return project
}

export function updateProject(id: string, name: string): void {
  const data = load()
  data.projects = data.projects.map((p) => (p.id === id ? { ...p, name } : p))
  save(data)
}

export function deleteProject(id: string): void {
  const data = load()
  const setIds = new Set(data.sets.filter((s) => s.projectId === id).map((s) => s.id))
  data.projects = data.projects.filter((p) => p.id !== id)
  data.sets = data.sets.filter((s) => s.projectId !== id)
  data.cards = data.cards.filter((c) => !setIds.has(c.setId))
  save(data)
}

// ── Sets ──────────────────────────────────────────────────────────────────────

export function getSets(projectId: string): CardSet[] {
  return load().sets
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getSet(id: string): CardSet | undefined {
  return load().sets.find((s) => s.id === id)
}

export function createSet(projectId: string, name: string): CardSet {
  const data = load()
  const set: CardSet = { id: crypto.randomUUID(), projectId, name, createdAt: Date.now() }
  data.sets.push(set)
  save(data)
  return set
}

export function updateSet(id: string, name: string): void {
  const data = load()
  data.sets = data.sets.map((s) => (s.id === id ? { ...s, name } : s))
  save(data)
}

export function deleteSet(id: string): void {
  const data = load()
  data.sets = data.sets.filter((s) => s.id !== id)
  data.cards = data.cards.filter((c) => c.setId !== id)
  save(data)
}

export function countCards(setId: string): number {
  return load().cards.filter((c) => c.setId === setId).length
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export function getCards(setId: string): Card[] {
  return load().cards.filter((c) => c.setId === setId).sort((a, b) => a.order - b.order)
}

export function saveCards(setId: string, rows: { id?: string; front: string; back: string }[]): void {
  const data = load()
  const existing = new Map(data.cards.filter((c) => c.setId === setId).map((c) => [c.id, c]))
  data.cards = data.cards.filter((c) => c.setId !== setId)

  const newCards: Card[] = rows
    .filter((r) => r.front.trim() || r.back.trim())
    .map((r, i) => {
      if (r.id && existing.has(r.id)) {
        const orig = existing.get(r.id)!
        return { ...orig, front: r.front.trim(), back: r.back.trim(), order: i }
      }
      return {
        id: crypto.randomUUID(),
        setId,
        front: r.front.trim(),
        back: r.back.trim(),
        order: i,
        createdAt: Date.now(),
        reviewStage: 1,
        nextReviewDate: addDaysToToday(1),
        history: [],
      }
    })

  data.cards.push(...newCards)
  save(data)
}

// ── Quiz queries ──────────────────────────────────────────────────────────────

export function getDailyQuizCards(setId: string): Card[] {
  const today = todayString()
  return load().cards
    .filter((c) => c.setId === setId && timestampToDateString(c.createdAt) === today)
    .sort((a, b) => a.order - b.order)
}

export function getDailyReviewCards(setId: string): Card[] {
  const today = todayString()
  return load().cards
    .filter((c) => c.setId === setId && c.reviewStage < 6 && c.nextReviewDate <= today)
    .sort((a, b) => a.order - b.order)
}

// ── Session drafts ────────────────────────────────────────────────────────────

function loadDrafts(): Record<string, SessionDraft> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    if (raw) return JSON.parse(raw) as Record<string, SessionDraft>
  } catch {}
  return {}
}

function saveDrafts(drafts: Record<string, SessionDraft>): void {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
}

function draftKey(setId: string, mode: QuizMode): string {
  return `${setId}::${mode}`
}

export function saveSessionDraft(draft: SessionDraft): void {
  const drafts = loadDrafts()
  drafts[draftKey(draft.setId, draft.mode)] = draft
  saveDrafts(drafts)
}

export function getSessionDraft(setId: string, mode: QuizMode): SessionDraft | null {
  return loadDrafts()[draftKey(setId, mode)] ?? null
}

export function clearSessionDraft(setId: string, mode: QuizMode): void {
  const drafts = loadDrafts()
  delete drafts[draftKey(setId, mode)]
  saveDrafts(drafts)
}

// ── Commit buffered updates ───────────────────────────────────────────────────

export type ReviewMode = 'daily-review' | 'total-test'

/**
 * Apply all buffered O/X answers to the store at once.
 * Called only when a session is fully completed or mid-saved and then resumed+completed.
 * For daily-quiz, updates are never committed (session-only).
 */
export function commitSessionUpdates(updates: PendingUpdate[], mode: ReviewMode): void {
  if (updates.length === 0) return
  const data = load()
  const today = todayString()

  for (const { cardId, correct } of updates) {
    const idx = data.cards.findIndex((c) => c.id === cardId)
    if (idx === -1) continue
    const c = data.cards[idx]
    const entry: HistoryEntry = { date: today, correct }
    const newHistory = [...c.history, entry]

    if (mode === 'total-test') {
      data.cards[idx] = { ...c, history: newHistory }
    } else {
      // daily-review
      if (correct) {
        const newStage = Math.min(c.reviewStage + 1, 6)
        const intervalDays = REVIEW_INTERVALS[c.reviewStage]
        const nextDate = newStage >= 6 ? '9999-12-31' : addDaysToToday(intervalDays ?? 30)
        data.cards[idx] = { ...c, reviewStage: newStage, nextReviewDate: nextDate, history: newHistory }
      } else {
        const newStage = Math.max(c.reviewStage - 1, 1)
        data.cards[idx] = { ...c, reviewStage: newStage, nextReviewDate: addDaysToToday(1), history: newHistory }
      }
    }
  }

  save(data)
}
