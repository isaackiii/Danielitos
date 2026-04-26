import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, ClipboardList, ShoppingCart, Wallet, Refrigerator, LogOut, Download, Settings } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import InstallPrompt from './InstallPrompt'
import { BURBUJAS, navColors, burbFontFamily } from '../lib/burbujasTheme'

function useIsDesktop() {
  const get = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  const [isDesktop, setIsDesktop] = useState(get)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = e => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

const navItems = [
  { id: 'home', to: '/', icon: Home, label: 'Inicio', exact: true, emoji: '🏡', color: navColors.home },
  { id: 'task', to: '/tareas', icon: ClipboardList, label: 'Tareas', emoji: '✅', color: navColors.task },
  { id: 'shop', to: '/compras', icon: ShoppingCart, label: 'Compras', emoji: '🛍️', color: navColors.shop },
  { id: 'fin', to: '/finanzas', icon: Wallet, label: 'Finanzas', emoji: '💸', color: navColors.fin },
  { id: 'refri', to: '/refri', icon: Refrigerator, label: 'Refri', emoji: '🧊', color: navColors.refri },
]

export default function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const menuRef = useRef(null)
  const [canInstall, setCanInstall] = useState(false)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    const handler = () => setCanInstall(true)
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showInstall && <InstallPrompt manualTrigger={showInstall} onClose={() => setShowInstall(false)} />}
      {/* Sidebar desktop */}
      {isDesktop && (
      <aside style={{
        display: 'flex',
        flexDirection: 'column',
        width: 224,
        background: BURBUJAS.cream,
        borderRight: `2.5px solid ${BURBUJAS.dark}`,
        position: 'fixed',
        height: '100vh',
        zIndex: 10,
        fontFamily: burbFontFamily,
      }}>
        <div style={{
          padding: 20,
          borderBottom: `2.5px solid ${BURBUJAS.dark}`,
        }}>
          <span style={{
            fontSize: 18,
            fontWeight: 800,
            color: BURBUJAS.purple,
            fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
          }}>Nuestro Hogar</span>
        </div>
        <nav style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label, exact, color }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s',
                textDecoration: 'none',
                color: isActive ? '#fff' : BURBUJAS.dark,
                background: isActive ? color : 'transparent',
                border: isActive ? `2px solid ${BURBUJAS.dark}` : '2px solid transparent',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: `2.5px solid ${BURBUJAS.dark}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            {user?.photoURL && (
              <img src={user.photoURL} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
            )}
            <span style={{ fontSize: 12, color: BURBUJAS.dark, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName}</span>
          </div>
          <button
            onClick={() => navigate('/ajustes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 14,
              fontSize: 14,
              color: BURBUJAS.dark,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = BURBUJAS.yellow}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            <Settings size={16} />
            Ajustes
          </button>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 14,
              fontSize: 14,
              color: BURBUJAS.dark,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = BURBUJAS.yellow}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      )}

      {/* Header mobile */}
      {!isDesktop && (
      <header style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: BURBUJAS.cream,
        borderBottom: `2.5px solid ${BURBUJAS.dark}`,
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 56,
        fontFamily: burbFontFamily,
      }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: BURBUJAS.purple }}>Nuestro Hogar</span>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: '50%',
              padding: 4,
              background: 'transparent',
              border: `2px solid ${BURBUJAS.dark}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = BURBUJAS.yellow}
            onMouseLeave={e => e.target.style.background = 'transparent'}
            aria-label="Menú de usuario"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="" />
            ) : (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: BURBUJAS.purple,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
              }}>
                {user?.displayName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: 4,
              width: 224,
              background: BURBUJAS.cream,
              borderRadius: 20,
              border: `2.5px solid ${BURBUJAS.dark}`,
              boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
              overflow: 'hidden',
              zIndex: 30,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `2.5px solid ${BURBUJAS.dark}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: BURBUJAS.dark, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName}</div>
                <div style={{ fontSize: 12, color: BURBUJAS.dark, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
              </div>
              {canInstall && (
                <button
                  onClick={() => { setMenuOpen(false); setShowInstall(true) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    fontSize: 14,
                    color: BURBUJAS.dark,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2.5px solid ${BURBUJAS.dark}`,
                    width: '100%',
                    cursor: 'pointer',
                    fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = BURBUJAS.yellow}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  <Download size={16} />
                  Descargar app
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); navigate('/ajustes') }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  fontSize: 14,
                  color: BURBUJAS.dark,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2.5px solid ${BURBUJAS.dark}`,
                  width: '100%',
                  cursor: 'pointer',
                  fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = BURBUJAS.yellow}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <Settings size={16} />
                Ajustes
              </button>
              <button
                onClick={() => { setMenuOpen(false); handleSignOut() }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  fontSize: 14,
                  color: BURBUJAS.dark,
                  background: 'transparent',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = BURBUJAS.yellow}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>
      )}

      {/* Main content */}
      <main style={{
        flex: 1,
        minWidth: 0,
        overflowX: 'hidden',
        marginLeft: isDesktop ? 224 : 0,
        paddingTop: isDesktop ? 0 : 56,
        paddingBottom: isDesktop ? 0 : 90,
        background: BURBUJAS.bg,
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      {!isDesktop && (
      <nav style={{
        display: 'block',
        position: 'fixed',
        bottom: 10,
        left: 10,
        right: 10,
        background: BURBUJAS.cream,
        border: `2.5px solid ${BURBUJAS.dark}`,
        borderRadius: 20,
        zIndex: 10,
        boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
        padding: '0 6px',
        fontFamily: burbFontFamily,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 58 }}>
          {navItems.map(({ id, to, icon: Icon, label, exact, color, emoji }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                textDecoration: 'none',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 14,
                background: isActive ? color : 'transparent',
                border: isActive ? `2px solid ${BURBUJAS.dark}` : '2px solid transparent',
                color: isActive ? '#fff' : BURBUJAS.dark,
                transition: 'all 0.2s',
                transform: isActive ? 'translateY(-2px)' : 'none',
              })}
            >
              <div style={{ fontSize: 18 }}>{emoji}</div>
              <div>{label}</div>
            </NavLink>
          ))}
        </div>
      </nav>
      )}
    </div>
  )
}
