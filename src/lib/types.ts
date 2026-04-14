export interface FeedRecord {
  id: string
  at: string       // ISO 8601
  amountMl: number
  by: string
  notes?: string[]
}

export const DEFAULT_QUICK_AMOUNTS = [40, 50, 60, 70, 80, 90, 100, 110]

export interface GrowthRecord {
  id: string
  date: string       // YYYY-MM-DD
  weightKg?: number  // 体重 kg
  heightCm?: number  // 身高 cm
  headCm?: number    // 头围 cm
  notes?: string
}

export interface DiaperRecord {
  id: string
  at: string           // ISO 8601
  type: 'pee' | 'poop' | 'mixed'
  color?: string       // 大便颜色
  consistency?: string // 性状
  by: string
  notes?: string
}

export const DIAPER_TYPES: { value: DiaperRecord['type']; label: string; icon: string }[] = [
  { value: 'pee', label: '小便', icon: '💧' },
  { value: 'poop', label: '大便', icon: '💩' },
  { value: 'mixed', label: '混合', icon: '🔄' },
]

export const POOP_COLORS = ['黄色', '绿色', '棕色', '黑色', '红色', '白色']
export const POOP_CONSISTENCIES = ['稀', '软', '正常', '硬']

export interface SleepRecord {
  id: string
  startAt: string      // ISO 8601 入睡时间
  endAt?: string       // ISO 8601 醒来时间（进行中则为空）
  by: string
  notes?: string
}

export interface AppData {
  version: number
  familyId: string
  familyCode: string
  babyName: string
  updatedAt: string
  records: FeedRecord[]
  quickAmounts?: number[]
  presetTags?: string[]
  colorMap?: Record<string, string>
  birthDate?: string   // YYYY-MM-DD
  growthRecords?: GrowthRecord[]
  diaperRecords?: DiaperRecord[]
  sleepRecords?: SleepRecord[]
}

export const DEFAULT_PRESET_TAGS = [
  '吐了一点', '吐了很多', '喝得很快', '喝得慢', '哭闹', '睡着了'
]

export interface LocalSettings {
  myName: string
  babyName: string
  familyId: string
  familyCode: string
  setupDone: boolean
  babyAvatar?: string  // base64 compressed image
  birthDate?: string   // YYYY-MM-DD
}
