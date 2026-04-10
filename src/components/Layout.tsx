import { NavLink, Outlet, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/', label: '首页', icon: '🍼' },
  { to: '/history', label: '记录', icon: '📋' },
  { to: '/growth', label: '成长', icon: '🌱' },
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
      <main className="flex-1 overflow-y-auto pb-20">
        <div key={location.pathname} className="animate-page-enter">
          <Outlet />
        </div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 glass-nav flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                isActive ? 'text-warm-500' : 'text-text-light'
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
