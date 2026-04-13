'use client'

import { useState } from 'react'

interface FlashcardProps {
  front: string
  back: string
}

export default function Flashcard({ front, back }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="relative w-full h-44 cursor-pointer select-none"
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped((f) => !f)}
      aria-label={flipped ? `뒷면: ${back}` : `앞면: ${front}`}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-4"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="absolute top-3 left-4 text-xs font-semibold text-zinc-300 uppercase tracking-widest">앞면</span>
          <p className="text-zinc-800 text-base font-medium text-center leading-relaxed break-words w-full">
            {front || <span className="text-zinc-300 italic">내용 없음</span>}
          </p>
          <span className="absolute bottom-3 right-4 text-xs text-zinc-300">클릭해서 뒤집기</span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-indigo-600 border border-indigo-700 shadow-sm px-5 py-4"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="absolute top-3 left-4 text-xs font-semibold text-indigo-300 uppercase tracking-widest">뒷면</span>
          <p className="text-white text-base font-medium text-center leading-relaxed break-words w-full">
            {back || <span className="text-indigo-300 italic">내용 없음</span>}
          </p>
          <span className="absolute bottom-3 right-4 text-xs text-indigo-300">클릭해서 뒤집기</span>
        </div>
      </div>
    </div>
  )
}
