import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { label: '首页', path: '/' },
  { label: '基础数据', path: '/basic-data' },
  { label: '系统设置', path: '/settings' },
]

export function Header() {
  const location = useLocation()

  return (
    <header className="h-14 bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-lg font-semibold text-gray-800">规划与排程系统</span>
        </div>

        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
