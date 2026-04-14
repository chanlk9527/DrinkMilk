/**
 * 中国大陆国家免疫规划 (NIP) 疫苗接种时间表
 * 基于《国家免疫规划疫苗儿童免疫程序表》
 * 所有疫苗均为免费公共疫苗
 */

export interface VaccineDose {
  id: string
  vaccine: string       // 疫苗名称
  dose: string          // 第几剂
  ageMonths: number     // 建议接种月龄
  ageLabel: string      // 月龄显示文字
  description: string   // 预防疾病
  icon: string          // emoji
}

// 国家免疫规划疫苗时间表
export const VACCINE_SCHEDULE: VaccineDose[] = [
  // 出生时
  { id: 'hepb-1', vaccine: '乙肝疫苗', dose: '第1剂', ageMonths: 0, ageLabel: '出生时', description: '预防乙型肝炎', icon: '💉' },
  { id: 'bcg-1', vaccine: '卡介苗', dose: '第1剂', ageMonths: 0, ageLabel: '出生时', description: '预防结核病', icon: '🛡️' },

  // 1月龄
  { id: 'hepb-2', vaccine: '乙肝疫苗', dose: '第2剂', ageMonths: 1, ageLabel: '1月龄', description: '预防乙型肝炎', icon: '💉' },

  // 2月龄
  { id: 'ipv-1', vaccine: '脊灰灭活疫苗', dose: '第1剂', ageMonths: 2, ageLabel: '2月龄', description: '预防脊髓灰质炎', icon: '🦠' },

  // 2月龄
  { id: 'dpt-1', vaccine: '百白破疫苗', dose: '第1剂', ageMonths: 2, ageLabel: '2月龄', description: '预防百日咳、白喉、破伤风', icon: '🩺' },

  // 3月龄
  { id: 'ipv-2', vaccine: '脊灰灭活疫苗', dose: '第2剂', ageMonths: 3, ageLabel: '3月龄', description: '预防脊髓灰质炎', icon: '🦠' },

  // 4月龄
  { id: 'opv-3', vaccine: '脊灰减毒活疫苗', dose: '第3剂', ageMonths: 4, ageLabel: '4月龄', description: '预防脊髓灰质炎', icon: '🦠' },
  { id: 'dpt-2', vaccine: '百白破疫苗', dose: '第2剂', ageMonths: 4, ageLabel: '4月龄', description: '预防百日咳、白喉、破伤风', icon: '🩺' },

  // 6月龄
  { id: 'hepb-3', vaccine: '乙肝疫苗', dose: '第3剂', ageMonths: 6, ageLabel: '6月龄', description: '预防乙型肝炎', icon: '💉' },
  { id: 'dpt-3', vaccine: '百白破疫苗', dose: '第3剂', ageMonths: 6, ageLabel: '6月龄', description: '预防百日咳、白喉、破伤风', icon: '🩺' },
  { id: 'hepa-1', vaccine: '甲肝减毒活疫苗', dose: '第1剂', ageMonths: 18, ageLabel: '18月龄', description: '预防甲型肝炎', icon: '💊' },

  // 8月龄
  { id: 'mr-1', vaccine: '麻腮风疫苗', dose: '第1剂', ageMonths: 8, ageLabel: '8月龄', description: '预防麻疹、腮腺炎、风疹', icon: '🌡️' },
  { id: 'jeb-1', vaccine: '乙脑减毒活疫苗', dose: '第1剂', ageMonths: 8, ageLabel: '8月龄', description: '预防流行性乙型脑炎', icon: '🧠' },

  // 12月龄
  { id: 'mpv-a1', vaccine: 'A群流脑多糖疫苗', dose: '第1剂', ageMonths: 6, ageLabel: '6月龄', description: '预防A群脑膜炎球菌引起的流行性脑脊髓膜炎', icon: '🔬' },

  // 9月龄 — A群流脑第2剂
  { id: 'mpv-a2', vaccine: 'A群流脑多糖疫苗', dose: '第2剂', ageMonths: 9, ageLabel: '9月龄', description: '预防A群脑膜炎球菌引起的流行性脑脊髓膜炎', icon: '🔬' },

  // 18月龄
  { id: 'dpt-4', vaccine: '百白破疫苗', dose: '第4剂', ageMonths: 18, ageLabel: '18月龄', description: '预防百日咳、白喉、破伤风', icon: '🩺' },
  { id: 'mr-2', vaccine: '麻腮风疫苗', dose: '第2剂', ageMonths: 18, ageLabel: '18月龄', description: '预防麻疹、腮腺炎、风疹', icon: '🌡️' },

  // 2岁
  { id: 'jeb-2', vaccine: '乙脑减毒活疫苗', dose: '第2剂', ageMonths: 24, ageLabel: '2岁', description: '预防流行性乙型脑炎', icon: '🧠' },

  // 3岁
  { id: 'mpv-ac1', vaccine: 'A+C群流脑多糖疫苗', dose: '第1剂', ageMonths: 36, ageLabel: '3岁', description: '预防A群及C群脑膜炎球菌引起的流行性脑脊髓膜炎', icon: '🔬' },

  // 4岁
  { id: 'opv-4', vaccine: '脊灰减毒活疫苗', dose: '第4剂', ageMonths: 48, ageLabel: '4岁', description: '预防脊髓灰质炎', icon: '🦠' },

  // 6岁
  { id: 'dt-1', vaccine: '白破疫苗', dose: '第1剂', ageMonths: 72, ageLabel: '6岁', description: '预防白喉、破伤风', icon: '🩺' },
  { id: 'mpv-ac2', vaccine: 'A+C群流脑多糖疫苗', dose: '第2剂', ageMonths: 72, ageLabel: '6岁', description: '预防A群及C群脑膜炎球菌引起的流行性脑脊髓膜炎', icon: '🔬' },
]

