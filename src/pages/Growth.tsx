import { useState, useMemo, useCallback } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import type { AppData, GrowthRecord } from '../lib/types'
import { generateId } from '../lib/utils'

interface Props {
  data: AppData | null
  onAddGrowth: (record: GrowthRecord) => Promise<void>
  onDeleteGrowth: (id: string) => Promise<void>
}

export default function Growth({ data, onAddGrowth, onDeleteGrowth }: Props) {
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
      date: r.date.slice(5), // MM-DD
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
    setWeightKg('')
    setHeightCm('')
    setHeadCm('')
    setNotes('')
  }

  const handleDelete = async (id: string) => {
    await onDeleteGrowth(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">成长记录</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-sm font-medium active:scale-95 transition-transform"
        >
          + 记录
        </button>
      </div>

      {/* 最新数据卡片 */}
      {latestRecord && (
        <div className="bg-gradient-to-br from-warm-400 to-warm-500 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-28 h-28 rounded-full bg-white/10" />
          <p className="text-white/80 text-sm mb-2">最新记录 · {latestRecord.date}</p>
          <div className="flex gap-4">
            {latestRecord.weightKg != null && (
              <div>
                <p className="text-3xl font-extrabold text-white">{latestRecord.weightKg}<span className="text-base font-normal"> kg</span></p>
                <p className="text-white/70 text-xs">体重</p>
              </div>
            )}
            {latestRecord.heightCm != null && (
              <div>
                <p className="text-3xl font-extrabold text-white">{latestRecord.heightCm}<span className="text-base font-normal"> cm</span></p>
                <p className="text-white/70 text-xs">身高</p>
              </div>
            )}
            {latestRecord.headCm != null && (
              <div>
                <p className="text-3xl font-extrabold text-white">{latestRecord.headCm}<span className="text-base font-normal"> cm</span></p>
                <p className="text-white/70 text-xs">头围</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 成长曲线 */}
      {chartData.length >= 2 && (
        <div className="space-y-4">
          {chartData.some(d => d.体重 != null) && (
            <div className="bg-card rounded-2xl p-4 shadow-sm">
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
            <div className="bg-card rounded-2xl p-4 shadow-sm">
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
              <div key={r.id} className="bg-card rounded-xl px-4 py-3 shadow-sm">
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
          <div className={`bg-cream w-full max-w-lg rounded-t-3xl p-6 space-y-4 ${closingForm ? 'animate-slide-down' : 'animate-slide-up'}`} onClick={e => e.stopPropagation()}>
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
