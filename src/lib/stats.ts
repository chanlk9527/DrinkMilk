import type { FeedRecord } from './types'

/** 本地日期 key (YYYY-MM-DD)，避免 UTC 时区偏移 */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 按本地日期分组 */
function groupByDate(records: FeedRecord[]): Record<string, FeedRecord[]> {
  const map: Record<string, FeedRecord[]> = {}
  for (const r of records) {
    const key = toLocalDateKey(new Date(r.at))
    ;(map[key] ??= []).push(r)
  }
  return map
}

/** 按周 key (YYYY-Www) 分组，基于本地时间 */
function getWeekKey(date: Date): string {
  // 使用本地年月日构造纯日期，避免时区干扰
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  // ISO 周算法：周一为一周起始
  const dayOfWeek = d.getDay() || 7 // 周日=7
  d.setDate(d.getDate() + 4 - dayOfWeek) // 调整到本周四
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/** 按月 key (YYYY-MM) 分组，基于本地时间 */
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export type TimeRange = 'daily' | 'weekly' | 'monthly'

export interface TrendPoint {
  label: string
  totalMl: number
  count: number
  avgMl: number
}

/** 奶量趋势数据 */
export function getTrendData(records: FeedRecord[], range: TimeRange): TrendPoint[] {
  if (records.length === 0) return []

  const sorted = [...records].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  if (range === 'daily') {
    const byDate = groupByDate(sorted)
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, recs]) => {
        const total = recs.reduce((s, r) => s + r.amountMl, 0)
        return {
          label: `${parseInt(key.slice(5, 7))}/${parseInt(key.slice(8, 10))}`,
          totalMl: total,
          count: recs.length,
          avgMl: Math.round(total / recs.length),
        }
      })
  }

  if (range === 'weekly') {
    const map: Record<string, FeedRecord[]> = {}
    for (const r of sorted) {
      const key = getWeekKey(new Date(r.at))
      ;(map[key] ??= []).push(r)
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, recs]) => {
        const total = recs.reduce((s, r) => s + r.amountMl, 0)
        return {
          label: key.replace(/^\d{4}-/, ''),
          totalMl: total,
          count: recs.length,
          avgMl: Math.round(total / recs.length),
        }
      })
  }

  // monthly
  const map: Record<string, FeedRecord[]> = {}
  for (const r of sorted) {
    const key = getMonthKey(new Date(r.at))
    ;(map[key] ??= []).push(r)
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, recs]) => {
      const total = recs.reduce((s, r) => s + r.amountMl, 0)
      return {
        label: `${parseInt(key.slice(5))}月`,
        totalMl: total,
        count: recs.length,
        avgMl: Math.round(total / recs.length),
      }
    })
}

export interface IntervalPoint {
  label: string
  minutes: number
}

/** 喂奶间隔数据（相邻两次喂奶的间隔） */
export function getIntervalData(records: FeedRecord[]): IntervalPoint[] {
  if (records.length < 2) return []

  const sorted = [...records].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  const intervals: IntervalPoint[] = []

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].at).getTime()
    const curr = new Date(sorted[i].at).getTime()
    const diffMin = Math.round((curr - prev) / 60000)
    if (diffMin > 0 && diffMin < 720) { // 排除超过12小时的异常间隔
      const d = new Date(sorted[i].at)
      intervals.push({
        label: `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        minutes: diffMin,
      })
    }
  }

  return intervals
}

/** 间隔分布（按小时区间统计频次） */
export interface IntervalBucket {
  range: string
  count: number
}

/** 单次奶量变化趋势（每条记录一个点） */
export interface PerFeedingPoint {
  label: string
  amountMl: number
  /** 5 点简单移动平均，平滑趋势 */
  movingAvg: number | null
}

export function getPerFeedingTrend(records: FeedRecord[]): PerFeedingPoint[] {
  if (records.length === 0) return []

  const sorted = [...records].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  const windowSize = 5

  return sorted.map((r, i) => {
    const d = new Date(r.at)
    const label = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

    let movingAvg: number | null = null
    if (i >= windowSize - 1) {
      const sum = sorted.slice(i - windowSize + 1, i + 1).reduce((s, x) => s + x.amountMl, 0)
      movingAvg = Math.round(sum / windowSize)
    }

    return { label, amountMl: r.amountMl, movingAvg }
  })
}

export function getIntervalDistribution(records: FeedRecord[]): IntervalBucket[] {
  const intervals = getIntervalData(records)
  const buckets: Record<string, number> = {
    '<1h': 0,
    '1-2h': 0,
    '2-3h': 0,
    '3-4h': 0,
    '4-5h': 0,
    '5-6h': 0,
    '>6h': 0,
  }

  for (const { minutes } of intervals) {
    if (minutes < 60) buckets['<1h']++
    else if (minutes < 120) buckets['1-2h']++
    else if (minutes < 180) buckets['2-3h']++
    else if (minutes < 240) buckets['3-4h']++
    else if (minutes < 300) buckets['4-5h']++
    else if (minutes < 360) buckets['5-6h']++
    else buckets['>6h']++
  }

  return Object.entries(buckets).map(([range, count]) => ({ range, count }))
}
