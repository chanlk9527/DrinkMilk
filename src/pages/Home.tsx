import { useState, useEffect, useCallback, useRef, useMemo, type MouseEvent, type TouchEvent as ReactTouchEvent } from 'react'
import type { AppData, FeedRecord, DiaperRecord, SleepRecord } from '../lib/types'
import { DEFAULT_QUICK_AMOUNTS, DEFAULT_PRESET_TAGS, DIAPER_TYPES, POOP_COLORS, POOP_CONSISTENCIES } from '../lib/types'
import { getSettings } from '../lib/storage'
import { generateId, formatTimeSince, formatTime, getTodayStats, assignCaregiverColor, getDaysSinceBirth, formatAge, getCaregiverIcon, isToday, formatDate } from '../lib/utils'

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

type HomeTab = 'diaper' | 'feed' | 'sleep'

const HOME_TAB_KEY = 'milk_home_tab'

function getSavedTab(): HomeTab {
  const saved = localStorage.getItem(HOME_TAB_KEY)
  if (saved === 'diaper' || saved === 'feed' || saved === 'sleep') return saved
  return 'feed'
}

interface Props {
  data: AppData | null
  loading?: boolean
  error: string
  onRefresh: () => void
  onAdd: (record: FeedRecord) => Promise<void>
  onAddDiaper: (record: DiaperRecord) => Promise<void>
  onDeleteDiaper: (id: string) => Promise<void>
  onAddSleep: (record: SleepRecord) => Promise<void>
  onUpdateSleep: (record: SleepRecord) => Promise<void>
  onDeleteSleep: (id: string) => Promise<void>
}

