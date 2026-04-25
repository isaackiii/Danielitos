import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { BURBUJAS, burbFontFamily } from '../lib/burbujasTheme'

const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode() {
  return Array.from({ length: 6 }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join('')
}

export default function Setup() {
  const { loading, user, householdId } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (loading) return
    if (!user) navigate('/login')
    if (householdId) navigate('/')
  }, [loading, user, householdId, navigate])

  const saveUser = (uid, householdId) =>
    setDoc(doc(db, 'users', uid), {
      householdId,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    })

  const handleCreate = async () => {
    setBusy(true)
    setError(null)
    try {
      const id = generateCode()
      await setDoc(doc(db, 'households', id), {
        code: id,
        members: [user.uid],
        createdAt: serverTimestamp(),
      })
      await saveUser(user.uid, id)
      navigate('/')
    } catch {
      setError('Error al crear el hogar. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    setBusy(true)
    setError(null)
    const id = code.trim().toUpperCase()
    try {
      const snap = await getDoc(doc(db, 'households', id))
      if (!snap.exists()) {
        setError('Código no encontrado. Verifica e intenta de nuevo.')
        setBusy(false)
        return
      }
      await updateDoc(doc(db, 'households', id), { members: arrayUnion(user.uid) })
      await saveUser(user.uid, id)
      navigate('/')
    } catch {
      setError('Error al unirse. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const optionCard = (color, emoji, title, desc, onClick) => (
    <button onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: 14, borderRadius: 16,
        background: '#fff',
        border: `2.5px solid ${BURBUJAS.dark}`,
        boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
        cursor: 'pointer', textAlign: 'left',
        fontFamily: burbFontFamily,
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        background: color, color: '#fff',
        borderRadius: 12, fontSize: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${BURBUJAS.dark}`,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: BURBUJAS.dark }}>{title}</div>
        <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  )

  const primaryBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: '100%', padding: '12px 16px', borderRadius: 14, fontSize: 14,
        background: BURBUJAS.purple, color: '#fff',
        border: `2.5px solid ${BURBUJAS.dark}`,
        boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 800, fontFamily: burbFontFamily,
        opacity: disabled ? 0.5 : 1,
      }}>
      {label}
    </button>
  )

  const backBtn = (
    <button onClick={() => setMode(null)}
      style={{
        width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 700,
        background: 'transparent', color: BURBUJAS.dark, opacity: 0.6,
        border: 'none', cursor: 'pointer', fontFamily: burbFontFamily,
      }}>
      ← Volver
    </button>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: BURBUJAS.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily: burbFontFamily,
      color: BURBUJAS.dark,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        border: `2.5px solid ${BURBUJAS.dark}`,
        boxShadow: `4px 4px 0 ${BURBUJAS.dark}`,
        padding: 28,
        width: '100%',
        maxWidth: 380,
      }}>
        <h2 style={{
          fontSize: 22, fontWeight: 900, textAlign: 'center', margin: 0, color: BURBUJAS.purple,
        }}>
          Configura tu hogar
        </h2>
        <p style={{ fontSize: 13, opacity: 0.6, textAlign: 'center', marginTop: 4, marginBottom: 22, fontWeight: 600 }}>
          ¿Creas uno nuevo o te unes a uno existente?
        </p>

        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {optionCard(BURBUJAS.purple, '🏡', 'Crear nuevo hogar', 'Generarás un código para invitar a tu pareja', () => setMode('create'))}
            {optionCard(BURBUJAS.pink, '💞', 'Unirme a un hogar', 'Tengo el código de mi pareja', () => setMode('join'))}
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, opacity: 0.7, fontWeight: 600 }}>
              Se creará un hogar y podrás compartir el código de 6 letras con tu pareja para que se una.
            </p>
            {error && (
              <div style={{
                background: BURBUJAS.pinkSoft, color: BURBUJAS.dark, fontWeight: 700, fontSize: 13,
                padding: 12, borderRadius: 12, border: `2px solid ${BURBUJAS.dark}`,
              }}>{error}</div>
            )}
            {primaryBtn(busy ? 'Creando...' : 'Crear hogar', handleCreate, busy)}
            {backBtn}
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, opacity: 0.7, fontWeight: 600 }}>Ingresa el código de tu hogar:</p>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              style={{
                width: '100%', padding: '14px 16px',
                border: `2.5px solid ${BURBUJAS.dark}`,
                borderRadius: 14,
                textAlign: 'center', fontSize: 26, fontWeight: 900,
                letterSpacing: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: BURBUJAS.dark, outline: 'none', background: BURBUJAS.cream,
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <div style={{
                background: BURBUJAS.pinkSoft, color: BURBUJAS.dark, fontWeight: 700, fontSize: 13,
                padding: 12, borderRadius: 12, border: `2px solid ${BURBUJAS.dark}`,
              }}>{error}</div>
            )}
            {primaryBtn(busy ? 'Uniéndome...' : 'Unirme', handleJoin, busy || code.length < 4)}
            {backBtn}
          </div>
        )}
      </div>
    </div>
  )
}
