'use client'

import { useEffect, useRef } from 'react'

interface NameModalProps {
  title: string
  placeholder?: string
  defaultValue?: string
  onConfirm: (name: string) => void
  onClose: () => void
}

export default function NameModal({
  title,
  placeholder = '이름을 입력하세요',
  defaultValue = '',
  onConfirm,
  onClose,
}: NameModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = inputRef.current?.value.trim()
    if (value) onConfirm(value)
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-5">
          <h2 className="text-base font-semibold text-zinc-800 mb-3">{title}</h2>
          <input
            ref={inputRef}
            type="text"
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
          />
        </div>
        <div className="px-6 pb-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-500 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"
          >
            확인
          </button>
        </div>
      </form>
    </div>
  )
}
