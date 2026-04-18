'use client'

import { useState } from 'react'
import type { Card, HistoryEntry, PendingUpdate, QuizMode, QuizSessionState } from './types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  mode: QuizMode
  /** Current queue to work through (may be a restored draft queue). */
  initialQueue: Card[]
  /** Stats carried over from a saved draft (0 for fresh sessions). */
  initialCorrectCount?: number
  initialWrongCount?: number
  initialAnsweredCount?: number
  /** Buffered updates carried over from a saved draft. */
  initialPendingUpdates?: PendingUpdate[]
  /** Save current state and exit — caller persists the draft. */
  onSaveAndExit: (state: QuizSessionState) => void
  /** Discard session (no commit) and exit — caller clears any existing draft. */
  onDiscardAndExit: () => void
  /** Continue with wrong cards — caller commits updates then starts new session. */
  onContinueWithWrong: (updates: PendingUpdate[]) => void
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HistoryDots({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {history.map((h, i) => (
        <span
          key={i}
          className={`text-sm font-bold leading-none ${h.correct ? 'text-green-500' : 'text-red-500'}`}
        >
          {h.correct ? '○' : '×'}
        </span>
      ))}
    </div>
  )
}

function ExitModal({
  onSaveAndExit,
  onDiscardAndExit,
  onCancel,
}: {
  onSaveAndExit: () => void
  onDiscardAndExit: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xs mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-zinc-900">테스트를 나가시겠어요?</h2>
          <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
            중간 저장하면 다음에 이어서 진행할 수 있습니다
          </p>
        </div>
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={onSaveAndExit}
            className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
          >
            중간 저장 후 나가기
          </button>
          <button
            onClick={onDiscardAndExit}
            className="w-full py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            저장 없이 나가기
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 text-sm font-medium text-zinc-500 hover:bg-zinc-50 rounded-xl transition-colors"
          >
            계속하기
          </button>
        </div>
      </div>
    </div>
  )
}

