import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { AppData, FeedRecord } from '../lib/types'
import { getTrendData, getIntervalDistribution, getPerFeedingTrend } from '../lib/stats'

interface Props {
  data: AppData | null
}

type DailyWindow = 7 | 30
type FeedingWindow = 10 | 30

const EMPTY_RECORDS: FeedRecord[] = []
const DAILY_WINDOWS: DailyWindow[] = [7, 30]
const FEEDING_WINDOWS: FeedingWindow[] = [10, 30]

export default function Stats({ data }: Props) {
  const [dailyWindow, setDailyWindow] = useState<DailyWindow>(30)
  const [feedingWindow, setFeedingWindow] = useState<FeedingWindow>(30)
  const records = data?.records ?? EMPTY_RECORDS

  const dailyRecords = useMemo(() => {
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - dailyWindow + 1)
    const cutoffTime = cutoff.getTime()
    return records.filter(record => new Date(record.at).getTime() >= cutoffTime)
  }, [records, dailyWindow])

  const trendData = useMemo(() => getTrendData(dailyRecords, 'daily'), [dailyRecords])
  const intervalData = useMemo(() => getIntervalDistribution(records), [records])
  const perFeedingData = useMemo(
    () => getPerFeedingTrend(records).slice(-feedingWindow),
    [records, feedingWindow]
  )

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-light">
        <div className="w-20 h-20 rounded-full bg-warm-50 flex items-center justify-center mb-4">
          <span className="text-4xl">📊</span>
        </div>
        <p className="text-base">暂无数据</p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-4 space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-text">数据统计</h1>

      {/* 奶量趋势 */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-medium text-text">每日奶量趋势</p>
          <div className="flex bg-warm-50 rounded-lg p-0.5">
            {DAILY_WINDOWS.map(window => (
              <button
                key={window}
                onClick={() => setDailyWindow(window)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  dailyWindow === window
                    ? 'bg-warm-400 text-white shadow-sm'
                    : 'text-text-light'
                }`}
              >
                {window}天
              </button>
            ))}
          </div>
        </div>

        {trendData.length > 0 ? (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFE8D0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#8B7355' }}
                  tickLine={false}
                  axisLine={{ stroke: '#FFE8D0' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8B7355' }}
                  tickLine={false}
                  axisLine={false}
                  unit="ml"
                />
                <Tooltip
                  contentStyle={{
                    background: '#FFF8F0',
                    border: '1px solid #FFE8D0',
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = { totalMl: '总奶量', avgMl: '平均单次', count: '次数' }
                    return [`${value}${name === 'count' ? '次' : 'ml'}`, labels[String(name)] || String(name)]
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    const labels: Record<string, string> = { totalMl: '总奶量', avgMl: '平均单次' }
                    return <span style={{ fontSize: 12, color: '#8B7355' }}>{labels[value] || value}</span>
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="totalMl"
                  stroke="#FFA04D"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#FFA04D' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgMl"
                  stroke="#E8863A"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 2.5, fill: '#E8863A' }}
                />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-text-light text-center mt-2">
              仅展示最近 {dailyWindow} 天的每日统计
            </p>
          </>
        ) : (
          <p className="text-center text-text-light text-sm py-8">该时间范围暂无数据</p>
        )}

        {/* 趋势摘要 */}
        {trendData.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <SummaryCard
              label="日均奶量"
              value={`${Math.round(trendData.reduce((s, d) => s + d.totalMl, 0) / trendData.length)}`}
              unit="ml"
            />
            <SummaryCard
              label="单次均量"
              value={`${Math.round(trendData.reduce((s, d) => s + d.avgMl, 0) / trendData.length)}`}
              unit="ml"
            />
            <SummaryCard
              label="日均次数"
              value={`${(trendData.reduce((s, d) => s + d.count, 0) / trendData.length).toFixed(1)}`}
              unit="次"
            />
          </div>
        )}
      </div>

      {/* 单次奶量变化趋势 */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-medium text-text">单次奶量变化</p>
          <div className="flex bg-warm-50 rounded-lg p-0.5">
            {FEEDING_WINDOWS.map(window => (
              <button
                key={window}
                onClick={() => setFeedingWindow(window)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  feedingWindow === window
                    ? 'bg-warm-400 text-white shadow-sm'
                    : 'text-text-light'
                }`}
              >
                {window}次
              </button>
            ))}
          </div>
        </div>

        {perFeedingData.length > 0 ? (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perFeedingData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFE8D0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#8B7355' }}
                    tickLine={false}
                    axisLine={{ stroke: '#FFE8D0' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8B7355' }}
                    tickLine={false}
                    axisLine={false}
                    unit="ml"
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#FFF8F0',
                      border: '1px solid #FFE8D0',
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                    formatter={(value, name) => {
                      const labels: Record<string, string> = { amountMl: '单次奶量', movingAvg: '趋势均线' }
                      return [value != null ? `${value}ml` : '—', labels[String(name)] || String(name)]
                    }}
                  />
                  <Legend
                    formatter={(value: string) => {
                      const labels: Record<string, string> = { amountMl: '单次奶量', movingAvg: '趋势均线' }
                      return <span style={{ fontSize: 12, color: '#8B7355' }}>{labels[value] || value}</span>
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amountMl"
                    stroke="#FFA04D"
                    strokeWidth={1.5}
                    dot={{ r: 2.5, fill: '#FFA04D' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="movingAvg"
                    stroke="#E8863A"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-text-light text-center mt-2">
              仅展示最近 {feedingWindow} 次喂奶及 5 次移动平均趋势线
            </p>
          </>
        ) : (
          <p className="text-center text-text-light text-sm py-8">暂无数据</p>
        )}
      </div>

      {/* 喂奶间隔分布 */}
      <div className="glass-card rounded-2xl p-4">
        <p className="text-base font-medium text-text mb-4">喂奶间隔分布</p>

        {intervalData.some(d => d.count > 0) ? (
          <>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intervalData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFE8D0" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11, fill: '#8B7355' }}
                    tickLine={false}
                    axisLine={{ stroke: '#FFE8D0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8B7355' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#FFF8F0',
                      border: '1px solid #FFE8D0',
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                    formatter={(value) => [`${value} 次`, '频次']}
                  />
                  <Bar
                    dataKey="count"
                    fill="#FFA04D"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-text-light text-center mt-2">
              统计相邻两次喂奶的时间间隔分布，帮助发现宝宝的喂养节奏
            </p>
          </>
        ) : (
          <p className="text-center text-text-light text-sm py-8">需要至少 2 条记录才能计算间隔</p>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="glass-stat rounded-xl p-2.5 text-center">
      <p className="text-lg font-bold text-warm-500">
        {value}<span className="text-xs font-normal text-text-light ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-text-light mt-0.5">{label}</p>
    </div>
  )
}
