import { useState, useMemo, useCallback } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import type { AppData, GrowthRecord } from '../lib/types'
import { generateId, formatAge } from '../lib/utils'
import { getSettings } from '../lib/storage'
import {
  SORTED_SCHEDULE,
  getVaccineRecords,
  saveVaccineRecord,
  removeVaccineRecord,
  getVaccineStatus,
  getDaysUntilDue,
  getVaccineDueDate,
  getSkippedVaccines,
  skipVaccine,
  unskipVaccine,
  type VaccineRecord,
  type VaccineSkipRecord,
  type VaccineStatus,
} from '../lib/vaccines'
import { loadVaccineData, saveVaccineData } from '../lib/google-drive'

interface Props {
  data: AppData | null
  onAddGrowth: (record: GrowthRecord) => Promise<void>
  onDeleteGrowth: (id: string) => Promise<void>
}

type SubTab = 'growth' | 'vaccine'

export default function Growth({ data, onAddGrowth, onDeleteGrowth }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('growth')

  return (
    <div className="px-5 pt-5 pb-4 max-w-lg mx-auto">
      {/* 顶部子 Tab */}
      <div className="flex gap-1 p-1 rounded-2xl glass-card mb-5">
        {([
          ['growth', '🌱 发育记录'],
          ['vaccine', '💉 疫苗接种'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              subTab === key
                ? 'liquid-glass-btn text-warm-700 shadow-sm'
                : 'text-text-light'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'growth'
        ? <GrowthContent data={data} onAddGrowth={onAddGrowth} onDeleteGrowth={onDeleteGrowth} />
        : <VaccineContent />
      }
    </div>
  )
}

/* ============================================
   发育记录子页面
   ============================================ */
function GrowthContent({ data, onAddGrowth, onDeleteGrowth }: Props) {
  const [closingForm, setClosingForm] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [headCm, setHeadCm] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const closeFormSheet = useCallback(() => {
    setClosingForm(true)
    setTimeout(() => { setShowForm(false); setClosingForm(false) }, 250)
  }, [])

  const records = useMemo(() =>
    [...(data?.growthRecords ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [data?.growthRecords]
  )

  const chartData = useMemo(() =>
    records.map(r => ({
      date: r.date.slice(5),
      体重: r.weightKg ?? null,
      身高: r.heightCm ?? null,
      头围: r.headCm ?? null,
    })),
    [records]
  )

  const latestRecord = records[records.length - 1]

  const handleSubmit = async () => {
    const w = weightKg ? parseFloat(weightKg) : undefined
    const h = heightCm ? parseFloat(heightCm) : undefined
    const hd = headCm ? parseFloat(headCm) : undefined
    if (!w && !h && !hd) return
    setSaving(true)
    await onAddGrowth({
      id: generateId(),
      date,
      weightKg: w,
      heightCm: h,
      headCm: hd,
      notes: notes.trim() || undefined,
    })
    setSaving(false)
    setShowForm(false)
    setWeightKg(''); setHeightCm(''); setHeadCm(''); setNotes('')
  }

  const handleDelete = async (id: string) => {
    await onDeleteGrowth(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">发育记录</h2>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl liquid-glass-btn text-sm font-medium active:scale-95 transition-transform">
          + 记录
        </button>
      </div>

      {/* 最新数据卡片 */}
      {latestRecord && (
        <div className="liquid-glass-hero rounded-3xl p-5">
          <div className="relative z-10">
            <p className="text-text-light text-sm mb-2">最新记录 · {latestRecord.date}</p>
            <div className="flex gap-4">
              {latestRecord.weightKg != null && (
                <div>
                  <p className="text-3xl font-extrabold text-text">{latestRecord.weightKg}<span className="text-base font-normal text-text-light"> kg</span></p>
                  <p className="text-text-light/70 text-xs">体重</p>
                </div>
              )}
              {latestRecord.heightCm != null && (
                <div>
                  <p className="text-3xl font-extrabold text-text">{latestRecord.heightCm}<span className="text-base font-normal text-text-light"> cm</span></p>
                  <p className="text-text-light/70 text-xs">身高</p>
                </div>
              )}
              {latestRecord.headCm != null && (
                <div>
                  <p className="text-3xl font-extrabold text-text">{latestRecord.headCm}<span className="text-base font-normal text-text-light"> cm</span></p>
                  <p className="text-text-light/70 text-xs">头围</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 成长曲线 */}
      {chartData.length >= 2 && (
        <div className="space-y-4">
          {chartData.some(d => d.体重 != null) && (
            <div className="glass-card rounded-2xl p-4">
              <p className="text-sm font-medium text-text mb-3">体重趋势 (kg)</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.filter(d => d.体重 != null)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFE8D0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B7355' }} tickLine={false} axisLine={{ stroke: '#FFE8D0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B7355' }} tickLine={false} axisLine={false} unit="kg" domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip contentStyle={{ background: '#FFF8F0', border: '1px solid #FFE8D0', borderRadius: 12, fontSize: 13 }} />
                    <Line type="monotone" dataKey="体重" stroke="#FFA04D" strokeWidth={2.5} dot={{ fill: '#FFA04D', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {chartData.some(d => d.身高 != null) && (
            <div className="glass-card rounded-2xl p-4">
              <p className="text-sm font-medium text-text mb-3">身高趋势 (cm)</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.filter(d => d.身高 != null)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFE8D0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B7355' }} tickLine={false} axisLine={{ stroke: '#FFE8D0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B7355' }} tickLine={false} axisLine={false} unit="cm" domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={{ background: '#FFF8F0', border: '1px solid #FFE8D0', borderRadius: 12, fontSize: 13 }} />
                    <Line type="monotone" dataKey="身高" stroke="#60A5FA" strokeWidth={2.5} dot={{ fill: '#60A5FA', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 记录列表 */}
      {records.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-text-light mb-2.5">历史记录</p>
          <div className="space-y-2">
            {[...records].reverse().map(r => (
              <div key={r.id} className="glass-card rounded-xl px-4 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-text-light mb-1">{r.date}</p>
                    <div className="flex flex-wrap gap-2">
                      {r.weightKg != null && <span className="text-sm font-medium text-text">体重 {r.weightKg}kg</span>}
                      {r.heightCm != null && <span className="text-sm font-medium text-text">身高 {r.heightCm}cm</span>}
                      {r.headCm != null && <span className="text-sm font-medium text-text">头围 {r.headCm}cm</span>}
                    </div>
                    {r.notes && <p className="text-xs text-text-light mt-1">{r.notes}</p>}
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
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-text-light">
          <div className="w-20 h-20 rounded-full bg-warm-50 flex items-center justify-center mb-4">
            <span className="text-4xl">📏</span>
          </div>
          <p className="text-base">还没有成长记录</p>
          <p className="text-sm mt-1">点击右上角开始记录吧</p>
        </div>
      )}

      {/* 新增记录弹层 */}
      {showForm && (
        <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${closingForm ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={closeFormSheet}>
          <div className={`glass-sheet w-full max-w-lg rounded-t-3xl p-6 space-y-4 ${closingForm ? 'animate-slide-down' : 'animate-slide-up'}`} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mb-2" />
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text">记录成长数据</h2>
              <button onClick={closeFormSheet} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-50 text-text-light text-lg leading-none">&times;</button>
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">日期</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-text-light mb-1.5">体重 (kg)</label>
                <input type="number" inputMode="decimal" step="0.01" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="3.5"
                  className="w-full px-3 py-3 rounded-xl bg-card border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm text-text-light mb-1.5">身高 (cm)</label>
                <input type="number" inputMode="decimal" step="0.1" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="50"
                  className="w-full px-3 py-3 rounded-xl bg-card border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm text-text-light mb-1.5">头围 (cm)</label>
                <input type="number" inputMode="decimal" step="0.1" value={headCm} onChange={e => setHeadCm(e.target.value)} placeholder="35"
                  className="w-full px-3 py-3 rounded-xl bg-card border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-light mb-1.5">备注（可选）</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value.slice(0, 50))} maxLength={50} placeholder="例如：体检记录"
                className="w-full px-4 py-3 rounded-xl bg-card border border-warm-100 text-text text-sm focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all" />
            </div>
            <button disabled={saving || (!weightKg && !heightCm && !headCm)} onClick={handleSubmit}
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
   疫苗接种子页面
   ============================================ */

const VACCINE_STATUS_CONFIG: Record<VaccineStatus, { label: string; color: string; bg: string }> = {
  overdue:  { label: '已过期', color: 'text-red-500', bg: 'bg-red-50' },
  upcoming: { label: '即将到期', color: 'text-amber-600', bg: 'bg-amber-50' },
  future:   { label: '未到期', color: 'text-text-light', bg: 'bg-warm-50' },
  done:     { label: '已接种', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  skipped:  { label: '已跳过', color: 'text-gray-400', bg: 'bg-gray-50' },
}

type FilterTab = 'all' | 'upcoming' | 'done'

function VaccineContent() {
  const settings = getSettings()
  const birthDate = settings.birthDate
  const [records, setRecords] = useState<VaccineRecord[]>(getVaccineRecords)
  const [skippedList, setSkippedList] = useState<VaccineSkipRecord[]>(getSkippedVaccines)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDoneId, setConfirmDoneId] = useState<string | null>(null)
  const [confirmUndoId, setConfirmUndoId] = useState<string | null>(null)
  const [confirmSkipId, setConfirmSkipId] = useState<string | null>(null)
  const [confirmUnskipId, setConfirmUnskipId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  // 从云端加载疫苗数据
  useState(() => {
    loadVaccineData().then(data => {
      setRecords(data.records)
      setSkippedList(data.skipped)
      // 同步到本地缓存
      localStorage.setItem('milk_vaccine_records', JSON.stringify(data.records))
      localStorage.setItem('milk_vaccine_skipped', JSON.stringify(data.skipped))
    }).catch(() => { /* 失败时使用本地缓存，已在初始值中加载 */ })
  })

  // 保存到云端 + 本地
  const syncToCloud = useCallback(async (newRecords: VaccineRecord[], newSkipped: VaccineSkipRecord[]) => {
    setSyncing(true)
    try {
      await saveVaccineData({ records: newRecords, skipped: newSkipped })
    } catch { /* 云端保存失败，本地已保存 */ }
    setSyncing(false)
  }, [])

  if (!birthDate) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">💉</span>
        <h2 className="text-lg font-bold text-text mb-2">疫苗接种提醒</h2>
        <p className="text-text-light text-sm">
          请先在「设置」中填写宝宝的出生日期，才能计算疫苗接种时间哦
        </p>
      </div>
    )
  }

  const enriched = SORTED_SCHEDULE.map(dose => {
    const status = getVaccineStatus(dose, birthDate, records, skippedList)
    const daysUntil = getDaysUntilDue(birthDate, dose.ageMonths)
    const dueDate = getVaccineDueDate(birthDate, dose.ageMonths)
    const doneRecord = records.find(r => r.vaccineId === dose.id)
    const skipRecord = skippedList.find(s => s.vaccineId === dose.id)
    return { dose, status, daysUntil, dueDate, doneRecord, skipRecord }
  })

  const filtered = filter === 'upcoming'
    ? enriched.filter(e => e.status === 'overdue' || e.status === 'upcoming')
    : filter === 'done'
      ? enriched.filter(e => e.status === 'done' || e.status === 'skipped')
      : enriched

  const stats = {
    done: enriched.filter(e => e.status === 'done').length,
    skipped: enriched.filter(e => e.status === 'skipped').length,
    overdue: enriched.filter(e => e.status === 'overdue').length,
    upcoming: enriched.filter(e => e.status === 'upcoming').length,
    total: enriched.length,
  }

  const nextDue = enriched.find(e => e.status === 'upcoming' || e.status === 'future')

  const handleMarkDone = (vaccineId: string) => {
    const today = new Date().toISOString().slice(0, 10)
    saveVaccineRecord({ vaccineId, doneDate: today })
    const newRecords = getVaccineRecords()
    setRecords(newRecords)
    setConfirmDoneId(null)
    setExpandedId(null)
    syncToCloud(newRecords, skippedList)
  }

  const handleUndo = (vaccineId: string) => {
    removeVaccineRecord(vaccineId)
    const newRecords = getVaccineRecords()
    setRecords(newRecords)
    setConfirmUndoId(null)
    setExpandedId(null)
    syncToCloud(newRecords, skippedList)
  }

  const handleSkip = (vaccineId: string) => {
    skipVaccine(vaccineId, '不适用')
    const newSkipped = getSkippedVaccines()
    setSkippedList(newSkipped)
    setConfirmSkipId(null)
    setExpandedId(null)
    syncToCloud(records, newSkipped)
  }

  const handleUnskip = (vaccineId: string) => {
    unskipVaccine(vaccineId)
    const newSkipped = getSkippedVaccines()
    setSkippedList(newSkipped)
    setConfirmUnskipId(null)
    setExpandedId(null)
    syncToCloud(records, newSkipped)
  }

  const formatDueDate = (d: Date) =>
    d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  const formatCountdown = (days: number) => {
    if (days === 0) return '就是今天！'
    if (days > 0) {
      if (days > 365) {
        const y = Math.floor(days / 365)
        const m = Math.floor((days % 365) / 30)
        return m > 0 ? `还有 ${y} 年 ${m} 个月` : `还有 ${y} 年`
      }
      if (days > 30) {
        const m = Math.floor(days / 30)
        const d = days % 30
        return d > 0 ? `还有 ${m} 个月 ${d} 天` : `还有 ${m} 个月`
      }
      return `还有 ${days} 天`
    }
    const absDays = Math.abs(days)
    if (absDays > 365) {
      const y = Math.floor(absDays / 365)
      const m = Math.floor((absDays % 365) / 30)
      return m > 0 ? `已过期 ${y} 年 ${m} 个月` : `已过期 ${y} 年`
    }
    if (absDays > 30) {
      const m = Math.floor(absDays / 30)
      return `已过期 ${m} 个月`
    }
    return `已过期 ${absDays} 天`
  }

  return (
    <div className="space-y-4">
      {/* 概览卡片 */}
      <div className="liquid-glass-hero rounded-3xl p-5">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-text">疫苗接种提醒</h2>
              {syncing && <span className="text-[10px] text-text-light/50">同步中...</span>}
              <p className="text-xs text-text-light mt-0.5">
                {settings.babyName || '宝宝'} · {formatAge(birthDate)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-warm-500">{stats.done + stats.skipped}/{stats.total}</div>
              <div className="text-xs text-text-light">已完成</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="h-2 rounded-full bg-white/40 overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((stats.done + stats.skipped) / stats.total) * 100}%`,
                background: 'linear-gradient(90deg, #7BC4A8, #5AB892)',
              }}
            />
          </div>

          {/* 下一针提醒 */}
          {nextDue && (
            <div className="glass-card rounded-2xl p-3 flex items-center gap-3">
              <div className="text-3xl">{nextDue.dose.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text truncate">
                  下一针：{nextDue.dose.vaccine} {nextDue.dose.dose}
                </div>
                <div className="text-xs text-text-light">
                  {formatDueDate(nextDue.dueDate)} · {nextDue.dose.ageLabel}
                </div>
              </div>
              <div className={`text-sm font-bold whitespace-nowrap ${
                nextDue.status === 'overdue' ? 'text-red-500' : 'text-warm-500'
              }`}>
                {formatCountdown(nextDue.daysUntil)}
              </div>
            </div>
          )}

          {(stats.overdue > 0 || stats.upcoming > 0) && (
            <div className="flex gap-2 mt-3">
              {stats.overdue > 0 && (
                <span className="liquid-glass-pill rounded-full px-3 py-1 text-xs text-red-500 font-medium">
                  ⚠️ {stats.overdue} 针已过期
                </span>
              )}
              {stats.upcoming > 0 && (
                <span className="liquid-glass-pill rounded-full px-3 py-1 text-xs text-amber-600 font-medium">
                  ⏰ {stats.upcoming} 针即将到期
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2">
        {([
          ['all', '全部', `${stats.total}`],
          ['upcoming', '待接种', `${stats.overdue + stats.upcoming}`],
          ['done', '已完成', `${stats.done + stats.skipped}`],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? 'liquid-glass-btn text-warm-700'
                : 'glass-btn text-text-light'
            }`}
          >
            {label}
            <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* 疫苗列表 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-light text-sm">
            {filter === 'upcoming' ? '暂无待接种疫苗 🎉' : '暂无已完成记录'}
          </div>
        )}
        {filtered.map(({ dose, status, daysUntil, dueDate, doneRecord, skipRecord }) => {
          const cfg = VACCINE_STATUS_CONFIG[status]
          const isExpanded = expandedId === dose.id
          return (
            <div key={dose.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : dose.id)}
                className={`glass-card rounded-2xl p-3.5 w-full text-left transition-all active:scale-[0.98] ${status === 'skipped' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${cfg.bg}`}>
                    {status === 'done' ? '✅' : status === 'skipped' ? '⏭️' : dose.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${status === 'skipped' ? 'text-gray-400 line-through' : 'text-text'}`}>{dose.vaccine}</span>
                      <span className="text-xs text-text-light">{dose.dose}</span>
                    </div>
                    <div className="text-xs text-text-light mt-0.5">
                      {dose.ageLabel} · {dose.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {status === 'done' ? (
                      <span className="text-xs text-emerald-600 font-medium">{cfg.label}</span>
                    ) : status === 'skipped' ? (
                      <span className="text-xs text-gray-400 font-medium">{cfg.label}</span>
                    ) : (
                      <span className={`text-xs font-medium ${cfg.color}`}>
                        {formatCountdown(daysUntil)}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="glass-card rounded-2xl p-4 mt-1 animate-slide-down-detail space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-text-light">建议接种日</div>
                      <div className="font-medium text-text">{formatDueDate(dueDate)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-light">建议月龄</div>
                      <div className="font-medium text-text">{dose.ageLabel}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-text-light">预防疾病</div>
                      <div className="font-medium text-text">{dose.description}</div>
                    </div>
                    {doneRecord && (
                      <div className="col-span-2">
                        <div className="text-xs text-text-light">实际接种日</div>
                        <div className="font-medium text-emerald-600">{doneRecord.doneDate}</div>
                      </div>
                    )}
                    {skipRecord && (
                      <div className="col-span-2">
                        <div className="text-xs text-text-light">状态</div>
                        <div className="font-medium text-gray-400">已跳过（不适用）</div>
                      </div>
                    )}
                  </div>

                  {status === 'skipped' ? (
                    confirmUnskipId === dose.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUnskip(dose.id)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-500">
                          确认恢复
                        </button>
                        <button onClick={() => setConfirmUnskipId(null)}
                          className="px-4 py-2.5 rounded-xl text-sm glass-btn text-text-light">
                          取消
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmUnskipId(dose.id)}
                        className="w-full py-2.5 rounded-xl text-sm glass-btn text-text-light">
                        恢复此疫苗
                      </button>
                    )
                  ) : status !== 'done' ? (
                    <div className="space-y-2">
                      {confirmDoneId === dose.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleMarkDone(dose.id)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                            style={{ background: 'linear-gradient(135deg, #5AB892, #4AA882)' }}>
                            确认已接种
                          </button>
                          <button onClick={() => setConfirmDoneId(null)}
                            className="px-4 py-2.5 rounded-xl text-sm glass-btn text-text-light">
                            取消
                          </button>
                        </div>
                      ) : confirmSkipId === dose.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSkip(dose.id)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-gray-400">
                            确认跳过
                          </button>
                          <button onClick={() => setConfirmSkipId(null)}
                            className="px-4 py-2.5 rounded-xl text-sm glass-btn text-text-light">
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => setConfirmDoneId(dose.id)}
                            className="w-full py-2.5 rounded-xl text-sm font-medium liquid-glass-btn">
                            ✅ 标记为已接种
                          </button>
                          <button onClick={() => setConfirmSkipId(dose.id)}
                            className="w-full py-2 rounded-xl text-xs glass-btn text-gray-400">
                            ⏭️ 不适用 / 跳过此疫苗
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    confirmUndoId === dose.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUndo(dose.id)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-400">
                          确认撤销
                        </button>
                        <button onClick={() => setConfirmUndoId(null)}
                          className="px-4 py-2.5 rounded-xl text-sm glass-btn text-text-light">
                          取消
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmUndoId(dose.id)}
                        className="w-full py-2.5 rounded-xl text-sm glass-btn text-text-light">
                        撤销接种记录
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
