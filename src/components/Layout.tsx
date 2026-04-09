import { NavLink, Outlet, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/', label: '首页', icon: '🍼' },
  { to: '/history', label: '记录', icon: '📋' },
  { to: '/growth', label: '成长', icon: '📏' },
  { to: '/stats', label: '统计', icon: '🐻' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto pb-20">
        <div key={location.pathname} className="animate-page-enter">
          <Outlet />
        </div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-warm-100 flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