function CompletionScreen({
  correct,
  wrong,
  pendingUpdates,
  onContinueWithWrong,
  onDiscardAndExit,
}: {
  correct: number
  wrong: number
  pendingUpdates: PendingUpdate[]
  onContinueWithWrong: (updates: PendingUpdate[]) => void
  onDiscardAndExit: () => void
}) {
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const total = correct + wrong
  const wrongCardCount = pendingUpdates.filter((u) => !u.correct).length
  const hasWrongCards = wrongCardCount > 0

  return (
    <>
      <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-4xl">
          {wrong === 0 ? '🏆' : '✅'}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-zinc-900">테스트 완료!</h2>
          <p className="text-zinc-400 text-sm mt-1">{total}장을 모두 풀었습니다</p>
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-green-500">{correct}</span>
            <span className="text-xs text-zinc-400 font-medium">정답 ○</span>
          </div>
          <div className="w-px bg-zinc-100" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-red-500">{wrong}</span>
            <span className="text-xs text-zinc-400 font-medium">오답 ×</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {hasWrongCards && (
            <button
              onClick={() => onContinueWithWrong(pendingUpdates)}
              className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
            >
              이어서 테스트 진행 ({wrongCardCount}장)
            </button>
          )}
          <button
            onClick={() => hasWrongCards ? setShowEndConfirm(true) : onDiscardAndExit()}
            className="w-full py-3 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors"
          >
            테스트 종료
          </button>
        </div>
      </div>

      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xs mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-base font-bold text-zinc-900">테스트가 초기화됩니다.</h2>
              <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">괜찮으시겠습니까?</p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={onDiscardAndExit}
                className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
              >
                확인
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="w-full py-3 text-sm font-medium text-zinc-500 hover:bg-zinc-50 rounded-xl transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QuizSession({
  mode,
  initialQueue,
  initialCorrectCount = 0,
  initialWrongCount = 0,
  initialAnsweredCount = 0,
  initialPendingUpdates = [],
  onSaveAndExit,
  onDiscardAndExit,
  onContinueWithWrong,
}: Props) {
  // ── Session state ────────────────────────────────────────────────────────

  const [queue, setQueue] = useState<Card[]>([...initialQueue])
  const [flipped, setFlipped] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  // Stats (cumulative, includes any values restored from a draft)
  const [correctCount, setCorrectCount] = useState(initialCorrectCount)
  const [wrongCount, setWrongCount] = useState(initialWrongCount)
  const [answeredCount, setAnsweredCount] = useState(initialAnsweredCount)

  // Buffered updates — NOT written to store until session completes or is committed
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>(initialPendingUpdates)

  const isComplete = queue.length === 0
  const currentCard = queue[0] ?? null
  const showHistory = mode !== 'daily-quiz' && (currentCard?.history?.length ?? 0) > 0

  // ── Card flip ────────────────────────────────────────────────────────────

  function handleReveal() {
    if (revealed || isTransitioning) return
    setFlipped(true)
    setRevealed(true)
  }

  function handleAnswer(correct: boolean) {
    if (!currentCard || !revealed || isTransitioning) return

    const cardId = currentCard.id

    // Skip flip-back animation on the last card so the completion screen
    // appears immediately without a hanging mid-animation state.
    const willComplete = queue.length === 1

    setIsTransitioning(true)
    if (!willComplete) setFlipped(false)

    setTimeout(() => {
      if (correct) setCorrectCount((n) => n + 1)
      else setWrongCount((n) => n + 1)

      // All modes: single pass — every card is shown exactly once.
      // Wrong cards are recorded in pendingUpdates and retried only if the
      // user explicitly chooses "이어서 테스트 진행" on the completion screen.
      setPendingUpdates((prev) => [...prev, { cardId, correct }])
      setQueue((q) => q.slice(1))
      setAnsweredCount((n) => n + 1)

      setRevealed(false)
      setIsTransitioning(false)
    }, willComplete ? 50 : 480)
  }

  // ── Exit handlers ────────────────────────────────────────────────────────

  function handleSaveAndExit() {
    onSaveAndExit({ queue, correctCount, wrongCount, answeredCount, pendingUpdates })
  }

  function handleDiscardAndExit() {
    onDiscardAndExit()
  }

  // ── Completion ───────────────────────────────────────────────────────────

  if (isComplete) {
    return (
      <CompletionScreen
        correct={correctCount}
        wrong={wrongCount}
        pendingUpdates={pendingUpdates}
        onContinueWithWrong={onContinueWithWrong}
        onDiscardAndExit={onDiscardAndExit}
      />
    )
  }

  // ── Progress ─────────────────────────────────────────────────────────────

  const progressText = `${answeredCount + 1} / ${answeredCount + queue.length}`
  const progressPercent = (answeredCount / (answeredCount + queue.length)) * 100

  // ── Card metadata ────────────────────────────────────────────────────────

  const createdDate = (() => {
    const d = new Date(currentCard.createdAt)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}.${m}.${day}`
  })()

  const totalWrong = currentCard.history.filter((h) => !h.correct).length

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between text-sm text-zinc-400">
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1 hover:text-zinc-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            나가기
          </button>
          <span className="font-semibold text-zinc-600">{progressText}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Card */}
        <div
          className="relative w-full cursor-pointer"
          style={{ perspective: '1000px', height: '240px' }}
          onClick={!revealed && !isTransitioning ? handleReveal : undefined}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white border border-zinc-200 shadow-sm px-8 py-8 select-none"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="absolute top-3 left-4 text-xs text-zinc-300">{createdDate}</span>

              {mode === 'total-test' && (
                <span className="absolute top-3 right-4 text-xs font-medium text-zinc-300 bg-zinc-50 px-2 py-0.5 rounded-full">
                  {currentCard.reviewStage}회차
                </span>
              )}

              <p className="text-zinc-800 text-xl font-semibold text-center leading-relaxed break-words w-full">
                {currentCard.front}
              </p>

              {mode === 'daily-review' ? (
                <div className="absolute bottom-3.5 inset-x-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    {currentCard.reviewStage}회차 · 틀린 횟수 {totalWrong}회
                  </span>
                  {!revealed && (
                    <span className="text-xs text-zinc-300">클릭해서 답 확인</span>
                  )}
                </div>
              ) : (
                !revealed && (
                  <p className="absolute bottom-3.5 text-xs text-zinc-300">클릭해서 답 확인</p>
                )
              )}
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-indigo-600 border border-indigo-700 shadow-sm px-8 py-6 select-none"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-white text-xl font-semibold text-center leading-relaxed break-words w-full">
                {currentCard.back}
              </p>
            </div>
          </div>
        </div>

        {/* History dots */}
        {showHistory && (
          <div className="w-full flex flex-col items-center gap-1">
            <p className="text-xs text-zinc-400 font-medium">지금까지의 기록</p>
            <HistoryDots history={currentCard.history} />
          </div>
        )}

        {/* O/X buttons */}
        <div className="w-full max-w-xs" style={{ minHeight: '56px' }}>
          {revealed && !isTransitioning && (
            <div className="flex gap-3">
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 h-14 rounded-2xl border-2 border-red-200 bg-red-50 text-red-500 hover:bg-red-100 text-2xl font-bold transition-colors"
                aria-label="틀렸음"
              >
                ✕
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 h-14 rounded-2xl border-2 border-green-200 bg-green-50 text-green-600 hover:bg-green-100 text-2xl font-bold transition-colors"
                aria-label="맞았음"
              >
                ○
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <ExitModal
          onSaveAndExit={handleSaveAndExit}
          onDiscardAndExit={handleDiscardAndExit}
          onCancel={() => setShowExitModal(false)}
        />
      )}
    </>
  )
}
