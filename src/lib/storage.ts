import type { AppData, LocalSettings } from './types'

const SETTINGS_KEY = 'milk_settings'
const CACHE_KEY = 'milk_data_cache'

export function getSettings(): LocalSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 如果是旧版 settings（没有 familyId），自动重置
      if (parsed.setupDone && !parsed.familyId) {
        localStorage.removeItem(SETTINGS_KEY)
        localStorage.removeItem(CACHE_KEY)
        return { myName: '', babyName: '', familyId: '', familyCode: '', setupDone: false }
      }
      return parsed
    }
  } catch { /* ignore */ }
  return { myName: '', babyName: '', familyId: '', familyCode: '', setupDone: false }
}

export function saveSettings(s: Partial<LocalSettings>) {
  const current = getSettings()
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...s }))
}

export function getCachedData(): AppData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

export function setCachedData(data: AppData) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}
