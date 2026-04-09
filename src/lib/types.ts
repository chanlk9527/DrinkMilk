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
