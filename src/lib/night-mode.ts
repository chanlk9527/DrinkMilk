import { useState, useEffect, useCallback } from 'react'

const NIGHT_MODE_KEY = 'milk_night_mode'

type NightModePreference = 'auto' | 'on' | 'off'

function getPreference(): NightModePreference {
  try {
    const val = localStorage.getItem(NIGHT_MODE_KEY)
    if (val === 'on' || val === 'off') return val
  } catch { /* ignore */ }
  return 'auto'
}

/**
 * 根据月份判断季节，返回夜间模式的开始/结束小时
 * 夏天（5-8月）晚进入、早退出：20:00 - 6:00
 * 冬天（11-2月）早进入、晚退出：17:30 - 7:00
 * 春秋过渡：18:30 - 6:30
 */
function getNightHours(): { startHour: number; endHour: number } {
  const month = new Date().getMonth() + 1

  if (month >= 5 && month <= 8) {
    return { startHour: 20, endHour: 6 }
  } else if (month >= 11 || month <= 2) {
    return { startHour: 17.5, endHour: 7 }
  } else {
    return { startHour: 18.5, endHour: 6.5 }
  }
}

function isNightTime(): boolean {
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  const { startHour, endHour } = getNightHours()
  return currentHour >= startHour || currentHour < endHour
}

function resolveNight(pref: NightModePreference): boolean {
  if (pref === 'on') return true
  if (pref === 'off') return false
  return isNightTime()
}

export function useNightMode() {
  const [preference, setPreference] = useState<NightModePreference>(getPreference)
  const [isNight, setIsNight] = useState(() => resolveNight(getPreference()))

  // 自动模式下每分钟检查
  useEffect(() => {
    if (preference !== 'auto') return
    const timer = setInterval(() => {
      setIsNight(isNightTime())
    }, 60_000)
    return () => clearInterval(timer)
  }, [preference])

  // 应用 class
  useEffect(() => {
    const root = document.documentElement
    if (isNight) {
      root.classList.add('night-mode')
    } else {
      root.classList.remove('night-mode')
    }
  }, [isNight])

  const cycleMode = useCallback(() => {
    setPreference(prev => {
      // auto -> on -> off -> auto
      const next: NightModePreference =
        prev === 'auto' ? 'on' : prev === 'on' ? 'off' : 'auto'
      localStorage.setItem(NIGHT_MODE_KEY, next)
      setIsNight(resolveNight(next))
      return next
    })
  }, [])

  return { isNight, preference, cycleMode }
}
