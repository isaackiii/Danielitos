import { useState } from 'react'
import { Copy, Check as CheckIcon, LogOut } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { BURBUJAS, burbFontFamily } from '../lib/burbujasTheme'
import BurbCard from '../components/burbujas/BurbCard'

export default function Settings() {
  const { user, householdId } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(householdId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div style={{
      padding: '16px 16px 24px',
      maxWidth: 480,
      margin: '0 auto',
      fontFamily: burbFontFamily,
      color: BURBUJAS.dark,
      fontWeight: 700,
    }}>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>Ajustes</div>

      {/* Perfil */}
      <BurbCard color={BURBUJAS.cream} offset={3} style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.6, letterSpacing: 0.5, marginBottom: 10 }}>
          PERFIL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.photoURL ? (
            <img src={user.photoURL} style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${BURBUJAS.dark}` }} alt="" />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: BURBUJAS.purple, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900,
              border: `2px solid ${BURBUJAS.dark}`,
            }}>
              {user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{user?.displayName}</div>
            <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>{user?.email}</div>
          </div>
        </div>
      </BurbCard>

      {/* Código del hogar */}
      {householdId && (
        <BurbCard color={BURBUJAS.yellowSoft} offset={3} style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.6, letterSpacing: 0.5, marginBottom: 10 }}>
            CÓDIGO DEL HOGAR · COMPARTE CON TU PAREJA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{
              fontSize: 16, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontWeight: 900, letterSpacing: 3,
            }}>{householdId}</span>
            <button
              onClick={copyCode}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 800, color: BURBUJAS.dark,
                background: '#fff',
                border: `2px solid ${BURBUJAS.dark}`,
                borderRadius: 12, padding: '6px 12px',
                boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
                cursor: 'pointer',
                fontFamily: burbFontFamily,
              }}
            >
              {copied ? <CheckIcon size={14} color={BURBUJAS.green} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </BurbCard>
      )}

      {/* Cerrar sesión */}
      <BurbCard color="#fff" offset={3} style={{ padding: 4 }}>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '12px 14px',
            fontSize: 14, fontWeight: 800, color: BURBUJAS.dark,
            background: 'transparent', border: 'none',
            borderRadius: 16, cursor: 'pointer',
            fontFamily: burbFontFamily,
          }}
          onMouseEnter={e => e.currentTarget.style.background = BURBUJAS.pinkSoft}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </BurbCard>
    </div>
  )
}
