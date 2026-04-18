import { supabase } from '../lib/supabase'
import type {
  Card,
  CardSet,
  HistoryEntry,
  PendingUpdate,
  Project,
  QuizMode,
  SessionDraft,
} from './types'

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

const REVIEW_INTERVALS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 }

// ── Row → Type mappers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(row: any): Project {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSet(row: any): CardSet {
  return { id: row.id, projectId: row.project_id, name: row.name, createdAt: row.created_at }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCard(row: any): Card {
  return {
    id: row.id,
    setId: row.set_id,
    front: row.front ?? '',
    back: row.back ?? '',
    order: row.order ?? 0,
    createdAt: row.created_at ?? Date.now(),
    reviewStage: row.review_stage ?? 1,
    nextReviewDate: row.next_review_date ?? todayString(),
    history: (row.history as HistoryEntry[]) ?? [],
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []).map(rowToProject)
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  return data ? rowToProject(data) : undefined
}

export async function createProject(name: string): Promise<Project> {
  const project = { id: crypto.randomUUID(), name, created_at: Date.now() }
  await supabase.from('projects').insert(project)
  return rowToProject(project)
}

export async function updateProject(id: string, name: string): Promise<void> {
  await supabase.from('projects').update({ name }).eq('id', id)
}

export async function deleteProject(id: string): Promise<void> {
  // CASCADE handles sets and cards deletion in DB
  await supabase.from('projects').delete().eq('id', id)
}

// ── Sets ──────────────────────────────────────────────────────────────────────

export async function getSets(projectId: string): Promise<CardSet[]> {
  const { data } = await supabase
    .from('sets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(rowToSet)
}

export async function getSet(id: string): Promise<CardSet | undefined> {
  const { data } = await supabase
    .from('sets')
    .select('*')
    .eq('id', id)
    .single()
  return data ? rowToSet(data) : undefined
}

export async function createSet(projectId: string, name: string): Promise<CardSet> {
  const set = { id: crypto.randomUUID(), project_id: projectId, name, created_at: Date.now() }
  await supabase.from('sets').insert(set)
  return rowToSet(set)
}

export async function updateSet(id: string, name: string): Promise<void> {
  await supabase.from('sets').update({ name }).eq('id', id)
}

export async function deleteSet(id: string): Promise<void> {
  // CASCADE handles cards deletion in DB
  await supabase.from('sets').delete().eq('id', id)
}

export async function countCards(setId: string): Promise<number> {
  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('set_id', setId)
  return count ?? 0
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export async function getCards(setId: string): Promise<Card[]> {
  const { data } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('order', { ascending: true })
  return (data ?? []).map(rowToCard)
}

export async function saveCards(
  setId: string,
  rows: { id?: string; front: string; back: string }[]
): Promise<void> {
  const existing = await getCards(setId)
  const existingMap = new Map(existing.map((c) => [c.id, c]))

  const filtered = rows.filter((r) => r.front.trim() || r.back.trim())
  const incomingIds = new Set(filtered.filter((r) => r.id).map((r) => r.id!))
  const toDelete = existing.filter((c) => !incomingIds.has(c.id)).map((c) => c.id)

  // Build upsert rows
  const upserts = filtered.map((row, i) => {
    if (row.id && existingMap.has(row.id)) {
      const orig = existingMap.get(row.id)!
      return {
        id: orig.id,
        set_id: setId,
        front: row.front.trim(),
        back: row.back.trim(),
        order: i,
        created_at: orig.createdAt,
        review_stage: orig.reviewStage,
        next_review_date: orig.nextReviewDate,
        history: orig.history,
      }
    }
    return {
      id: crypto.randomUUID(),
      set_id: setId,
      front: row.front.trim(),
      back: row.back.trim(),
      order: i,
      created_at: Date.now(),
      review_stage: 1,
      next_review_date: addDaysToToday(1),
      history: [],
    }
  })

  await Promise.all([
    upserts.length > 0
      ? supabase.from('cards').upsert(upserts, { onConflict: 'id' })
      : Promise.resolve(),
    toDelete.length > 0
      ? supabase.from('cards').delete().in('id', toDelete)
      : Promise.resolve(),
  ])
}

// ── Quiz queries ──────────────────────────────────────────────────────────────

export async function getDailyQuizCards(setId: string): Promise<Card[]> {
  const today = todayString()
  // createdAt is stored as ms timestamp; compare date portion
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const { data } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .gte('created_at', startOfToday.getTime())
    .lte('created_at', endOfToday.getTime())
    .order('order', { ascending: true })
  return (data ?? []).map(rowToCard)
}

export async function getDailyReviewCards(setId: string): Promise<Card[]> {
  const today = todayString()
  const { data } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .lt('review_stage', 6)
    .lte('next_review_date', today)
    .order('order', { ascending: true })
  return (data ?? []).map(rowToCard)
}

export async function getAllDailyReviewCards(): Promise<Card[]> {
  const today = todayString()
  const { data } = await supabase
    .from('cards')
    .select('*')
    .lt('review_stage', 6)
    .lte('next_review_date', today)
    .order('order', { ascending: true })
  return (data ?? []).map(rowToCard)
}

export async function getCardsByIds(ids: string[]): Promise<Card[]> {
  if (ids.length === 0) return []
  const { data } = await supabase
    .from('cards')
    .select('*')
    .in('id', ids)
  return (data ?? []).map(rowToCard)
}

// ── Session drafts (localStorage — session-only, no sync needed) ──────────────

const DRAFTS_KEY = 'flashcards-drafts-v1'

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

export async function commitSessionUpdates(
  updates: PendingUpdate[],
  mode: ReviewMode
): Promise<void> {
  if (updates.length === 0) return
  const today = todayString()

  const cardIds = updates.map((u) => u.cardId)
  const { data: rows } = await supabase
    .from('cards')
    .select('id, review_stage, history')
    .in('id', cardIds)
  if (!rows) return

  const rowMap = new Map(rows.map((r) => [r.id, r]))

  await Promise.all(
    updates.map(({ cardId, correct }) => {
      const r = rowMap.get(cardId)
      if (!r) return Promise.resolve()

      const entry: HistoryEntry = { date: today, correct }
      const newHistory = [...((r.history as HistoryEntry[]) ?? []), entry]

      if (mode === 'total-test') {
        return supabase
          .from('cards')
          .update({ history: newHistory })
          .eq('id', cardId)
      } else {
        if (correct) {
          const newStage = Math.min(r.review_stage + 1, 6)
          const intervalDays = REVIEW_INTERVALS[newStage]
          const nextDate = newStage >= 6 ? '9999-12-31' : addDaysToToday(intervalDays ?? 30)
          return supabase
            .from('cards')
            .update({ review_stage: newStage, next_review_date: nextDate, history: newHistory })
            .eq('id', cardId)
        } else {
          const newStage = Math.max(r.review_stage - 1, 1)
          return supabase
            .from('cards')
            .update({ review_stage: newStage, next_review_date: addDaysToToday(1), history: newHistory })
            .eq('id', cardId)
        }
      }
    })
  )
}