// 按月龄排序
export const SORTED_SCHEDULE = [...VACCINE_SCHEDULE].sort((a, b) => {
  if (a.ageMonths !== b.ageMonths) return a.ageMonths - b.ageMonths
  return a.id.localeCompare(b.id)
})

// localStorage keys (用作本地缓存)
const VACCINE_RECORDS_KEY = 'milk_vaccine_records'
const VACCINE_SKIPPED_KEY = 'milk_vaccine_skipped'

export interface VaccineRecord {
  vaccineId: string
  doneDate: string  // YYYY-MM-DD
}

export function getVaccineRecords(): VaccineRecord[] {
  try {
    const raw = localStorage.getItem(VACCINE_RECORDS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

export function saveVaccineRecord(record: VaccineRecord) {
  const records = getVaccineRecords()
  const idx = records.findIndex(r => r.vaccineId === record.vaccineId)
  if (idx >= 0) {
    records[idx] = record
  } else {
    records.push(record)
  }
  localStorage.setItem(VACCINE_RECORDS_KEY, JSON.stringify(records))
}

export function removeVaccineRecord(vaccineId: string) {
  const records = getVaccineRecords().filter(r => r.vaccineId !== vaccineId)
  localStorage.setItem(VACCINE_RECORDS_KEY, JSON.stringify(records))
}

/** 跳过（不适用）的疫苗 */
export interface VaccineSkipRecord {
  vaccineId: string
  reason?: string  // 可选的跳过原因
}

export function getSkippedVaccines(): VaccineSkipRecord[] {
  try {
    const raw = localStorage.getItem(VACCINE_SKIPPED_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

export function skipVaccine(vaccineId: string, reason?: string) {
  const skipped = getSkippedVaccines()
  if (!skipped.some(s => s.vaccineId === vaccineId)) {
    skipped.push({ vaccineId, reason })
  }
  localStorage.setItem(VACCINE_SKIPPED_KEY, JSON.stringify(skipped))
}

export function unskipVaccine(vaccineId: string) {
  const skipped = getSkippedVaccines().filter(s => s.vaccineId !== vaccineId)
  localStorage.setItem(VACCINE_SKIPPED_KEY, JSON.stringify(skipped))
}

/**
 * 根据出生日期计算某个疫苗的建议接种日期
 */
export function getVaccineDueDate(birthDate: string, ageMonths: number): Date {
  const birth = new Date(birthDate + 'T00:00:00')
  const due = new Date(birth)
  due.setMonth(due.getMonth() + ageMonths)
  return due
}

/**
 * 计算距离接种日还有多少天（负数表示已过期）
 */
export function getDaysUntilDue(birthDate: string, ageMonths: number): number {
  const due = getVaccineDueDate(birthDate, ageMonths)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export type VaccineStatus = 'done' | 'skipped' | 'overdue' | 'upcoming' | 'future'

export function getVaccineStatus(
  dose: VaccineDose,
  birthDate: string,
  records: VaccineRecord[],
  skipped?: VaccineSkipRecord[]
): VaccineStatus {
  if (records.some(r => r.vaccineId === dose.id)) return 'done'
  if (skipped?.some(s => s.vaccineId === dose.id)) return 'skipped'
  const days = getDaysUntilDue(birthDate, dose.ageMonths)
  if (days < 0) return 'overdue'
  if (days <= 30) return 'upcoming'
  return 'future'
}
