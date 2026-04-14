import { NavLink, Outlet, useLocation } from 'react-router-dom'

const leftTabs = [
  { to: '/history', label: '历史', icon: '📋' },
  { to: '/growth', label: '成长', icon: '🌱' },
]

const rightTabs = [
  { to: '/stats', label: '统计', icon: '🐻' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

const fireflyDots = [
  { size: 10, breathe: '4s', delay: '0s', drift: 'firefly-drift-1', driftDur: '28s' },
  { size: 8,  breathe: '3.5s', delay: '1.2s', drift: 'firefly-drift-2', driftDur: '24s' },
  { size: 12, breathe: '5s', delay: '0.6s', drift: 'firefly-drift-3', driftDur: '32s' },
  { size: 7,  breathe: '3.8s', delay: '2.1s', drift: 'firefly-drift-4', driftDur: '26s' },
]

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex flex-col h-full">
      {fireflyDots.map((dot, i) => (
        <div
          key={i}
          className="firefly-dot"
          style={{
            width: dot.size,
            height: dot.size,
            '--breathe-duration': dot.breathe,
            '--delay': dot.delay,
            '--drift-name': dot.drift,
            '--drift-duration': dot.driftDur,
          } as React.CSSProperties}
        />
      ))}
      <main className="flex-1 overflow-y-auto pb-24">
        <div key={location.pathname} className="animate-page-enter">
          <Outlet />
        </div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 glass-nav flex items-end justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {/* 左侧 tabs */}
        {leftTabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-warm-500' : 'text-text-light'
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </NavLink>
        ))}

        {/* 中间首页按钮 — 突出显示 */}
        <NavLink
          to="/"
          end
          className="flex flex-col items-center -mt-5 relative"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
            isHome
              ? 'bg-gradient-to-br from-warm-400 to-warm-500 shadow-warm-400/30'
              : 'bg-card border-2 border-warm-200 shadow-warm-200/20'
          }`}>
            <span className={`text-2xl ${isHome ? 'drop-shadow-sm' : ''}`}>🍼</span>
          </div>
          <span className={`text-[10px] mt-0.5 ${isHome ? 'text-warm-500 font-medium' : 'text-text-light'}`}>记录</span>
        </NavLink>

        {/* 右侧 tabs */}
        {rightTabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-warm-500' : 'text-text-light'
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
