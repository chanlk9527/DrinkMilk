export function generateId(): string {
  return 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function formatTimeSince(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  if (diff < 0) return '刚刚'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} 分钟`
  return `${h} 小时 ${m} 分`
}

export function formatTime(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDate(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

export function isToday(isoStr: string): boolean {
  const d = new Date(isoStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

export function getTodayStats(records: { at: string; amountMl: number }[]) {
  const todayRecords = records.filter(r => isToday(r.at))
  return {
    count: todayRecords.length,
    totalMl: todayRecords.reduce((sum, r) => sum + r.amountMl, 0),
  }
}

export const CAREGIVER_COLORS: Record<string, string> = {
  '妈妈': '#F472B6',
  '爸爸': '#60A5FA',
}

export const COLOR_PALETTE = [
  '#34D399', // 绿色
  '#FBBF24', // 黄色
  '#A78BFA', // 紫色
  '#FB923C', // 橙色
  '#2DD4BF', // 青色
  '#F87171', // 红色
]

export function assignCaregiverColor(
  name: string,
  colorMap: Record<string, string>
): string {
  if (colorMap[name]) return colorMap[name]
  if (CAREGIVER_COLORS[name]) return CAREGIVER_COLORS[name]
  const usedColors = new Set(Object.values(colorMap))
  const available = COLOR_PALETTE.find(c => !usedColors.has(c))
  return available ?? COLOR_PALETTE[Object.keys(colorMap).length % COLOR_PALETTE.length]
}

export function getDaysSinceBirth(birthDate: string): number {
  const birth = new Date(birthDate + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatAge(birthDate: string): string {
  const days = getDaysSinceBirth(birthDate)
  if (days < 0) return '还没出生呢'
  if (days === 0) return '今天出生 🎉'
  const months = Math.floor(days / 30)
  const remainDays = days % 30
  if (months === 0) return `${days} 天`
  return `${months} 个月 ${remainDays} 天`
}
