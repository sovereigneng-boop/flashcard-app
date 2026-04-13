'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Row {
  key: string       // React key
  id?: string       // original card id (if editing an existing card)
  front: string
  back: string
}

export interface CardTableRow {
  id?: string
  front: string
  back: string
}

export interface CardTableHandle {
  getRows: () => CardTableRow[]
}

interface CardTableProps {
  initialRows?: CardTableRow[]
  ref?: React.Ref<CardTableHandle>
}

// ── Auto-resize textarea ──────────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  onKeyDown,
  onPaste,
  placeholder,
  'data-row': dataRow,
  'data-col': dataCol,
}: {
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  'data-row': number
  'data-col': string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  return (
    <textarea
      ref={ref}
      data-row={dataRow}
      data-col={dataCol}
      value={value}
      placeholder={placeholder}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      className="w-full resize-none overflow-hidden rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition leading-relaxed"
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function makeRow(id?: string, front = '', back = ''): Row {
  return { key: crypto.randomUUID(), id, front, back }
}

export default function CardTable({ initialRows = [], ref }: CardTableProps) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialRows.length > 0
      ? initialRows.map((r) => makeRow(r.id, r.front, r.back))
      : [makeRow()]
  )
  const [pendingFocus, setPendingFocus] = useState<{ rowIndex: number; col: 'front' | 'back' } | null>(null)

  // Expose getRows() to parent via ref
  useEffect(() => {
    if (ref && typeof ref === 'object' && ref !== null && 'current' in ref) {
      ;(ref as React.MutableRefObject<CardTableHandle>).current = {
        getRows: () => rows.map(({ id, front, back }) => ({ id, front, back })),
      }
    }
  })

  useEffect(() => {
    if (!pendingFocus) return
    const el = document.querySelector<HTMLTextAreaElement>(
      `[data-row="${pendingFocus.rowIndex}"][data-col="${pendingFocus.col}"]`
    )
    el?.focus()
    setPendingFocus(null)
  }, [pendingFocus, rows])

  function updateRow(index: number, col: 'front' | 'back', value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [col]: value } : r)))
  }

  function addRow(afterIndex?: number) {
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : rows.length
    const newRow = makeRow()
    setRows((prev) => [...prev.slice(0, insertAt), newRow, ...prev.slice(insertAt)])
    setPendingFocus({ rowIndex: insertAt, col: 'front' })
  }

  function deleteRow(index: number) {
    if (rows.length === 1) {
      setRows([makeRow()])
      setPendingFocus({ rowIndex: 0, col: 'front' })
      return
    }
    setRows((prev) => prev.filter((_, i) => i !== index))
    setPendingFocus({ rowIndex: Math.max(0, index - 1), col: 'back' })
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    rowIndex: number,
    col: 'front' | 'back'
  ) {
    if (e.key === 'Tab' && !e.shiftKey && col === 'back' && rowIndex === rows.length - 1) {
      e.preventDefault()
      addRow()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (rowIndex < rows.length - 1) {
        setPendingFocus({ rowIndex: rowIndex + 1, col })
      } else {
        addRow(rowIndex)
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>, startRow: number) {
    const text = e.clipboardData.getData('text')
    if (!text.includes('\n') && !text.includes('\t')) return

    e.preventDefault()

    const entries = text
      .split('\n')
      .map((l) => l.replace(/\r$/, ''))
      .filter((l) => l.trim())
      .map((line) => {
        const [f = '', b = ''] = line.split('\t')
        return { front: f.trim(), back: b.trim() }
      })

    setRows((prev) => {
      const updated = [...prev]
      entries.forEach((entry, i) => {
        const idx = startRow + i
        if (idx < updated.length) {
          updated[idx] = { ...updated[idx], ...entry }
        } else {
          updated.push(makeRow(undefined, entry.front, entry.back))
        }
      })
      return updated
    })
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '2rem 1fr 1fr 2rem' }}>
        <div />
        <div className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-widest">앞면</div>
        <div className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-widest">뒷면</div>
        <div />
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="group grid gap-1 items-start"
            style={{ gridTemplateColumns: '2rem 1fr 1fr 2rem' }}
          >
            <div className="flex items-center justify-center pt-2.5 text-xs text-zinc-300 font-mono select-none">
              {i + 1}
            </div>

            <AutoTextarea
              data-row={i}
              data-col="front"
              value={row.front}
              placeholder="앞면"
              onChange={(v) => updateRow(i, 'front', v)}
              onKeyDown={(e) => handleKeyDown(e, i, 'front')}
              onPaste={(e) => handlePaste(e, i)}
            />

            <AutoTextarea
              data-row={i}
              data-col="back"
              value={row.back}
              placeholder="뒷면"
              onChange={(v) => updateRow(i, 'back', v)}
              onKeyDown={(e) => handleKeyDown(e, i, 'back')}
              onPaste={(e) => handlePaste(e, i)}
            />

            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => deleteRow(i)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all text-lg leading-none"
                aria-label={`${i + 1}번 행 삭제`}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => addRow(rows.length - 1)}
        className="mt-3 flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        <span className="text-base leading-none">+</span>
        행 추가
      </button>
    </div>
  )
}
