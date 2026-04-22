import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, ClipboardList, ShoppingCart, Wallet, LogOut } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: Home, label: 'Inicio', exact: true },
  { to: '/tareas', icon: ClipboardList, label: 'Tareas' },
  { to: '/compras', icon: ShoppingCart, label: 'Compras' },
  { to: '/finanzas', icon: Wallet, label: 'Finanzas' },
]

export default function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-5 border-b border-gray-100">
          <span className="text-lg font-bold text-violet-600">Nuestro Hogar</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-violet-50 text-violet-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2">
            {user?.photoURL && (
              <img src={user.photoURL} className="w-7 h-7 rounded-full" alt="" />
            )}
            <span className="text-xs text-gray-500 truncate">{user?.displayName}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 w-full transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-violet-600' : 'text-gray-400'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
