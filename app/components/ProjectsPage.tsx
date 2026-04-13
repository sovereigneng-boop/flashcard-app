'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  createProject,
  deleteProject,
  getProjects,
  getSets,
  updateProject,
} from './store'
import type { Project } from './types'
import NameModal from './NameModal'

type ModalState =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'edit'; project: Project }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })

  function load() {
    const ps = getProjects()
    setProjects(ps)
    const c: Record<string, number> = {}
    ps.forEach((p) => { c[p.id] = getSets(p.id).length })
    setCounts(c)
  }

  useEffect(() => { load() }, [])

  function handleAdd(name: string) {
    createProject(name)
    setModal({ type: 'closed' })
    load()
  }

  function handleEdit(name: string) {
    if (modal.type !== 'edit') return
    updateProject(modal.project.id, name)
    setModal({ type: 'closed' })
    load()
  }

  function handleDelete(id: string) {
    if (!confirm('이 프로젝트와 모든 세트·카드가 삭제됩니다. 계속하시겠어요?')) return
    deleteProject(id)
    load()
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">낱말카드</h1>
            <p className="text-sm text-zinc-400 mt-1">프로젝트를 선택하세요</p>
          </div>
          <button
            onClick={() => setModal({ type: 'add' })}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <span className="text-base leading-none">+</span>
            새 프로젝트
          </button>
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <p className="text-zinc-500 font-medium">아직 프로젝트가 없습니다</p>
            <p className="text-sm text-zinc-400 mt-1 mb-6">새 프로젝트를 만들어 카드를 관리해보세요</p>
            <button
              onClick={() => setModal({ type: 'add' })}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              첫 프로젝트 만들기
            </button>
          </div>
        )}

        {/* Project list */}
        {projects.length > 0 && (
          <ul className="flex flex-col gap-2">
            {projects.map((project) => (
              <li key={project.id} className="group flex items-center gap-3 bg-white rounded-2xl border border-zinc-100 shadow-sm px-5 py-4 hover:border-indigo-200 hover:shadow-md transition-all">
                {/* Folder icon */}
                <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>

                {/* Name + count — clickable */}
                <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-800 truncate">{project.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{counts[project.id] ?? 0}개 세트</p>
                </Link>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setModal({ type: 'edit', project })}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-500 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
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
          title="새 프로젝트"
          placeholder="프로젝트 이름 (예: 한국사 시험)"
          onConfirm={handleAdd}
          onClose={() => setModal({ type: 'closed' })}
        />
      )}
      {modal.type === 'edit' && (
        <NameModal
          title="프로젝트 이름 변경"
          defaultValue={modal.project.name}
          onConfirm={handleEdit}
          onClose={() => setModal({ type: 'closed' })}
        />
      )}
    </div>
  )
}
