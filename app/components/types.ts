export interface Project {
  id: string
  name: string
  createdAt: number
}

export interface CardSet {
  id: string
  projectId: string
  name: string
  createdAt: number
}

export interface HistoryEntry {
  date: string      // "YYYY-MM-DD"
  correct: boolean
}

export interface Card {
  id: string
  setId: string
  front: string
  back: string
  order: number
  createdAt: number         // timestamp — never changes after creation
  reviewStage: number       // 1–6; 6 = graduated
  nextReviewDate: string    // "YYYY-MM-DD"
  history: HistoryEntry[]
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

export type QuizMode = 'daily-quiz' | 'daily-review' | 'total-test'

/** One card answer buffered during a quiz session (not yet written to store). */
export interface PendingUpdate {
  cardId: string
  correct: boolean
}

/** In-memory snapshot of a quiz session, used for mid-save drafts. */
export interface QuizSessionState {
  queue: Card[]
  correctCount: number
  wrongCount: number
  answeredCount: number
  pendingUpdates: PendingUpdate[]
}

/** Persisted draft in localStorage. */
export interface SessionDraft extends QuizSessionState {
  setId: string
  mode: QuizMode
}
