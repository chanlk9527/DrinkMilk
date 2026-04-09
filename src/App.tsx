import { useEffect, useState, useCallback } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { AppData, FeedRecord, GrowthRecord } from './lib/types'
import { getSettings, saveSettings, getCachedData, setCachedData, clearAllData } from './lib/storage'
import { loadData, addRecord, updateRecord, deleteRecord, addGrowthRecord, deleteGrowthRecord } from './lib/google-drive'
import { assignCaregiverColor } from './lib/utils'
import { useNightMode } from './lib/night-mode'
import Layout from './components/Layout'
import Setup from './pages/Setup'
import Home from './pages/Home'
import History from './pages/History'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import Growth from './pages/Growth'

export default function App() {
  const nightMode = useNightMode()
  const [setupDone, setSetupDone] = useState(false)
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const settings = getSettings()
    setSetupDone(settings.setupDone)
    setData(getCachedData())
  }, [])

  useEffect(() => {
    if (setupDone) refresh()
  }, [setupDone])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const freshData = await loadData()
      setData(freshData)
      setCachedData(freshData)
    } catch {
      setError('刷新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAdd = useCallback(async (record: FeedRecord) => {
    // Compute updated colorMap if the caregiver is new
    let updatedColorMap: Record<string, string> | undefined
    setData(prev => {
      if (!prev) return prev
      const currentColorMap = { ...(prev.colorMap ?? {}) }
      if (!currentColorMap[record.by]) {
        currentColorMap[record.by] = assignCaregiverColor(record.by, currentColorMap)
      }
      updatedColorMap = currentColorMap
      const updated = { ...prev, records: [...prev.records, record], colorMap: currentColorMap }
      setCachedData(updated)
      return updated
    })
    try {
      const freshData = await addRecord(record, updatedColorMap)
      setData(freshData)
      setCachedData(freshData)
    } catch {
      setError('保存失败，请重试')
    }
  }, [])

  const handleUpdate = useCallback(async (record: FeedRecord) => {
    setData(prev => {
      if (!prev) return prev
      const updated = { ...prev, records: prev.records.map(r => r.id === record.id ? record : r) }
      setCachedData(updated)
      return updated
    })
    try {
      const freshData = await updateRecord(record)
      setData(freshData)
      setCachedData(freshData)
    } catch {
      setError('更新失败，请重试')
    }
  }, [])

  const handleDelete = useCallback(async (recordId: string) => {
    setData(prev => {
      if (!prev) return prev
      const updated = { ...prev, records: prev.records.filter(r => r.id !== recordId) }
      setCachedData(updated)
      return updated
    })
    try {
      const freshData = await deleteRecord(recordId)
      setData(freshData)
      setCachedData(freshData)
    } catch {
      setError('删除失败，请重试')
    }
  }, [])

  const handleAddGrowth = useCallback(async (record: GrowthRecord) => {
    setData(prev => {
      if (!prev) return prev
      const updated = { ...prev, growthRecords: [...(prev.growthRecords ?? []), record] }
      setCachedData(updated)
      return updated
    })
    try {
      const freshData = await addGrowthRecord(record)
      setData(freshData)
      setCachedData(freshData)
    } catch {
      setError('保存失败，请重试')
    }
  }, [])

  const handleDeleteGrowth = useCallback(async (recordId: string) => {
    setData(prev => {
      if (!prev) return prev
      const updated = { ...prev, growthRecords: (prev.growthRecords ?? []).filter(r => r.id !== recordId) }
      setCachedData(updated)
      return updated
    })
    try {
      const freshData = await deleteGrowthRecord(recordId)
      setData(freshData)
      setCachedData(freshData)
    } catch {
      setError('删除失败，请重试')
    }
  }, [])

  const handleSetupComplete = (info: { babyName: string; myName: string; familyId: string; familyCode: string }) => {
    saveSettings({
      babyName: info.babyName,
      myName: info.myName,
      familyId: info.familyId,
      familyCode: info.familyCode,
      setupDone: true,
    })
    setSetupDone(true)
  }

  const handleLeaveFamily = () => {
    clearAllData()
    setData(null)
    setSetupDone(false)
  }

  if (!setupDone) {
    return <Setup onComplete={handleSetupComplete} />
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={
            <Home data={data} loading={loading} error={error} onRefresh={refresh} onAdd={handleAdd} />
          } />
          <Route path="/history" element={
            <History data={data} onUpdate={handleUpdate} onDelete={handleDelete} />
          } />
          <Route path="/stats" element={
            <Stats data={data} />
          } />
          <Route path="/growth" element={
            <Growth data={data} onAddGrowth={handleAddGrowth} onDeleteGrowth={handleDeleteGrowth} />
          } />
          <Route path="/settings" element={
            <Settings data={data} onRefresh={refresh} onLeaveFamily={handleLeaveFamily} loading={loading} nightMode={nightMode} />
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
