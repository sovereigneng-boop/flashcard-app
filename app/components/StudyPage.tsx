'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  clearSessionDraft,
  commitSessionUpdates,
  getCards,
  getDailyQuizCards,
  getDailyReviewCards,
  getProject,
  getSessionDraft,
  getSet,
  saveSessionDraft,
} from './store'
import type { Card, CardSet, PendingUpdate, Project, QuizMode, QuizSessionState } from './types'
import QuizSession from './QuizSession'

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MODE_LABEL: Record<QuizMode, string> = {
  'daily-quiz': '데일리 퀴즈',
  'daily-review': '데일리 복습',
  'total-test': '토탈 테스트',
}

// ── Page state machine ────────────────────────────────────────────────────────

interface QuizPhaseState {
  phase: 'quiz'
  mode: QuizMode
  initialQueue: Card[]
  initialCorrectCount: number
  initialWrongCount: number
  initialAnsweredCount: number
  initialPendingUpdates: PendingUpdate[]
}

type PagePhase =
  | { phase: 'mode' }
  | { phase: 'order'; mode: QuizMode; cards: Card[] }
  | QuizPhaseState

// ── ModeCard ──────────────────────────────────────────────────────────────────

function ModeCard({
  title,
  description,
  count,
  countLabel,
  accentColor,
  icon,
  disabled,
  hasDraft,
  disabledText = '해당하는 카드가 없습니다',
  onClick,
}: {
  title: string
  description: string
  count: number
  countLabel: string
  accentColor: string
  icon: React.ReactNode
  disabled: boolean
  hasDraft: boolean
  disabledText?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-2xl border bg-white shadow-sm px-5 py-5 transition-all
        ${disabled
          ? 'opacity-50 cursor-not-allowed border-zinc-100'
          : 'hover:shadow-md hover:border-indigo-200 cursor-pointer border-zinc-100 active:scale-[0.99]'
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
        <div className="shrink-0 text-right flex flex-col items-end gap-1">
          <span className={`text-2xl font-bold ${disabled ? 'text-zinc-300' : 'text-zinc-800'}`}>
            {count}
          </span>
          <p className="text-xs text-zinc-400">{countLabel}</p>
          {hasDraft && (
            <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
              이어하기
            </span>
          )}
        </div>
      </div>
      <div className="mt-3">
        <p className="font-semibold text-zinc-800">{title}</p>
        <p className="text-sm text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      {disabled && count === 0 && (
        <p className="mt-3 text-xs text-zinc-400 font-medium">{disabledText}</p>
      )}
    </button>
  )
}

// ── OrderSelection ────────────────────────────────────────────────────────────

