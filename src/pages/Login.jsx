import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc } from 'firebase/firestore'
import { BURBUJAS, burbFontFamily } from '../lib/burbujasTheme'

const inputStyle = {
  width: '100%',
  border: `2.5px solid ${BURBUJAS.dark}`,
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  fontFamily: burbFontFamily,
  fontWeight: 600,
  outline: 'none',
  background: '#fff',
  color: BURBUJAS.dark,
  boxSizing: 'border-box',
}

export default function Login() {
  const { loading, user, householdId } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (loading) return
    if (user && householdId) navigate('/')
    else if (user && !householdId) navigate('/setup')
  }, [user, householdId, loading, navigate])

  const handleGoogle = async () => {
    setSigning(true)
    setError(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch {
      setError('No se pudo iniciar sesión con Google. Intenta de nuevo.')
      setSigning(false)
    }
  }

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    setSigning(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const errorMap = {
        'auth/invalid-credential': 'Email o contraseña incorrectos',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
      }
      setError(errorMap[err.code] || 'Error al iniciar sesión. Intenta de nuevo.')
      setSigning(false)
    }
  }

  const handleEmailSignUp = async (e) => {
    e.preventDefault()
    setSigning(true)
    setError(null)
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(newUser, { displayName })
      await setDoc(doc(db, 'users', newUser.uid), {
        email,
        displayName,
        photoURL: null,
      })
    } catch (err) {
      const errorMap = {
        'auth/email-already-in-use': 'Este email ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/invalid-email': 'Email inválido',
      }
      setError(errorMap[err.code] || 'Error al registrarse. Intenta de nuevo.')
      setSigning(false)
    }
  }

  const isSignIn = mode === 'signin'
  const isValid = isSignIn
    ? email.trim() && password.trim()
    : email.trim() && password.trim() && displayName.trim()

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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            background: BURBUJAS.purple,
            color: '#fff',
            borderRadius: 20,
            padding: 14,
            border: `2.5px solid ${BURBUJAS.dark}`,
            boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
            fontSize: 32,
            lineHeight: 1,
          }}>
            🏡
          </div>
        </div>
        <h1 style={{
          fontSize: 24, fontWeight: 900, textAlign: 'center', margin: 0, color: BURBUJAS.purple,
        }}>
          Nuestro Hogar
        </h1>
        <p style={{ fontSize: 13, opacity: 0.6, textAlign: 'center', marginTop: 4, marginBottom: 24, fontWeight: 600 }}>
          Organiza tu hogar junto a tu familia
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['signin', 'Inicia sesión'], ['signup', 'Regístrate']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                background: mode === m ? BURBUJAS.purple : '#fff',
                color: mode === m ? '#fff' : BURBUJAS.dark,
                border: `2.5px solid ${BURBUJAS.dark}`,
                cursor: 'pointer', fontFamily: burbFontFamily,
                boxShadow: mode === m ? `2px 2px 0 ${BURBUJAS.dark}` : 'none',
                transition: 'all 0.2s',
              }}>
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: BURBUJAS.pinkSoft, color: BURBUJAS.dark, fontWeight: 700, fontSize: 13,
            padding: 12, borderRadius: 12, marginBottom: 14,
            border: `2px solid ${BURBUJAS.dark}`,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={isSignIn ? handleEmailSignIn : handleEmailSignUp}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {!isSignIn && (
            <input type="text" placeholder="Tu nombre" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
          )}
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Contraseña" value={password}
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          <button type="submit" disabled={signing || loading || !isValid}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 14, fontSize: 14,
              background: BURBUJAS.purple, color: '#fff',
              border: `2.5px solid ${BURBUJAS.dark}`,
              boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
              cursor: (signing || loading || !isValid) ? 'not-allowed' : 'pointer',
              fontWeight: 800, fontFamily: burbFontFamily,
              opacity: (signing || loading || !isValid) ? 0.5 : 1,
              marginTop: 4,
            }}>
            {signing ? 'Procesando...' : isSignIn ? 'Inicia sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ position: 'relative', marginBottom: 16, textAlign: 'center' }}>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          }}>
            <div style={{ width: '100%', borderTop: `2px dashed ${BURBUJAS.line}` }} />
          </div>
          <span style={{
            position: 'relative', background: '#fff', padding: '0 10px',
            fontSize: 11, opacity: 0.5, fontWeight: 700,
          }}>
            o
          </span>
        </div>

        <button onClick={handleGoogle} disabled={signing || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 14, fontSize: 14, fontWeight: 700,
            background: '#fff', color: BURBUJAS.dark,
            border: `2.5px solid ${BURBUJAS.dark}`,
            boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
            cursor: (signing || loading) ? 'not-allowed' : 'pointer',
            fontFamily: burbFontFamily,
            opacity: (signing || loading) ? 0.5 : 1,
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4"/>
            <path d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.92-2.26a5.43 5.43 0 0 1-8.07-2.85H.96v2.34A9 9 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.97 10.71a5.43 5.43 0 0 1 0-3.42V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.34z" fill="#FBBC05"/>
            <path d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.66 8.66 0 0 0 9 0a9 9 0 0 0-8.04 4.95l3.01 2.34A5.36 5.36 0 0 1 9 3.58z" fill="#EA4335"/>
          </svg>
          {signing ? 'Entrando...' : 'Continuar con Google'}
        </button>
      </div>
    </div>
  )
}
