'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  createProject,
  deleteProject,
  getAllDailyReviewCards,
  getProjects,
  getSessionDraft,
  getSets,
  updateProject,
} from './store'
import type { Project } from './types'
import NameModal from './NameModal'

const GLOBAL_SET_ID = '__global__'

type ModalState =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'edit'; project: Project }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })
  const [globalReviewCount, setGlobalReviewCount] = useState(0)
  const [globalHasDraft, setGlobalHasDraft] = useState(false)

  function load() {
    const ps = getProjects()
    setProjects(ps)
    const c: Record<string, number> = {}
    ps.forEach((p) => { c[p.id] = getSets(p.id).length })
    setCounts(c)
    setGlobalReviewCount(getAllDailyReviewCards().length)
    setGlobalHasDraft(!!getSessionDraft(GLOBAL_SET_ID, 'daily-review'))
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

        {/* Global daily review banner */}
        <Link
          href="/global-review"
          className={`block w-full rounded-2xl border px-5 py-5 mb-6 transition-all
            ${globalReviewCount === 0
              ? 'bg-zinc-50 border-zinc-100 opacity-50 pointer-events-none'
              : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-500 shadow-md active:scale-[0.99]'
            }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${globalReviewCount === 0 ? 'bg-zinc-100' : 'bg-indigo-500'}`}>
                <svg className={`w-5 h-5 ${globalReviewCount === 0 ? 'text-zinc-400' : 'text-white'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <div>
                <p className={`font-bold text-base ${globalReviewCount === 0 ? 'text-zinc-500' : 'text-white'}`}>
                  토탈 데일리 복습
                </p>
                <p className={`text-xs mt-0.5 ${globalReviewCount === 0 ? 'text-zinc-400' : 'text-indigo-200'}`}>
                  {globalReviewCount === 0
                    ? '오늘 복습할 카드가 없습니다'
                    : '모든 세트의 복습 카드를 한번에 학습합니다'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-2xl font-bold ${globalReviewCount === 0 ? 'text-zinc-300' : 'text-white'}`}>
                {globalReviewCount}
              </span>
              <p className={`text-xs ${globalReviewCount === 0 ? 'text-zinc-400' : 'text-indigo-200'}`}>복습 예정</p>
              {globalHasDraft && (
                <span className="text-xs font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-full">
                  이어하기
                </span>
              )}
            </div>
          </div>
        </Link>

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

        {/* Manual */}
        <div className="mt-12 bg-white rounded-2xl border border-zinc-100 shadow-sm px-6 py-7">
          <h2 className="text-base font-bold text-zinc-900 mb-1">카플래시 사용 매뉴얼</h2>
          <p className="text-sm text-zinc-500 mb-6">카플래시는 간격 반복(Spaced Repetition) 학습법을 기반으로, 외운 내용을 장기 기억으로 만들어줍니다.</p>

          {/* 학습 모드 */}
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">3가지 학습 모드</h3>
          <div className="flex flex-col gap-3 mb-7">
            <div className="rounded-xl bg-amber-50 px-4 py-3.5">
              <p className="text-sm font-semibold text-amber-700 mb-0.5">데일리 퀴즈</p>
              <p className="text-xs text-amber-600 leading-relaxed">오늘 새로 추가한 카드를 반복 확인하는 모드입니다. 모든 카드를 맞출 때까지 진행하며, 복습 회차에는 영향을 주지 않습니다.</p>
            </div>
            <div className="rounded-xl bg-indigo-50 px-4 py-3.5">
              <p className="text-sm font-semibold text-indigo-700 mb-0.5">데일리 복습</p>
              <p className="text-xs text-indigo-600 leading-relaxed">가장 중요한 모드입니다. 복습 주기에 맞는 카드가 자동으로 출제됩니다. 맞추면 다음 회차로 넘어가고, 틀리면 회차가 1단계 내려간 뒤 다음날 다시 출제됩니다.</p>
            </div>
            <div className="rounded-xl bg-zinc-50 px-4 py-3.5">
              <p className="text-sm font-semibold text-zinc-700 mb-0.5">토탈 테스트</p>
              <p className="text-xs text-zinc-500 leading-relaxed">세트 내 모든 카드를 한번에 테스트합니다. 복습 주기와 무관하게 전체 점검용으로 활용하세요.</p>
            </div>
          </div>

          {/* 복습 주기 표 */}
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">복습 주기</h3>
          <table className="w-full text-sm mb-7 border-collapse">
            <thead>
              <tr className="bg-zinc-50">
                <th className="text-left text-xs font-semibold text-zinc-500 px-3 py-2 rounded-tl-lg border border-zinc-100">회차</th>
                <th className="text-left text-xs font-semibold text-zinc-500 px-3 py-2 rounded-tr-lg border border-zinc-100">다음 복습까지</th>
              </tr>
            </thead>
            <tbody>
              {[
                { round: '1회차', interval: '1일 후' },
                { round: '2회차', interval: '3일 후' },
                { round: '3회차', interval: '1주 후' },
                { round: '4회차', interval: '2주 후' },
                { round: '5회차', interval: '1달 후' },
                { round: '6회차', interval: '졸업 🎓' },
              ].map(({ round, interval }) => (
                <tr key={round} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-2 text-xs font-medium text-zinc-700 border-x border-zinc-100">{round}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500 border-x border-zinc-100">{interval}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 틀렸을 때 */}
          <h3 className="text-sm font-semibold text-zinc-700 mb-2">틀렸을 때</h3>
          <p className="text-xs text-zinc-500 leading-relaxed mb-3">회차가 1단계 감소하고, 다음날 다시 출제됩니다. 다음날 맞추면 회차가 다시 올라가고, 맞춘 날 기준으로 해당 회차의 주기가 새로 적용됩니다.</p>
          <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3.5 mb-6">
            <p className="text-xs font-semibold text-zinc-600 mb-1.5">예시) 4회차 복습에서 틀린 경우</p>
            <ul className="text-xs text-zinc-500 leading-relaxed space-y-0.5">
              <li>→ 회차가 3회차로 감소</li>
              <li>→ 다음날 데일리 복습에 다시 출제</li>
              <li>→ 다음날 맞추면 4회차로 복구</li>
              <li>→ 맞춘 날 기준으로 2주 후에 다시 출제</li>
            </ul>
          </div>

          {/* 건너뛴 경우 */}
          <h3 className="text-sm font-semibold text-zinc-700 mb-2">복습을 건너뛴 경우</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">직접 맞추기 전까지는 다음 회차로 절대 넘어가지 않습니다. 며칠 쉬더라도 해당 카드는 데일리 복습에 계속 남아 있으니, 본인의 페이스에 맞춰 진행하세요.</p>
        </div>
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
