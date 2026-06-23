import { useMemo, useState } from 'react'
import type { AppData, FeedRecord } from '../lib/types'
import { DEFAULT_PRESET_TAGS } from '../lib/types'
import { formatTime, formatDate, formatInterval } from '../lib/utils'

interface Props {
  data: AppData | null
  onUpdate: (record: FeedRecord) => Promise<void>
  onDelete: (recordId: string) => Promise<void>
}

const HISTORY_PAGE_DAYS = 30
const EMPTY_RECORDS: FeedRecord[] = []

export default function History({ data, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editCustomNote, setEditCustomNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [visibleDays, setVisibleDays] = useState(HISTORY_PAGE_DAYS)

  const presetTags = data?.presetTags ?? DEFAULT_PRESET_TAGS

  const toggleEditTag = (tag: string) => {
    setEditTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const allRecords = data?.records ?? EMPTY_RECORDS

  const cutoffTime = useMemo(() => {
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - visibleDays + 1)
    return cutoff.getTime()
  }, [visibleDays])

  const records = useMemo(() =>
    allRecords
      .filter(r => new Date(r.at).getTime() >= cutoffTime)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [allRecords, cutoffTime]
  )

  const grouped = useMemo(() =>
    records.reduce<Record<string, FeedRecord[]>>((acc, r) => {
      const key = formatDate(r.at)
      ;(acc[key] ??= []).push(r)
      return acc
    }, {}),
    [records]
  )

  const hasOlderRecords = useMemo(
    () => allRecords.some(r => new Date(r.at).getTime() < cutoffTime),
    [allRecords, cutoffTime]
  )

  const startEdit = (r: FeedRecord) => {
    setEditingId(r.id)
    setEditAmount(String(r.amountMl))
    const d = new Date(r.at)
    setEditTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    // Parse existing notes: separate preset tags from custom note
    const existingNotes = r.notes ?? []
    const presetSet = new Set(presetTags)
    setEditTags(existingNotes.filter(n => presetSet.has(n)))
    const custom = existingNotes.filter(n => !presetSet.has(n))
    setEditCustomNote(custom.join(' '))
  }

  const saveEdit = async (original: FeedRecord) => {
    setSaving(true)
    const date = new Date(original.at)
    const [h, m] = editTime.split(':').map(Number)
    date.setHours(h, m, 0, 0)
    // Merge editTags and editCustomNote into notes
    const notes = [...editTags]
    const trimmed = editCustomNote.trim()
    if (trimmed) notes.push(trimmed)
    await onUpdate({ ...original, amountMl: Number(editAmount), at: date.toISOString(), notes: notes.length > 0 ? notes : undefined })
    setSaving(false)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条记录？')) return
    await onDelete(id)
  }

  if (allRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-light">
        <div className="w-20 h-20 rounded-full bg-warm-50 flex items-center justify-center mb-4">
          <span className="text-4xl">📋</span>
        </div>
        <p className="text-base">还没有记录</p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text">喝奶记录</h1>
        <span className="text-xs text-text-light bg-warm-50 rounded-full px-2.5 py-1">
          最近 {visibleDays} 天
        </span>
      </div>
      {records.length === 0 && (
        <div className="glass-card rounded-xl px-4 py-6 mb-5 text-center text-sm text-text-light">
          最近 {visibleDays} 天没有喝奶记录
        </div>
      )}
      {Object.entries(grouped).map(([date, items]) => {
        const dayTotal = items.reduce((s, r) => s + r.amountMl, 0)
        return (
          <div key={date} className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-medium text-text-light">{date}</p>
              <p className="text-xs text-text-light bg-warm-50 rounded-full px-2.5 py-0.5">
                共 {items.length} 次 · {dayTotal}ml
              </p>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-warm-100 rounded-full" />
              <div>
                {items.map((r, idx) => (
                  <div key={r.id}>
                    {/* 时间间隔指示器 */}
                    {idx > 0 && (
                      <div className="flex items-center gap-2 py-1.5 pl-0.5">
                        <div className="w-[3px] h-[3px] rounded-full bg-warm-200 -ml-[1px]" />
                        <span className="text-[10px] text-text-light/60">间隔 {formatInterval(items[idx - 1].at, r.at)}</span>
                      </div>
                    )}
                    <div className="relative">
                      <div className={`absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 ${
                        editingId === r.id ? 'bg-warm-400 border-warm-400' : 'bg-card border-warm-200'
                      }`} />
                      <div className="glass-card rounded-xl overflow-hidden">
                        {editingId === r.id ? (
                          <div className="p-4 space-y-3">
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="block text-xs text-text-light mb-1">奶量 (ml)</label>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  value={editAmount}
                                  onChange={e => setEditAmount(e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl bg-cream border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-text-light mb-1">时间</label>
                                <input
                                  type="time"
                                  value={editTime}
                                  onChange={e => setEditTime(e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl bg-cream border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
                                />
                              </div>
                            </div>
                            {/* 备注标签选择 */}
                            <div>
                              <label className="block text-xs text-text-light mb-1">备注（可选）</label>
                              <div className="flex flex-wrap gap-1.5">
                                {presetTags.map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleEditTag(tag)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                      editTags.includes(tag)
                                        ? 'bg-warm-400 text-white'
                                        : 'bg-warm-50 text-text-light'
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* 自定义备注输入 */}
                            <div>
                              <input
                                type="text"
                                value={editCustomNote}
                                onChange={e => setEditCustomNote(e.target.value.slice(0, 50))}
                                maxLength={50}
                                placeholder="自定义备注..."
                                className="w-full px-3 py-2 rounded-xl bg-warm-50 border border-warm-100 text-sm text-text placeholder:text-text-light/50 focus:outline-none focus:border-warm-400 focus:ring-1 focus:ring-warm-400/20 transition-all"
                              />
                              <p className="text-[10px] text-text-light/60 mt-0.5 text-right">{editCustomNote.length}/50</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(r)}
                                disabled={saving || !editAmount}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition-all"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-2.5 rounded-xl bg-warm-50 text-text-light text-sm font-medium"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="py-2.5 px-4 rounded-xl bg-danger/10 text-danger text-sm font-medium"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(r)}
                            className="w-full px-3 py-2.5 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-text-light text-sm tabular-nums w-[42px] shrink-0">{formatTime(r.at)}</span>
                              <span className="text-text font-semibold tabular-nums w-[52px] shrink-0 text-right">{r.amountMl}<span className="text-sm font-normal text-text-light">ml</span></span>
                              <span className="text-xs text-white rounded-full px-2 py-0.5 shrink-0" style={{ backgroundColor: data?.colorMap?.[r.by] ?? '#9CA3AF' }}>{r.by}</span>
                              {r.notes && r.notes.length > 0 && (
                                <div className="flex flex-wrap gap-1 ml-auto">
                                  {r.notes.map((note, ni) => (
                                    <span key={ni} className="bg-warm-50 text-text-light text-[10px] rounded-full px-1.5 py-0.5">{note}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
      {hasOlderRecords && (
        <button
          type="button"
          onClick={() => setVisibleDays(days => days + HISTORY_PAGE_DAYS)}
          className="w-full py-3 mb-4 rounded-xl bg-warm-50 text-warm-500 text-sm font-medium active:scale-[0.98] transition-all"
        >
          加载更早的 30 天记录
        </button>
      )}
    </div>
  )
}
