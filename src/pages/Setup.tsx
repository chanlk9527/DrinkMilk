import { useState } from 'react'
import { createFamily, joinFamily } from '../lib/google-drive'

const namePresets = ['爸爸', '妈妈', '奶奶', '姥姥']

type Mode = 'choose' | 'create' | 'join'

interface Props {
  onComplete: (info: { babyName: string; myName: string; familyId: string; familyCode: string }) => void
}

export default function Setup({ onComplete }: Props) {
  const [mode, setMode] = useState<Mode>('choose')
  const [babyName, setBabyName] = useState('')
  const [myName, setMyName] = useState('')
  const [familyCode, setFamilyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await createFamily(babyName.trim())
      onComplete({
        babyName: babyName.trim(),
        myName: myName.trim(),
        familyId: result.familyId,
        familyCode: result.familyCode,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await joinFamily(familyCode.trim())
      onComplete({
        babyName: result.babyName,
        myName: myName.trim(),
        familyId: result.familyId,
        familyCode: result.familyCode,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '加入失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => { setMode('choose'); setError('') }

  // 选择模式
  if (mode === 'choose') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'linear-gradient(168deg, #FDFBF7 0%, #F7F0E6 40%, #F2EBDF 100%)' }}>
        {/* 顶部装饰区 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 flex items-center justify-center" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.04)' }}>
              <span className="text-6xl">🍼</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-warm-400 flex items-center justify-center" style={{ boxShadow: '0 4px 12px rgba(160,120,80,0.2)' }}>
              <span className="text-lg">💛</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">宝宝喝奶记录</h1>
          <p className="text-text-light text-center leading-relaxed">
            家人一起记录<br />宝宝的每一餐
          </p>
        </div>

        {/* 底部操作区 */}
        <div className="px-6 pb-10 space-y-3">
          <button
            onClick={() => setMode('create')}
            className="w-full py-4 rounded-2xl btn-primary text-white text-lg font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">✨</span>
            创建新记录
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full py-4 rounded-2xl bg-white/60 backdrop-blur-xl text-text text-lg font-medium border border-white/60 active:bg-white/70 transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.03)' }}
          >
            <span className="text-xl">👨‍👩‍👧</span>
            加入已有记录
          </button>
        </div>
      </div>
    )
  }

  // 创建家庭
  if (mode === 'create') {
    const canSubmit = babyName.trim() && myName.trim()
    return (
      <div className="flex flex-col h-full" style={{ background: 'linear-gradient(168deg, #FDFBF7 0%, #F7F0E6 40%, #F2EBDF 100%)' }}>
        <Header icon="🏠" title="创建新记录" subtitle="创建后分享家庭码，家人即可加入" onBack={goBack} />

        <div className="flex-1 overflow-y-auto px-6 pb-10">
          <div className="space-y-5">
            {/* 宝宝昵称卡片 */}
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 border border-white/60" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
              <label className="flex items-center gap-2 text-sm font-medium text-text mb-3">
                <span className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center text-xs">👶</span>
                宝宝的昵称
              </label>
              <input
                type="text"
                value={babyName}
                onChange={e => setBabyName(e.target.value)}
                placeholder="例如：小宝"
                className="w-full px-4 py-3.5 rounded-xl bg-cream border border-warm-100 text-text text-lg placeholder:text-warm-200 focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
              />
            </div>

            {/* 称呼卡片 */}
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 border border-white/60" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
              <NamePicker myName={myName} setMyName={setMyName} />
            </div>

            {error && <ErrorBanner message={error} />}

            <button
              disabled={!canSubmit || loading}
              onClick={handleCreate}
              className="w-full py-4 rounded-2xl text-lg font-semibold btn-primary text-white disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {loading ? <LoadingDots text="创建中" /> : '开始使用 →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 加入家庭
  const canJoin = familyCode.trim().length === 6 && myName.trim()
  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(168deg, #FDFBF7 0%, #F7F0E6 40%, #F2EBDF 100%)' }}>
      <Header icon="👨‍👩‍👧" title="加入已有记录" subtitle="输入家人分享的 6 位家庭码" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="space-y-5">
          {/* 家庭码卡片 */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 border border-white/60" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-3">
              <span className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center text-xs">🔑</span>
              家庭码
            </label>
            <div className="flex gap-1.5 justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold font-mono transition-colors ${
                    familyCode[i]
                      ? 'border-warm-400 bg-warm-50 text-warm-600'
                      : 'border-warm-100 bg-cream text-warm-200'
                  }`}
                >
                  {familyCode[i] || '·'}
                </div>
              ))}
            </div>
            <input
              type="text"
              value={familyCode}
              onChange={e => setFamilyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              placeholder="输入6位数字"
              className="w-full mt-3 px-4 py-3 rounded-xl bg-cream border border-warm-100 text-text text-lg text-center tracking-[0.3em] font-mono placeholder:text-warm-200 placeholder:tracking-normal focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
              autoFocus
            />
          </div>

          {/* 称呼卡片 */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 border border-white/60" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
            <NamePicker myName={myName} setMyName={setMyName} />
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            disabled={!canJoin || loading}
            onClick={handleJoin}
            className="w-full py-4 rounded-2xl text-lg font-semibold btn-primary text-white disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {loading ? <LoadingDots text="加入中" /> : '加入 →'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- 子组件 ---- */

function Header({ icon, title, subtitle, onBack }: { icon: string; title: string; subtitle: string; onBack: () => void }) {
  return (
    <div className="px-6 pt-6 pb-5">
      <button onClick={onBack} className="flex items-center gap-1 text-text-light text-sm mb-5 active:text-warm-500 transition-colors">
        <span className="text-lg">‹</span> 返回
      </button>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-xl border border-white/50 flex items-center justify-center text-xl" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">{title}</h1>
          <p className="text-sm text-text-light">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

function NamePicker({ myName, setMyName }: { myName: string; setMyName: (v: string) => void }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-text mb-3">
        <span className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center text-xs">🙋</span>
        我是
      </label>
      <div className="flex flex-wrap gap-2 mb-3">
        {namePresets.map(name => (
          <button
            key={name}
            onClick={() => setMyName(name)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              myName === name
                ? 'bg-warm-400 text-white'
                : 'bg-cream border border-warm-100 text-text-light active:border-warm-300'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={myName}
        onChange={e => setMyName(e.target.value)}
        placeholder="或自定义称呼"
        className="w-full px-4 py-3.5 rounded-xl bg-cream border border-warm-100 text-text text-lg placeholder:text-warm-200 focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/20 transition-all"
      />
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm rounded-xl px-4 py-3">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  )
}

function LoadingDots({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {text}
      <span className="inline-flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    </span>
  )
}
