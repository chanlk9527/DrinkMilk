import { useState, useEffect, useCallback, type MouseEvent } from 'react'
import type { AppData, FeedRecord } from '../lib/types'
import { DEFAULT_QUICK_AMOUNTS, DEFAULT_PRESET_TAGS } from '../lib/types'
import { getSettings } from '../lib/storage'
import { generateId, formatTimeSince, formatTime, getTodayStats, assignCaregiverColor, getDaysSinceBirth, formatAge } from '../lib/utils'

// 涟漪效果 hook
function useRipple() {
  const createRipple = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const circle = document.createElement('span')
    circle.className = 'ripple-circle'
    circle.style.width = circle.style.height = `${size}px`
    circle.style.left = `${x}px`
    circle.style.top = `${y}px`
    btn.appendChild(circle)
    circle.addEventListener('animationend', () => circle.remove())
  }, [])
  return createRipple
}

interface Props {
  data: AppData | null
  loading: boolean
  error: string
  onRefresh: () => void
  onAdd: (record: FeedRecord) => Promise<void>
}

export default function Home({ data, loading, error, onRefresh, onAdd }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [closingCustom, setClosingCustom] = useState(false)
  const [confirmMl, setConfirmMl] = useState<number | null>(null)
  const [closingConfirm, setClosingConfirm] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customNote, setCustomNote] = useState('')
  const [successMl, setSuccessMl] = useState<number | null>(null)
  const [successFading, setSuccessFading] = useState(false)
  const createRipple = useRipple()

  // 带动画的关闭函数
  const closeCustomSheet = useCallback(() => {
    setClosingCustom(true)
    setTimeout(() => { setShowCustom(false); setClosingCustom(false) }, 250)
  }, [])

  const closeConfirmDialog = useCallback(() => {
    setClosingConfirm(true)
    setTimeout(() => { resetNotes(); setConfirmMl(null); setClosingConfirm(false) }, 250)
  }, [])

  // 备注标签切换与构建
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }
  const buildNotes = (): string[] => {
    const notes = [...selectedTags]
    const trimmed = customNote.trim()
    if (trimmed) notes.push(trimmed)
    return notes
  }
  const resetNotes = () => {
    setSelectedTags([])
    setCustomNote('')
  }

  // 每30秒刷新一次，让"距离上次喝奶"时间保持更新
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  const records = data?.records ?? []
  const quickAmounts = data?.quickAmounts ?? DEFAULT_QUICK_AMOUNTS
  const sorted = [...records].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const lastRecord = sorted[0]
  const todayStats = getTodayStats(records)
  const recentRecords = sorted.slice(0, 5)
  const settings = getSettings()

  const handleAdd = async (amountMl: number, at?: string, notes?: string[]) => {
    setSaving(true)
    // Assign caregiver color if not already in colorMap
    const currentColorMap = data?.colorMap ?? {}
    if (!currentColorMap[settings.myName]) {
      const color = assignCaregiverColor(settings.myName, currentColorMap)
      currentColorMap[settings.myName] = color
    }
    await onAdd({
      id: generateId(),
      at: at || new Date().toISOString(),
      amountMl,
      by: settings.myName,
      notes: notes && notes.length > 0 ? notes : undefined,
    })
    setSaving(false)
    setClosingCustom(false)
    setShowCustom(false)
    setCustomAmount('')
    setCustomTime('')
    resetNotes()

    // 触发成功动画
    setSuccessMl(amountMl)
    setSuccessFading(false)
    setTimeout(() => setSuccessFading(true), 1200)
    setTimeout(() => { setSuccessMl(null); setSuccessFading(false) }, 1500)
  }

  return (
    <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
      {/* 宝宝年龄 */}
      {(data?.birthDate || settings.babyAvatar) && (
        <div className="flex items-center gap-3 px-1">
          {settings.babyAvatar && (
            <div className="w-14 h-14 rounded-full border-2 border-warm-200 overflow-hidden shadow-sm flex-shrink-0">
              <img src={settings.babyAvatar} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          {data?.birthDate && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-light truncate">{data.babyName || settings.babyName}</p>
              <p className="text-lg font-bold text-text">
                第 <span className="text-warm-500">{getDaysSinceBirth(data.birthDate) + 1}</span> 天
                <span className="text-sm font-normal text-text-light ml-2">{formatAge(data.birthDate)}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* 主状态卡片 - 渐变背景 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-warm-400 to-warm-500 p-6 shadow-lg">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute bottom-[-30px] left-[-10px] w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          {!data?.birthDate && settings.babyAvatar && (
            <div className="w-14 h-14 rounded-full border-2 border-white/40 overflow-hidden mx-auto mb-2 shadow">
              <img src={settings.babyAvatar} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <p className="text-white/80 text-sm text-center mb-1">距离上次喝奶</p>
          <p className="text-5xl font-extrabold text-white text-center tracking-tight mb-4">
            {lastRecord ? formatTimeSince(lastRecord.at) : '--'}
          </p>
          {lastRecord && (
            <div className="flex justify-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white">
                🕐 {formatTime(lastRecord.at)}
              </span>
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white">
                🍼 {lastRecord.amountMl}ml
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-white"
                style={{ backgroundColor: data?.colorMap?.[lastRecord.by] ?? '#9CA3AF' }}
              >
                👤 {lastRecord.by}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 今日统计 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-warm-500">{todayStats.count}</p>
          <p className="text-xs text-text-light mt-1">今日次数</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-warm-500">
            {todayStats.totalMl}<span className="text-base font-normal text-text-light">ml</span>
          </p>
          <p className="text-xs text-text-light mt-1">今日总量</p>
        </div>
      </div>

      {/* 快捷记录 */}
      <div>
        <p className="text-sm font-medium text-text-light mb-2.5">快捷记录</p>
        <div className="grid grid-cols-4 gap-2.5">
          {quickAmounts.map(ml => (
            <button
              key={ml}
              disabled={saving}
              onClick={(e) => { createRipple(e); resetNotes(); setConfirmMl(ml) }}
              className="ripple-btn relative py-3.5 rounded-2xl bg-card border border-warm-100 text-text font-semibold text-lg shadow-sm active:scale-95 active:bg-warm-50 transition-all disabled:opacity-50"
            >
              {ml}
              <span className="block text-[10px] font-normal text-text-light -mt-0.5">ml</span>
            </button>
          ))}
        </div>
      </div>

      {/* 自定义记录按钮 */}
      <button
        onClick={() => { setShowCustom(true); setCustomTime(new Date().toTimeString().slice(0, 5)) }}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-lg font-semibold shadow-md active:scale-[0.98] transition-transform"
      >
        ✏️ 自定义记录
      </button>

      {/* 错误提示 */}
      {error && (
        <div className="bg-danger/10 text-danger text-sm rounded-xl px-4 py-3 text-center">
          {error}
          <button onClick={onRefresh} className="underline ml-2">重试</button>
        </div>
      )}

      {/* 刷新 */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="w-full py-2 text-sm text-text-light active:text-warm-500 transition-colors disabled:opacity-50"
      >
        {loading ? '同步中...' : '↻ 刷新数据'}
      </button>

      {/* 最近记录 - 时间线风格 */}
      {recentRecords.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-light mb-2.5">最近记录</p>
          <div className="relative pl-6">
            {/* 时间线竖线 */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-warm-100 rounded-full" />
            <div className="space-y-2.5">
              {recentRecords.map((r, i) => (
                <div key={r.id} className="relative">
                  {/* 时间线圆点 */}
                  <div className={`absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 ${
                    i === 0 ? 'bg-warm-400 border-warm-400 shadow-sm' : 'bg-card border-warm-200'
                  }`} />
                  <div className="bg-card rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-text font-semibold">{r.amountMl}<span className="text-sm font-normal text-text-light">ml</span></span>
                        <span className="text-xs text-white rounded-full px-2 py-0.5" style={{ backgroundColor: data?.colorMap?.[r.by] ?? '#9CA3AF' }}>{r.by}</span>
                      </div>
                      <span className="text-text-light text-sm tabular-nums">{formatTime(r.at)}</span>
                    </div>
                    {r.notes && r.notes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.notes.map((note, ni) => (
                          <span key={ni} className="bg-warm-50 text-text-light text-[10px] rounded-full px-1.5 py-0.5">{note}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 自定义记录弹层 */}
      {showCustom && (
        <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${closingCustom ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={closeCustomSheet}>
          <div className={`bg-cream w-full max-w-lg rounded-t-3xl p-6 space-y-4 ${closingCustom ? 'animate-slide-down' : 'animate-slide-up'}`} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mb-2" />
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text">自定义记录</h2>
              <button onClick={closeCustomSheet} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-50 text-text-light text-lg leading-none">&times;</button>
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">奶量 (ml)</label>
              <input
                type="number"
                inputMode="numeric"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="例如 120"
                className="w-full px-4 py-3.5 rounded-xl bg-card border border-warm-100 text-text text-lg focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">时间</label>
              <input
                type="time"
                value={customTime}
                onChange={e => setCustomTime(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-card border border-warm-100 text-text text-lg focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
              />
            </div>

            {/* 备注标签选择 */}
            <div>
              <label className="block text-sm text-text-light mb-1.5">备注（可选）</label>
              <div className="flex flex-wrap gap-1.5">
                {(data?.presetTags ?? DEFAULT_PRESET_TAGS).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.includes(tag)
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
                value={customNote}
                onChange={e => setCustomNote(e.target.value.slice(0, 50))}
                maxLength={50}
                placeholder="自定义备注..."
                className="w-full px-3 py-2 rounded-xl bg-warm-50 border border-warm-100 text-sm text-text placeholder:text-text-light/50 focus:outline-none focus:border-warm-400 focus:ring-1 focus:ring-warm-400/20 transition-all"
              />
              <p className="text-[10px] text-text-light/60 mt-0.5 text-right">{customNote.length}/50</p>
            </div>

            <button
              disabled={!customAmount || saving}
              onClick={() => {
                const now = new Date()
                const [h, m] = (customTime || '00:00').split(':').map(Number)
                now.setHours(h, m, 0, 0)
                handleAdd(Number(customAmount), now.toISOString(), buildNotes())
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-lg font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* 快捷记录确认弹窗 */}
      {confirmMl !== null && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${closingConfirm ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={closeConfirmDialog}>
          <div className={`bg-card w-80 rounded-3xl p-6 text-center shadow-xl ${closingConfirm ? 'animate-success-out' : 'animate-success-in'}`} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-warm-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl">🍼</span>
            </div>
            <p className="text-base text-text-light mb-1">确认记录</p>
            <p className="text-4xl font-extrabold text-warm-500 mb-4">{confirmMl}<span className="text-lg font-normal text-text-light ml-1">ml</span></p>

            {/* 备注标签选择 */}
            <div className="text-left mb-3">
              <p className="text-xs text-text-light mb-1.5">备注（可选）</p>
              <div className="flex flex-wrap gap-1.5">
                {(data?.presetTags ?? DEFAULT_PRESET_TAGS).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.includes(tag)
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
            <div className="text-left mb-4">
              <input
                type="text"
                value={customNote}
                onChange={e => setCustomNote(e.target.value.slice(0, 50))}
                maxLength={50}
                placeholder="自定义备注..."
                className="w-full px-3 py-2 rounded-xl bg-warm-50 border border-warm-100 text-sm text-text placeholder:text-text-light/50 focus:outline-none focus:border-warm-400 focus:ring-1 focus:ring-warm-400/20 transition-all"
              />
              <p className="text-[10px] text-text-light/60 mt-0.5 text-right">{customNote.length}/50</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeConfirmDialog}
                className="flex-1 py-3 rounded-xl bg-warm-50 text-text-light font-medium active:bg-warm-100 transition-colors"
              >
                取消
              </button>
              <button
                disabled={saving}
                onClick={() => { handleAdd(confirmMl, undefined, buildNotes()); setConfirmMl(null) }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white font-medium disabled:opacity-50 active:scale-95 transition-all"
              >
                {saving ? '保存中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 记录成功动画 */}
      {successMl !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className={`flex flex-col items-center gap-3 ${successFading ? 'animate-success-out' : 'animate-success-in'}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-warm-400 to-warm-500 flex items-center justify-center shadow-lg">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M10 20 L17 27 L30 13"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="40"
                  strokeDashoffset="40"
                  style={{ animation: 'checkmark-draw 0.4s 0.2s ease forwards' }}
                />
              </svg>
            </div>
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl px-5 py-2.5 shadow-lg">
              <p className="text-lg font-bold text-warm-500">
                🍼 {successMl}ml 已记录
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
