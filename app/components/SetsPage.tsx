'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  countCards,
  createSet,
  deleteSet,
  getProject,
  getSets,
  updateSet,
} from './store'
import type { CardSet, Project } from './types'
import NameModal from './NameModal'

type ModalState =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'edit'; set: CardSet }

export default function SetsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [sets, setSets] = useState<CardSet[]>([])
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({})
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })

  function load() {
    const p = getProject(projectId)
    if (!p) { router.replace('/'); return }
    setProject(p)
    const ss = getSets(projectId)
    setSets(ss)
    const cc: Record<string, number> = {}
    ss.forEach((s) => { cc[s.id] = countCards(s.id) })
    setCardCounts(cc)
  }

  useEffect(() => { load() }, [projectId])

  function handleAdd(name: string) {
    createSet(projectId, name)
    setModal({ type: 'closed' })
    load()
  }

  function handleEdit(name: string) {
    if (modal.type !== 'edit') return
    updateSet(modal.set.id, name)
    setModal({ type: 'closed' })
    load()
  }

  function handleDelete(id: string) {
    if (!confirm('이 세트와 모든 카드가 삭제됩니다. 계속하시겠어요?')) return
    deleteSet(id)
    load()
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-zinc-400 mb-8">
          <Link href="/" className="hover:text-indigo-600 transition-colors">홈</Link>
          <span>/</span>
          <span className="text-zinc-700 font-medium">{project.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{project.name}</h1>
            <p className="text-sm text-zinc-400 mt-1">학습할 세트를 선택하세요</p>
          </div>
          <button
            onClick={() => setModal({ type: 'add' })}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <span className="text-base leading-none">+</span>
            새 세트
          </button>
        </div>

        {/* Empty state */}
        {sets.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <p className="text-zinc-500 font-medium">아직 세트가 없습니다</p>
            <p className="text-sm text-zinc-400 mt-1 mb-6">카드 묶음인 세트를 만들어보세요</p>
            <button
              onClick={() => setModal({ type: 'add' })}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              첫 세트 만들기
            </button>
          </div>
        )}

        {/* Set list */}
        {sets.length > 0 && (
          <ul className="flex flex-col gap-2">
            {sets.map((set) => (
              <li key={set.id} className="group flex items-center gap-3 bg-white rounded-2xl border border-zinc-100 shadow-sm px-5 py-4 hover:border-indigo-200 hover:shadow-md transition-all">
                {/* Card stack icon */}
                <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                  </svg>
                </div>

                {/* Name + count — link to study page */}
                <Link href={`/projects/${projectId}/sets/${set.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-800 truncate">{set.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{cardCounts[set.id] ?? 0}장</p>
                </Link>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/projects/${projectId}/sets/${set.id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    카드 추가/수정
                  </Link>
                  <button
                    onClick={() => setModal({ type: 'edit', set })}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-500 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    이름 변경
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal.type === 'add' && (
        <NameModal
          title="새 세트"
          placeholder="세트 이름 (예: 조선시대 왕)"
          onConfirm={handleAdd}
          onClose={() => setModal({ type: 'closed' })}
        />
      )}
      {modal.type === 'edit' && (
        <NameModal
          title="세트 이름 변경"
          defaultValue={modal.set.name}
          onConfirm={handleEdit}
          onClose={() => setModal({ type: 'closed' })}
        />
      )}
    </div>
  )
}
