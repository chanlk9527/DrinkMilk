import { useState, useRef, useEffect } from 'react'
import type { AppData } from '../lib/types'
import { DEFAULT_QUICK_AMOUNTS } from '../lib/types'
import { getSettings, saveSettings } from '../lib/storage'
import { updateFamilySettings, setAvatar as setCloudAvatar, getAvatar as getCloudAvatar } from '../lib/google-drive'
import { compressImage } from '../lib/image-utils'

interface Props {
  data: AppData | null
  onRefresh: () => void
  loading: boolean
  nightMode: { isNight: boolean; preference: 'auto' | 'on' | 'off'; cycleMode: () => void }
}

export default function Settings({ data, onRefresh, loading, nightMode }: Props) {
  const settings = getSettings()
  const [babyName, setBabyName] = useState(settings.babyName)
  const [myName, setMyName] = useState(settings.myName)
  const [birthDate, setBirthDate] = useState(data?.birthDate ?? settings.birthDate ?? '')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // 快捷奶量编辑
  const [editingAmounts, setEditingAmounts] = useState(false)
  const [amounts, setAmounts] = useState<number[]>(data?.quickAmounts ?? DEFAULT_QUICK_AMOUNTS)
  const [newAmount, setNewAmount] = useState('')
  const [savingAmounts, setSavingAmounts] = useState(false)
  const [amountsSaved, setAmountsSaved] = useState(false)

  // 头像 - 从本地缓存读取，云端通过独立接口获取
  const [avatar, setAvatar] = useState<string | undefined>(settings.babyAvatar)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 首次加载时从云端同步头像
  useEffect(() => {
    if (!avatar) {
      getCloudAvatar().then(cloudAvatar => {
        if (cloudAvatar) {
          setAvatar(cloudAvatar)
          saveSettings({ babyAvatar: cloudAvatar })
        }
      }).catch(() => { /* ignore */ })
    }
  }, [])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setAvatar(compressed)
      saveSettings({ babyAvatar: compressed })
      // 同步到云端（独立存储）
      setAvatarSaving(true)
      await setCloudAvatar(compressed)
      setAvatarSaving(false)
    } catch {
      setAvatarSaving(false)
      alert('图片处理失败，请换一张试试')
    }
    e.target.value = ''
  }

  const handleRemoveAvatar = async () => {
    setAvatar(undefined)
    saveSettings({ babyAvatar: undefined })
    try {
      setAvatarSaving(true)
      await setCloudAvatar(null)
    } catch { /* ignore */ }
    setAvatarSaving(false)
  }

  const handleSave = async () => {
    saveSettings({ babyName: babyName.trim(), myName: myName.trim(), birthDate: birthDate || undefined })
    // 同步出生日期到云端
    if (birthDate !== (data?.birthDate ?? '')) {
      try {
        await updateFamilySettings({ birthDate: birthDate || null })
        await onRefresh()
      } catch { /* ignore */ }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(settings.familyCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      prompt('复制家庭码：', settings.familyCode)
    }
  }

  const handleAddAmount = () => {
    const val = Number(newAmount)
    if (!val || val <= 0 || amounts.includes(val)) return
    setAmounts([...amounts, val].sort((a, b) => a - b))
    setNewAmount('')
  }

  const handleRemoveAmount = (ml: number) => {
    setAmounts(amounts.filter(a => a !== ml))
  }

  const handleSaveAmounts = async () => {
    setSavingAmounts(true)
    try {
      await updateFamilySettings({ quickAmounts: amounts })
      await onRefresh()
      setAmountsSaved(true)
      setTimeout(() => setAmountsSaved(false), 1500)
      setEditingAmounts(false)
    } catch {
      alert('保存失败，请重试')
    } finally {
      setSavingAmounts(false)
    }
  }

  const handleResetAmounts = () => {
    setAmounts([...DEFAULT_QUICK_AMOUNTS])
  }

  return (
    <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-text">设置</h1>

      {/* 家庭码 */}
      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-text-light mb-2">家庭码（分享给家人加入）</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono tracking-[0.3em] text-warm-500 font-bold">
            {settings.familyCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg bg-warm-50 text-sm text-text-light active:bg-warm-100 transition-colors"
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </div>
      </div>

      {/* 个人设置 */}
      <div className="bg-card rounded-2xl p-5 space-y-4 shadow-sm">
        {/* 宝宝头像 */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="relative w-20 h-20 rounded-full bg-warm-50 border-2 border-warm-200 flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition-transform"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatar ? (
              <img src={avatar} alt="宝宝头像" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👶</span>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-white text-xs opacity-0 hover:opacity-100">更换</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              className="text-xs text-warm-500 active:text-warm-600 disabled:opacity-50"
            >
              {avatarSaving ? '同步中...' : avatar ? '更换头像' : '上传头像'}
            </button>
            {avatar && !avatarSaving && (
              <button
                onClick={handleRemoveAvatar}
                className="text-xs text-text-light active:text-danger"
              >
                移除
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-light mb-1.5">宝宝昵称</label>
          <input
            type="text"
            value={babyName}
            onChange={e => setBabyName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-cream border border-warm-100 text-text text-lg focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm text-text-light mb-1.5">我的称呼</label>
          <input
            type="text"
            value={myName}
            onChange={e => setMyName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-cream border border-warm-100 text-text text-lg focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm text-text-light mb-1.5">宝宝出生日期</label>
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-cream border border-warm-100 text-text text-lg focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
          />
          <p className="text-xs text-text-light mt-1">设置后首页会显示宝宝出生天数</p>
        </div>
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white font-medium active:scale-[0.98] transition-all"
        >
          {saved ? '✓ 已保存' : '保存设置'}
        </button>
      </div>

      {/* 快捷奶量设置 */}
      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-base font-medium text-text">快捷奶量</p>
            <p className="text-xs text-text-light mt-0.5">对整个家庭生效</p>
          </div>
          {!editingAmounts && (
            <button
              onClick={() => { setEditingAmounts(true); setAmounts(data?.quickAmounts ?? DEFAULT_QUICK_AMOUNTS) }}
              className="px-3 py-1.5 rounded-lg bg-warm-50 text-sm text-text-light active:bg-warm-100 transition-colors"
            >
              编辑
            </button>
          )}
        </div>

        {/* 当前奶量展示 / 编辑 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(editingAmounts ? amounts : (data?.quickAmounts ?? DEFAULT_QUICK_AMOUNTS)).map(ml => (
            <span
              key={ml}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium ${
                editingAmounts
                  ? 'bg-warm-50 text-text pr-1.5'
                  : 'bg-warm-50 text-warm-600'
              }`}
            >
              {ml}ml
              {editingAmounts && (
                <button
                  onClick={() => handleRemoveAmount(ml)}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-warm-200/60 text-text-light text-xs ml-0.5 active:bg-warm-300/60"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>

        {editingAmounts && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAmount()}
                placeholder="输入奶量 (ml)"
                className="flex-1 px-3 py-2.5 rounded-xl bg-cream border border-warm-100 text-text focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
              />
              <button
                onClick={handleAddAmount}
                className="px-4 py-2.5 rounded-xl bg-warm-400 text-white font-medium active:bg-warm-500 transition-colors"
              >
                添加
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveAmounts}
                disabled={savingAmounts || amounts.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {savingAmounts ? '保存中...' : amountsSaved ? '✓ 已保存' : '保存奶量设置'}
              </button>
              <button
                onClick={handleResetAmounts}
                className="px-4 py-2.5 rounded-xl bg-warm-50 text-text-light text-sm font-medium active:bg-warm-100 transition-colors"
              >
                重置
              </button>
              <button
                onClick={() => setEditingAmounts(false)}
                className="px-4 py-2.5 rounded-xl bg-warm-50 text-text-light text-sm font-medium active:bg-warm-100 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 深夜模式 */}
      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-medium text-text">🌙 深夜模式</p>
            <p className="text-xs text-text-light mt-0.5">
              {nightMode.preference === 'auto'
                ? `自动 · 当前${nightMode.isNight ? '已开启' : '未开启'}`
                : nightMode.preference === 'on'
                  ? '手动开启'
                  : '手动关闭'}
            </p>
          </div>
          <button
            onClick={nightMode.cycleMode}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              nightMode.preference === 'auto'
                ? 'bg-warm-50 text-text-light'
                : nightMode.preference === 'on'
                  ? 'bg-warm-500 text-white'
                  : 'bg-warm-50 text-text-light'
            }`}
          >
            {nightMode.preference === 'auto' ? '自动' : nightMode.preference === 'on' ? '开启' : '关闭'}
          </button>
        </div>
      </div>

      {/* 刷新 */}
      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-warm-50 text-text font-medium active:bg-warm-100 transition-colors disabled:opacity-50"
        >
          {loading ? '同步中...' : '🔄 手动刷新数据'}
        </button>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm text-sm text-text-light space-y-1">
        <p>宝宝喝奶记录 V2</p>
        <p>数据存储于云端，家人共享</p>
        {data && <p>共 {data.records.length} 条记录</p>}
      </div>
    </div>
  )
}