export default function Home({ data, error, onRefresh, onAdd, onAddDiaper, onDeleteDiaper, onAddSleep, onUpdateSleep, onDeleteSleep }: Props) {
  const [activeTab, setActiveTab] = useState<HomeTab>(getSavedTab)

  const switchTab = (tab: HomeTab) => {
    setActiveTab(tab)
    localStorage.setItem(HOME_TAB_KEY, tab)
  }

  // 下拉刷新
  const pullRef = useRef<{ startY: number; pulling: boolean }>({ startY: 0, pulling: false })
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const PULL_THRESHOLD = 80

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    const scrollEl = (e.currentTarget as HTMLElement).closest('.overflow-y-auto')
    if (scrollEl && scrollEl.scrollTop > 0) return
    pullRef.current = { startY: e.touches[0].clientY, pulling: true }
  }, [])

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!pullRef.current.pulling) return
    const dy = e.touches[0].clientY - pullRef.current.startY
    if (dy > 0) setPullDistance(Math.min(dy * 0.5, 120))
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (!pullRef.current.pulling) return
    pullRef.current.pulling = false
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true)
      setPullDistance(PULL_THRESHOLD * 0.6)
      await onRefresh()
      setRefreshing(false)
    }
    setPullDistance(0)
  }, [pullDistance, onRefresh])

  const settings = getSettings()

  return (
    <div
      className="px-5 pt-6 pb-4 space-y-4 max-w-lg mx-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined, transition: pullRef.current.pulling ? 'none' : 'transform 0.3s ease' }}
    >
      {/* 下拉刷新指示器 */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-center z-40 pointer-events-none"
        style={{ opacity: pullDistance > 10 ? Math.min(pullDistance / PULL_THRESHOLD, 1) : 0, transition: pullRef.current.pulling ? 'none' : 'opacity 0.3s ease' }}
      >
        <div className="mt-2 bg-card/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md flex items-center gap-2">
          <span className={`text-base ${refreshing ? 'animate-spin' : ''}`} style={{ display: 'inline-block' }}>
            {refreshing ? '⏳' : pullDistance >= PULL_THRESHOLD ? '↑ 松开刷新' : '↓ 下拉刷新'}
          </span>
          {refreshing && <span className="text-xs text-text-light">同步中...</span>}
        </div>
      </div>

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

      {/* 子 Tab 切换 */}
      <div className="flex gap-1 p-1 rounded-2xl glass-card">
        {([
          ['diaper', '🩲 尿布'],
          ['feed', '🍼 喝奶'],
          ['sleep', '😴 睡眠'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key
                ? 'liquid-glass-btn text-warm-700 shadow-sm'
                : 'text-text-light'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-danger/10 text-danger text-sm rounded-xl px-4 py-3 text-center">
          {error}
          <button onClick={onRefresh} className="underline ml-2">重试</button>
        </div>
      )}

      {/* Tab 内容 */}
      {activeTab === 'feed' && <FeedContent data={data} onAdd={onAdd} />}
      {activeTab === 'diaper' && <DiaperContent data={data} onAdd={onAddDiaper} onDelete={onDeleteDiaper} />}
      {activeTab === 'sleep' && <SleepContent data={data} onAdd={onAddSleep} onUpdate={onUpdateSleep} onDelete={onDeleteSleep} />}
    </div>
  )
}


/* ============================================
   喝奶记录
   ============================================ */
function FeedContent({ data, onAdd }: { data: AppData | null; onAdd: (record: FeedRecord) => Promise<void> }) {
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
  const settings = getSettings()

  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  const closeCustomSheet = useCallback(() => {
    setClosingCustom(true)
    setTimeout(() => { setShowCustom(false); setClosingCustom(false) }, 250)
  }, [])
  const closeConfirmDialog = useCallback(() => {
    setClosingConfirm(true)
    setTimeout(() => { resetNotes(); setConfirmMl(null); setClosingConfirm(false) }, 250)
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }
  const buildNotes = (): string[] => {
    const notes = [...selectedTags]
    const trimmed = customNote.trim()
    if (trimmed) notes.push(trimmed)
    return notes
  }
  const resetNotes = () => { setSelectedTags([]); setCustomNote('') }

  const records = data?.records ?? []
  const quickAmounts = data?.quickAmounts ?? DEFAULT_QUICK_AMOUNTS
  const sorted = [...records].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const lastRecord = sorted[0]
  const todayStats = getTodayStats(records)
  const recentRecords = sorted.slice(0, 5)

  const handleAdd = async (amountMl: number, at?: string, notes?: string[]) => {
    setSaving(true)
    const currentColorMap = data?.colorMap ?? {}
    if (!currentColorMap[settings.myName]) {
      currentColorMap[settings.myName] = assignCaregiverColor(settings.myName, currentColorMap)
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
    setSuccessMl(amountMl)
    setSuccessFading(false)
    setTimeout(() => setSuccessFading(true), 1200)
    setTimeout(() => { setSuccessMl(null); setSuccessFading(false) }, 1500)
  }

  return (
    <div className="space-y-5">
      {/* 主状态卡片 */}
      <div className="liquid-glass-hero rounded-3xl p-6">
        <div className="relative z-10">
          <p className="text-text-light text-sm text-center mb-1">距离上次喝奶</p>
          <p className="text-5xl font-extrabold text-text text-center tracking-tight mb-4">
            {lastRecord ? formatTimeSince(lastRecord.at) : '--'}
          </p>
          {lastRecord && (
            <div className="flex justify-center gap-2 flex-wrap">
              <span className="liquid-glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-text">
                🕐 {formatTime(lastRecord.at)}
              </span>
              <span className="liquid-glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-text">
                🍼 {lastRecord.amountMl}ml
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-white"
                style={{ backgroundColor: data?.colorMap?.[lastRecord.by] ?? '#9CA3AF' }}
              >
                {getCaregiverIcon(lastRecord.by)} {lastRecord.by}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 今日统计 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-stat rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-warm-500">{todayStats.count}</p>
          <p className="text-xs text-text-light mt-1">今日次数</p>
        </div>
        <div className="glass-stat rounded-2xl p-4 text-center">
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
              className="ripple-btn relative py-3.5 rounded-2xl glass-btn text-text font-semibold text-lg active:scale-95 transition-all disabled:opacity-50"
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
        className="w-full py-4 rounded-2xl liquid-glass-btn text-lg font-semibold active:scale-[0.98] transition-transform"
      >
        ✏️ 自定义记录
      </button>

      {/* 最近记录 */}
      {recentRecords.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-light mb-2.5">最近记录</p>
          <div className="relative pl-6">
            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-warm-100 rounded-full" />
            <div className="space-y-2.5">
              {recentRecords.map((r, i) => (
                <div key={r.id} className="relative">
                  <div className={`absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 ${
                    i === 0 ? 'bg-warm-400 border-warm-400 shadow-sm' : 'bg-card border-warm-200'
                  }`} />
                  <div className="glass-card rounded-xl px-3 py-2.5">
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
          <div className={`glass-sheet w-full max-w-lg rounded-t-3xl p-6 space-y-4 ${closingCustom ? 'animate-slide-down' : 'animate-slide-up'}`} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mb-2" />
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text">自定义记录</h2>
              <button onClick={closeCustomSheet} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-50 text-text-light text-lg leading-none">&times;</button>
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">奶量 (ml)</label>
              <input type="number" inputMode="numeric" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="例如 120"
                className="w-full px-4 py-3.5 rounded-xl bg-card border border-warm-100 text-text text-lg focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" autoFocus />
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">时间</label>
              <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-card border border-warm-100 text-text text-lg focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">备注（可选）</label>
              <div className="flex flex-wrap gap-1.5">
                {(data?.presetTags ?? DEFAULT_PRESET_TAGS).map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag) ? 'bg-warm-400 text-white' : 'bg-warm-50 text-text-light'}`}>{tag}</button>
                ))}
              </div>
            </div>
            <div>
              <input type="text" value={customNote} onChange={e => setCustomNote(e.target.value.slice(0, 50))} maxLength={50} placeholder="自定义备注..."
                className="w-full px-3 py-2 rounded-xl bg-warm-50 border border-warm-100 text-sm text-text placeholder:text-text-light/50 focus:outline-none focus:border-warm-400 focus:ring-1 focus:ring-warm-400/20 transition-all" />
              <p className="text-[10px] text-text-light/60 mt-0.5 text-right">{customNote.length}/50</p>
            </div>
            <button disabled={!customAmount || saving} onClick={() => {
              const now = new Date(); const [h, m] = (customTime || '00:00').split(':').map(Number); now.setHours(h, m, 0, 0)
              handleAdd(Number(customAmount), now.toISOString(), buildNotes())
            }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-lg font-semibold disabled:opacity-40 active:scale-[0.98] transition-all">
              保存
            </button>
          </div>
        </div>
      )}

      {/* 快捷记录确认弹窗 */}
      {confirmMl !== null && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${closingConfirm ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={closeConfirmDialog}>
          <div className={`glass-dialog w-80 rounded-3xl p-6 text-center ${closingConfirm ? 'animate-success-out' : 'animate-success-in'}`} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-warm-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl">🍼</span>
            </div>
            <p className="text-base text-text-light mb-1">确认记录</p>
            <p className="text-4xl font-extrabold text-warm-500 mb-4">{confirmMl}<span className="text-lg font-normal text-text-light ml-1">ml</span></p>
            <div className="text-left mb-3">
              <p className="text-xs text-text-light mb-1.5">备注（可选）</p>
              <div className="flex flex-wrap gap-1.5">
                {(data?.presetTags ?? DEFAULT_PRESET_TAGS).map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag) ? 'bg-warm-400 text-white' : 'bg-warm-50 text-text-light'}`}>{tag}</button>
                ))}
              </div>
            </div>
            <div className="text-left mb-4">
              <input type="text" value={customNote} onChange={e => setCustomNote(e.target.value.slice(0, 50))} maxLength={50} placeholder="自定义备注..."
                className="w-full px-3 py-2 rounded-xl bg-warm-50 border border-warm-100 text-sm text-text placeholder:text-text-light/50 focus:outline-none focus:border-warm-400 focus:ring-1 focus:ring-warm-400/20 transition-all" />
              <p className="text-[10px] text-text-light/60 mt-0.5 text-right">{customNote.length}/50</p>
            </div>
            <div className="flex gap-3">
              <button onClick={closeConfirmDialog} className="flex-1 py-3 rounded-xl bg-warm-50 text-text-light font-medium active:bg-warm-100 transition-colors">取消</button>
              <button disabled={saving} onClick={() => { handleAdd(confirmMl, undefined, buildNotes()); setConfirmMl(null) }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white font-medium disabled:opacity-50 active:scale-95 transition-all">
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
            <div className="w-20 h-20 rounded-full liquid-glass-hero flex items-center justify-center shadow-lg">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M10 20 L17 27 L30 13" stroke="var(--color-warm-500)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="40" strokeDashoffset="40" style={{ animation: 'checkmark-draw 0.4s 0.2s ease forwards' }} />
              </svg>
            </div>
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl px-5 py-2.5 shadow-lg">
              <p className="text-lg font-bold text-warm-500">🍼 {successMl}ml 已记录</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


/* ============================================
   换尿布记录
   ============================================ */
function DiaperContent({ data, onAdd, onDelete }: {
  data: AppData | null
  onAdd: (record: DiaperRecord) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)
  const [closingForm, setClosingForm] = useState(false)
  const [diaperType, setDiaperType] = useState<DiaperRecord['type']>('pee')
  const [color, setColor] = useState('')
  const [consistency, setConsistency] = useState('')
  const [notes, setNotes] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const settings = getSettings()

  const closeFormSheet = useCallback(() => {
    setClosingForm(true)
    setTimeout(() => { setShowForm(false); setClosingForm(false) }, 250)
  }, [])

  const records = useMemo(() =>
    [...(data?.diaperRecords ?? [])].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [data?.diaperRecords]
  )

  const todayRecords = useMemo(() => records.filter(r => isToday(r.at)), [records])
  const todayPee = todayRecords.filter(r => r.type === 'pee' || r.type === 'mixed').length
  const todayPoop = todayRecords.filter(r => r.type === 'poop' || r.type === 'mixed').length

  const openForm = () => {
    setDiaperType('pee'); setColor(''); setConsistency(''); setNotes('')
    setCustomTime(new Date().toTimeString().slice(0, 5))
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const now = new Date()
    const [h, m] = (customTime || '00:00').split(':').map(Number)
    now.setHours(h, m, 0, 0)
    await onAdd({
      id: generateId(), at: now.toISOString(), type: diaperType,
      color: (diaperType !== 'pee' && color) ? color : undefined,
      consistency: (diaperType !== 'pee' && consistency) ? consistency : undefined,
      by: settings.myName, notes: notes.trim() || undefined,
    })
    setSaving(false); setShowForm(false)
  }

  const handleDelete = async (id: string) => { await onDelete(id); setDeleteConfirm(null) }
  const typeIcon = (type: string) => DIAPER_TYPES.find(t => t.value === type)?.icon ?? '🩲'
  const typeLabel = (type: string) => DIAPER_TYPES.find(t => t.value === type)?.label ?? type

  return (
    <div className="space-y-5">
      {/* 今日统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-stat rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-warm-500">{todayRecords.length}</p>
          <p className="text-xs text-text-light mt-1">今日总次数</p>
        </div>
        <div className="glass-stat rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{todayPee}</p>
          <p className="text-xs text-text-light mt-1">💧 小便</p>
        </div>
        <div className="glass-stat rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-500">{todayPoop}</p>
          <p className="text-xs text-text-light mt-1">💩 大便</p>
        </div>
      </div>

      {/* 快捷记录 */}
      <div>
        <p className="text-sm font-medium text-text-light mb-2.5">快捷记录</p>
        <div className="grid grid-cols-3 gap-2.5">
          {DIAPER_TYPES.map(dt => (
            <button key={dt.value} disabled={saving} onClick={async () => {
              setSaving(true)
              await onAdd({ id: generateId(), at: new Date().toISOString(), type: dt.value, by: settings.myName })
              setSaving(false)
            }} className="py-4 rounded-2xl glass-btn text-text font-semibold active:scale-95 transition-all disabled:opacity-50">
              <span className="text-2xl block mb-1">{dt.icon}</span>
              <span className="text-sm">{dt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 详细记录按钮 */}
      <button onClick={openForm} className="w-full py-4 rounded-2xl liquid-glass-btn text-lg font-semibold active:scale-[0.98] transition-transform">
        ✏️ 详细记录
      </button>

      {/* 最近记录 */}
      {records.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-light mb-2.5">最近记录</p>
          <div className="space-y-2">
            {records.slice(0, 10).map(r => (
              <div key={r.id} className="glass-card rounded-xl px-4 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{typeIcon(r.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text">{typeLabel(r.type)}</span>
                        <span className="text-xs text-text-light">{formatTime(r.at)}</span>
                        <span className="text-xs text-text-light/60">{formatDate(r.at)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {r.color && <span className="text-[10px] bg-warm-50 text-text-light rounded-full px-1.5 py-0.5">{r.color}</span>}
                        {r.consistency && <span className="text-[10px] bg-warm-50 text-text-light rounded-full px-1.5 py-0.5">{r.consistency}</span>}
                        {r.notes && <span className="text-[10px] bg-warm-50 text-text-light rounded-full px-1.5 py-0.5">{r.notes}</span>}
                        <span className="text-[10px] text-text-light/50">{r.by}</span>
                      </div>
                    </div>
                  </div>
                  {deleteConfirm === r.id ? (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleDelete(r.id)} className="text-xs px-2 py-1 rounded-lg bg-danger/10 text-danger">删除</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded-lg bg-warm-50 text-text-light">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(r.id)} className="text-text-light text-xs px-2 py-1 flex-shrink-0">···</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-text-light">
          <div className="w-20 h-20 rounded-full bg-warm-50 flex items-center justify-center mb-4"><span className="text-4xl">🩲</span></div>
          <p className="text-base">还没有换尿布记录</p>
          <p className="text-sm mt-1">点击上方按钮开始记录吧</p>
        </div>
      )}

      {/* 详细记录弹层 */}
      {showForm && (
        <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${closingForm ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={closeFormSheet}>
          <div className={`glass-sheet w-full max-w-lg rounded-t-3xl p-6 space-y-4 ${closingForm ? 'animate-slide-down' : 'animate-slide-up'}`} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mb-2" />
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text">记录换尿布</h2>
              <button onClick={closeFormSheet} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-50 text-text-light text-lg leading-none">&times;</button>
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">类型</label>
              <div className="flex gap-2">
                {DIAPER_TYPES.map(dt => (
                  <button key={dt.value} onClick={() => setDiaperType(dt.value)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${diaperType === dt.value ? 'bg-warm-400 text-white shadow-sm' : 'glass-btn text-text-light'}`}>
                    {dt.icon} {dt.label}
                  </button>
                ))}
              </div>
            </div>
            {diaperType !== 'pee' && (
              <>
                <div>
                  <label className="block text-sm text-text-light mb-1.5">颜色（可选）</label>
                  <div className="flex flex-wrap gap-1.5">
                    {POOP_COLORS.map(c => (
                      <button key={c} onClick={() => setColor(color === c ? '' : c)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${color === c ? 'bg-warm-400 text-white' : 'bg-warm-50 text-text-light'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-light mb-1.5">性状（可选）</label>
                  <div className="flex flex-wrap gap-1.5">
                    {POOP_CONSISTENCIES.map(c => (
                      <button key={c} onClick={() => setConsistency(consistency === c ? '' : c)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${consistency === c ? 'bg-warm-400 text-white' : 'bg-warm-50 text-text-light'}`}>{c}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-text-light mb-1.5">时间</label>
              <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">备注（可选）</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value.slice(0, 50))} maxLength={50} placeholder="例如：有点红屁屁"
                className="w-full px-4 py-3 rounded-xl bg-card border border-warm-100 text-text text-sm focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
            </div>
            <button disabled={saving} onClick={handleSubmit}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-lg font-semibold disabled:opacity-40 active:scale-[0.98] transition-all">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


/* ============================================
   睡眠记录
   ============================================ */
function SleepContent({ data, onAdd, onUpdate, onDelete }: {
  data: AppData | null
  onAdd: (record: SleepRecord) => Promise<void>
  onUpdate: (record: SleepRecord) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)
  const [closingForm, setClosingForm] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const settings = getSettings()

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  const closeFormSheet = useCallback(() => {
    setClosingForm(true)
    setTimeout(() => { setShowForm(false); setClosingForm(false) }, 250)
  }, [])

  const records = useMemo(() =>
    [...(data?.sleepRecords ?? [])].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [data?.sleepRecords]
  )

  const activeSleep = records.find(r => !r.endAt)

  const todayRecords = useMemo(() => {
    const now = new Date()
    return records.filter(r => {
      const d = new Date(r.startAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    })
  }, [records])

  const todayTotalMinutes = useMemo(() =>
    todayRecords.reduce((sum, r) => {
      const start = new Date(r.startAt).getTime()
      const end = r.endAt ? new Date(r.endAt).getTime() : Date.now()
      return sum + (end - start) / 60000
    }, 0),
  [todayRecords])

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    if (h === 0) return `${m} 分钟`
    if (m === 0) return `${h} 小时`
    return `${h} 小时 ${m} 分`
  }

  const getSleepDuration = (r: SleepRecord) => {
    const start = new Date(r.startAt).getTime()
    const end = r.endAt ? new Date(r.endAt).getTime() : Date.now()
    return (end - start) / 60000
  }

  const handleStartSleep = async () => {
    setSaving(true)
    await onAdd({ id: generateId(), startAt: new Date().toISOString(), by: settings.myName })
    setSaving(false)
  }

  const handleEndSleep = async () => {
    if (!activeSleep) return
    setSaving(true)
    await onUpdate({ ...activeSleep, endAt: new Date().toISOString() })
    setSaving(false)
  }

  const openForm = () => { setStartTime(''); setEndTime(''); setNotes(''); setShowForm(true) }

  const handleSubmit = async () => {
    if (!startTime) return
    setSaving(true)
    const now = new Date()
    const [sh, sm] = startTime.split(':').map(Number)
    const startDate = new Date(now); startDate.setHours(sh, sm, 0, 0)
    const record: SleepRecord = { id: generateId(), startAt: startDate.toISOString(), by: settings.myName, notes: notes.trim() || undefined }
    if (endTime) {
      const [eh, em] = endTime.split(':').map(Number)
      const endDate = new Date(now); endDate.setHours(eh, em, 0, 0)
      if (endDate.getTime() <= startDate.getTime()) endDate.setDate(endDate.getDate() + 1)
      record.endAt = endDate.toISOString()
    }
    await onAdd(record)
    setSaving(false); setShowForm(false)
  }

  const handleDelete = async (id: string) => { await onDelete(id); setDeleteConfirm(null) }

  return (
    <div className="space-y-5">
      {/* 睡眠状态卡片 */}
      <div className="liquid-glass-hero rounded-3xl p-6">
        <div className="relative z-10 text-center">
          {activeSleep ? (
            <>
              <p className="text-4xl mb-2">😴</p>
              <p className="text-text-light text-sm mb-1">正在睡觉中...</p>
              <p className="text-4xl font-extrabold text-text tracking-tight mb-1">
                {formatDuration(getSleepDuration(activeSleep))}
              </p>
              <p className="text-xs text-text-light mb-4">{formatTime(activeSleep.startAt)} 入睡</p>
              <button disabled={saving} onClick={handleEndSleep}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 text-white text-base font-semibold disabled:opacity-50 active:scale-95 transition-all">
                {saving ? '记录中...' : '🌞 醒了'}
              </button>
            </>
          ) : (
            <>
              <p className="text-4xl mb-2">🌙</p>
              <p className="text-text-light text-sm mb-4">宝宝还没睡</p>
              <button disabled={saving} onClick={handleStartSleep}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-400 to-indigo-500 text-white text-base font-semibold disabled:opacity-50 active:scale-95 transition-all">
                {saving ? '记录中...' : '😴 开始睡觉'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 今日统计 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-stat rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-indigo-400">{todayRecords.length}</p>
          <p className="text-xs text-text-light mt-1">今日睡眠次数</p>
        </div>
        <div className="glass-stat rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{formatDuration(todayTotalMinutes)}</p>
          <p className="text-xs text-text-light mt-1">今日总睡眠</p>
        </div>
      </div>

      {/* 手动记录按钮 */}
      <button onClick={openForm} className="w-full py-4 rounded-2xl liquid-glass-btn text-lg font-semibold active:scale-[0.98] transition-transform">
        ✏️ 手动记录
      </button>

      {/* 最近记录 */}
      {records.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-light mb-2.5">最近记录</p>
          <div className="space-y-2">
            {records.slice(0, 10).map(r => (
              <div key={r.id} className="glass-card rounded-xl px-4 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{r.endAt ? '😴' : '💤'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text">
                          {formatTime(r.startAt)}{r.endAt ? ` → ${formatTime(r.endAt)}` : ' → 进行中...'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-indigo-400 font-medium">{formatDuration(getSleepDuration(r))}</span>
                        <span className="text-[10px] text-text-light/60">{formatDate(r.startAt)}</span>
                        <span className="text-[10px] text-text-light/50">{r.by}</span>
                        {r.notes && <span className="text-[10px] bg-warm-50 text-text-light rounded-full px-1.5 py-0.5">{r.notes}</span>}
                      </div>
                    </div>
                  </div>
                  {deleteConfirm === r.id ? (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleDelete(r.id)} className="text-xs px-2 py-1 rounded-lg bg-danger/10 text-danger">删除</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded-lg bg-warm-50 text-text-light">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(r.id)} className="text-text-light text-xs px-2 py-1 flex-shrink-0">···</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-text-light">
          <div className="w-20 h-20 rounded-full bg-warm-50 flex items-center justify-center mb-4"><span className="text-4xl">😴</span></div>
          <p className="text-base">还没有睡眠记录</p>
          <p className="text-sm mt-1">点击上方按钮开始记录吧</p>
        </div>
      )}

      {/* 手动记录弹层 */}
      {showForm && (
        <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${closingForm ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={closeFormSheet}>
          <div className={`glass-sheet w-full max-w-lg rounded-t-3xl p-6 space-y-4 ${closingForm ? 'animate-slide-down' : 'animate-slide-up'}`} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mb-2" />
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text">手动记录睡眠</h2>
              <button onClick={closeFormSheet} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-50 text-text-light text-lg leading-none">&times;</button>
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">入睡时间</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">醒来时间（可选，留空表示进行中）</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">备注（可选）</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value.slice(0, 50))} maxLength={50} placeholder="例如：哄了很久才睡"
                className="w-full px-4 py-3 rounded-xl bg-card border border-warm-100 text-text text-sm focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
            </div>
            <button disabled={saving || !startTime} onClick={handleSubmit}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-lg font-semibold disabled:opacity-40 active:scale-[0.98] transition-all">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
