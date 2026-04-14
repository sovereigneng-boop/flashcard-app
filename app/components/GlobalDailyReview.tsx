'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  clearSessionDraft,
  commitSessionUpdates,
  getAllDailyReviewCards,
  getCardsByIds,
  getSessionDraft,
  saveSessionDraft,
} from './store'
import type { Card, PendingUpdate, QuizSessionState } from './types'
import QuizSession from './QuizSession'

// ── Constants ─────────────────────────────────────────────────────────────────

const GLOBAL_SET_ID = '__global__'
const MODE = 'daily-review' as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Phase ─────────────────────────────────────────────────────────────────────

type Phase =
  | { phase: 'order'; cards: Card[] }
  | {
      phase: 'quiz'
      initialQueue: Card[]
      initialCorrectCount: number
      initialWrongCount: number
      initialAnsweredCount: number
      initialPendingUpdates: PendingUpdate[]
    }

// ── OrderSelection ────────────────────────────────────────────────────────────

function OrderSelection({
  cardCount,
  onSelect,
}: {
  cardCount: number
  onSelect: (order: 'sequential' | 'random') => void
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <div>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          돌아가기
        </Link>
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
          토탈 데일리 복습
        </p>
        <h2 className="text-lg font-bold text-zinc-900">카드 순서 선택</h2>
        <p className="text-sm text-zinc-400 mt-1">{cardCount}장의 카드</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => onSelect('sequential')}
          className="flex items-center gap-4 w-full text-left rounded-2xl border border-zinc-100 bg-white shadow-sm px-5 py-5 hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.99]"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5M3.75 9.75h16.5M3.75 14.25h10.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-zinc-800">순서대로</p>
            <p className="text-sm text-zinc-400 mt-0.5">추가한 순서 그대로 출제합니다</p>
          </div>
        </button>

        <button
          onClick={() => onSelect('random')}
          className="flex items-center gap-4 w-full text-left rounded-2xl border border-zinc-100 bg-white shadow-sm px-5 py-5 hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.99]"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-zinc-800">랜덤 섞기</p>
            <p className="text-sm text-zinc-400 mt-0.5">카드를 무작위로 섞어 출제합니다</p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GlobalDailyReview() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase | null>(null)

  useEffect(() => {
    async function init() {
      const draft = getSessionDraft(GLOBAL_SET_ID, MODE)
      if (draft) {
        setPhase({
          phase: 'quiz',
          initialQueue: draft.queue,
          initialCorrectCount: draft.correctCount,
          initialWrongCount: draft.wrongCount,
          initialAnsweredCount: draft.answeredCount,
          initialPendingUpdates: draft.pendingUpdates,
        })
        return
      }

      const cards = await getAllDailyReviewCards()
      if (cards.length === 0) {
        router.replace('/')
        return
      }
      setPhase({ phase: 'order', cards })
    }
    init()
  }, [router])

  function handleOrderSelect(order: 'sequential' | 'random') {
    if (phase?.phase !== 'order') return
    const cards = order === 'random' ? shuffle(phase.cards) : phase.cards
    setPhase({
      phase: 'quiz',
      initialQueue: cards,
      initialCorrectCount: 0,
      initialWrongCount: 0,
      initialAnsweredCount: 0,
      initialPendingUpdates: [],
    })
  }

  function handleSaveAndExit(state: QuizSessionState) {
    saveSessionDraft({ setId: GLOBAL_SET_ID, mode: MODE, ...state })
    router.replace('/')
  }

  function handleDiscardAndExit() {
    clearSessionDraft(GLOBAL_SET_ID, MODE)
    router.replace('/')
  }

  async function handleContinueWithWrong(updates: PendingUpdate[]) {
    const wrongCardIds = new Set(updates.filter((u) => !u.correct).map((u) => u.cardId))
    await commitSessionUpdates(updates, MODE)
    clearSessionDraft(GLOBAL_SET_ID, MODE)

    const wrongCards = await getCardsByIds([...wrongCardIds])
    if (wrongCards.length === 0) {
      router.replace('/')
    } else {
      setPhase({ phase: 'order', cards: wrongCards })
    }
  }

  if (!phase) return null

  // ── Order selection ────────────────────────────────────────────────────────

  if (phase.phase === 'order') {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <OrderSelection
            cardCount={phase.cards.length}
            onSelect={handleOrderSelect}
          />
        </div>
      </div>
    )
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
            토탈 데일리 복습
          </p>
          <h1 className="text-lg font-bold text-zinc-900">전체 복습</h1>
        </div>
        <QuizSession
          mode={MODE}
          initialQueue={phase.initialQueue}
          initialCorrectCount={phase.initialCorrectCount}
          initialWrongCount={phase.initialWrongCount}
          initialAnsweredCount={phase.initialAnsweredCount}
          initialPendingUpdates={phase.initialPendingUpdates}
          onSaveAndExit={handleSaveAndExit}
          onDiscardAndExit={handleDiscardAndExit}
          onContinueWithWrong={handleContinueWithWrong}
        />
      </div>
    </div>
  )
}
