'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { getCards, getProject, getSet, saveCards } from './store'
import type { Card, CardSet, Project } from './types'
import CardTable, { type CardTableHandle } from './CardTable'

export default function EditPage() {
  const { projectId, setId } = useParams<{ projectId: string; setId: string }>()
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [set, setSet] = useState<CardSet | null>(null)
  const [initialCards, setInitialCards] = useState<Card[] | null>(null)
  const [saving, setSaving] = useState(false)

  const tableRef = useRef<CardTableHandle>(null)

  useEffect(() => {
    async function load() {
      const [p, s] = await Promise.all([getProject(projectId), getSet(setId)])
      if (!p || !s) { router.replace('/'); return }
      setProject(p)
      setSet(s)
      setInitialCards(await getCards(setId))
    }
    load()
  }, [projectId, setId])

  async function handleSave() {
    if (!tableRef.current) return
    setSaving(true)
    const rows = tableRef.current.getRows()
    await saveCards(setId, rows)
    router.push(`/projects/${projectId}/sets/${setId}`)
  }

  // Wait until cards are loaded before rendering CardTable.
  // CardTable's useState initializer runs only once, so we must not
  // render it until initialCards is ready.
  if (!project || !set || initialCards === null) return null

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-zinc-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-indigo-600 transition-colors">홈</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-indigo-600 transition-colors">{project.name}</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}/sets/${setId}`} className="hover:text-indigo-600 transition-colors">{set.name}</Link>
          <span>/</span>
          <span className="text-zinc-700 font-medium">편집</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{set.name} 편집</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Tab / Enter로 다음 칸 이동 · 마지막 행 Tab으로 행 추가
            </p>
            <p className="text-sm text-zinc-400">
              엑셀·구글 시트에서 복사한 내용을 바로 붙여넣기할 수 있습니다
            </p>
          </div>
          <div className="flex gap-2 shrink-0 ml-4">
            <Link
              href={`/projects/${projectId}/sets/${setId}`}
              className="px-4 py-2.5 text-sm font-medium text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              취소
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
            >
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm px-6 py-6">
          <CardTable
            ref={tableRef}
            initialRows={initialCards.map((c) => ({ id: c.id, front: c.front, back: c.back }))}
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
          >
            {saving ? '저장 중…' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