function OrderSelection({
  mode,
  cardCount,
  onSelect,
  onBack,
}: {
  mode: QuizMode
  cardCount: number
  onSelect: (order: 'sequential' | 'random') => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          돌아가기
        </button>
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
          {MODE_LABEL[mode]}
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const { projectId, setId } = useParams<{ projectId: string; setId: string }>()
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [set, setSet] = useState<CardSet | null>(null)
  const [dailyQuizCards, setDailyQuizCards] = useState<Card[]>([])
  const [dailyReviewCards, setDailyReviewCards] = useState<Card[]>([])
  const [allCards, setAllCards] = useState<Card[]>([])
  const [drafts, setDrafts] = useState<Partial<Record<QuizMode, boolean>>>({})
  const [phase, setPhase] = useState<PagePhase>({ phase: 'mode' })

  const loadData = useCallback(() => {
    const p = getProject(projectId)
    const s = getSet(setId)
    if (!p || !s) { router.replace('/'); return }
    setProject(p)
    setSet(s)
    setDailyQuizCards(getDailyQuizCards(setId))
    setDailyReviewCards(getDailyReviewCards(setId))
    setAllCards(getCards(setId))
    setDrafts({
      'daily-quiz': !!getSessionDraft(setId, 'daily-quiz'),
      'daily-review': !!getSessionDraft(setId, 'daily-review'),
      'total-test': !!getSessionDraft(setId, 'total-test'),
    })
  }, [projectId, setId, router])

  useEffect(() => { loadData() }, [loadData])

  // ── Mode selection ─────────────────────────────────────────────────────────

  function handleModeSelect(mode: QuizMode) {
    // Check for a saved draft first
    const draft = getSessionDraft(setId, mode)
    if (draft) {
      setPhase({
        phase: 'quiz',
        mode,
        initialQueue: draft.queue,
        initialCorrectCount: draft.correctCount,
        initialWrongCount: draft.wrongCount,
        initialAnsweredCount: draft.answeredCount,
        initialPendingUpdates: draft.pendingUpdates,
      })
      return
    }

    // Fresh start: gather cards then go to order selection
    let cards: Card[]
    if (mode === 'daily-quiz') cards = getDailyQuizCards(setId)
    else if (mode === 'daily-review') cards = getDailyReviewCards(setId)
    else cards = getCards(setId)
    if (cards.length === 0) return
    setPhase({ phase: 'order', mode, cards })
  }

  function handleOrderSelect(order: 'sequential' | 'random') {
    if (phase.phase !== 'order') return
    const cards = order === 'random' ? shuffle(phase.cards) : phase.cards
    setPhase({
      phase: 'quiz',
      mode: phase.mode,
      initialQueue: cards,
      initialCorrectCount: 0,
      initialWrongCount: 0,
      initialAnsweredCount: 0,
      initialPendingUpdates: [],
    })
  }

  // ── Quiz callbacks ─────────────────────────────────────────────────────────

  function handleSaveAndExit(state: QuizSessionState) {
    if (phase.phase !== 'quiz') return
    saveSessionDraft({ setId, mode: phase.mode, ...state })
    loadData()
    setPhase({ phase: 'mode' })
  }

  function handleDiscardAndExit() {
    if (phase.phase !== 'quiz') return
    clearSessionDraft(setId, phase.mode)
    loadData()
    setPhase({ phase: 'mode' })
  }

  function handleContinueWithWrong(updates: PendingUpdate[]) {
    if (phase.phase !== 'quiz') return
    const mode = phase.mode

    // Collect wrong card IDs before committing (commit may change stages)
    const wrongCardIds = new Set(updates.filter((u) => !u.correct).map((u) => u.cardId))

    if (mode !== 'daily-quiz') {
      commitSessionUpdates(updates, mode)
    }
    clearSessionDraft(setId, mode)

    // Look up the wrong Card objects by ID from the (now-updated) store
    const allCards = getCards(setId)
    const wrongCards = allCards.filter((c) => wrongCardIds.has(c.id))

    loadData()

    if (wrongCards.length === 0) {
      setPhase({ phase: 'mode' })
    } else {
      setPhase({ phase: 'order', mode, cards: wrongCards })
    }
  }

  if (!project || !set) return null

  // ── Quiz phase ─────────────────────────────────────────────────────────────

  if (phase.phase === 'quiz') {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
              {MODE_LABEL[phase.mode]}
            </p>
            <h1 className="text-lg font-bold text-zinc-900">{set.name}</h1>
          </div>
          <QuizSession
            mode={phase.mode}
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

  // ── Order selection phase ──────────────────────────────────────────────────

  if (phase.phase === 'order') {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <nav className="flex items-center gap-1.5 text-sm text-zinc-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-indigo-600 transition-colors">홈</Link>
            <span>/</span>
            <Link href={`/projects/${projectId}`} className="hover:text-indigo-600 transition-colors">{project.name}</Link>
            <span>/</span>
            <span className="text-zinc-700 font-medium">{set.name}</span>
          </nav>
          <OrderSelection
            mode={phase.mode}
            cardCount={phase.cards.length}
            onSelect={handleOrderSelect}
            onBack={() => setPhase({ phase: 'mode' })}
          />
        </div>
      </div>
    )
  }

  // ── Mode selection phase ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <nav className="flex items-center gap-1.5 text-sm text-zinc-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-indigo-600 transition-colors">홈</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-indigo-600 transition-colors">
            {project.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-700 font-medium">{set.name}</span>
        </nav>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{set.name}</h1>
            <p className="text-sm text-zinc-400 mt-1">테스트 모드를 선택하세요</p>
          </div>
          <Link
            href={`/projects/${projectId}/sets/${setId}/edit`}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50 text-zinc-600 hover:text-indigo-700 text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            카드 추가/수정
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <ModeCard
            title="데일리 퀴즈"
            description="오늘 추가된 카드를 모두 맞힐 때까지 반복 출제합니다"
            count={dailyQuizCards.length}
            countLabel="오늘 생성된 카드"
            accentColor="bg-amber-50 text-amber-500"
            disabled={dailyQuizCards.length === 0}
            hasDraft={!!drafts['daily-quiz']}
            disabledText="오늘 추가된 카드가 없습니다"
            onClick={() => handleModeSelect('daily-quiz')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
              </svg>
            }
          />

          <ModeCard
            title="데일리 복습"
            description="복습 주기가 된 카드만 출제합니다. 맞추면 다음 회차로, 틀리면 회차가 내려갑니다"
            count={dailyReviewCards.length}
            countLabel="복습 예정 카드"
            accentColor="bg-indigo-50 text-indigo-500"
            disabled={dailyReviewCards.length === 0}
            hasDraft={!!drafts['daily-review']}
            onClick={() => handleModeSelect('daily-review')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            }
          />

          <ModeCard
            title="토탈 테스트"
            description="세트의 모든 카드를 한 번씩 테스트합니다. 복습 주기와 무관합니다"
            count={allCards.length}
            countLabel="전체 카드"
            accentColor="bg-green-50 text-green-600"
            disabled={allCards.length === 0}
            hasDraft={!!drafts['total-test']}
            onClick={() => handleModeSelect('total-test')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {allCards.length === 0 && (
          <div className="mt-8 flex flex-col items-center py-12 text-center">
            <p className="text-zinc-500 font-medium">아직 카드가 없습니다</p>
            <p className="text-sm text-zinc-400 mt-1 mb-5">편집 버튼을 눌러 카드를 추가하세요</p>
            <Link
              href={`/projects/${projectId}/sets/${setId}/edit`}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              카드 추가하기
            </Link>
          </div>
        )}

        {allCards.length > 0 && (
          <details className="mt-8 group">
            <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600 transition-colors select-none list-none flex items-center gap-1">
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              복습 주기 보기
            </summary>
            <div className="mt-3 bg-white rounded-xl border border-zinc-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">회차</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">다음 출제까지</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['1회차', '1일 후'],
                    ['2회차', '3일 후'],
                    ['3회차', '1주 후'],
                    ['4회차', '2주 후'],
                    ['5회차', '1달 후'],
                    ['6회차', '졸업 🎓'],
                  ].map(([stage, interval]) => (
                    <tr key={stage} className="border-t border-zinc-50">
                      <td className="px-4 py-2.5 text-zinc-600 font-medium">{stage}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{interval}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
