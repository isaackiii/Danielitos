import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc } from 'firebase/firestore'
import { Home } from 'lucide-react'

export default function Login() {
  const { loading, user, householdId } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // signin | signup
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
    <div className="min-h-screen bg-violet-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <div className="bg-violet-100 rounded-2xl p-4">
            <Home size={32} className="text-violet-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Nuestro Hogar</h1>
        <p className="text-gray-400 text-sm mb-8 text-center">Organiza tu hogar junto a tu familia</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode('signin'); setError(null) }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              isSignIn
                ? 'bg-violet-100 text-violet-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Inicia sesión
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null) }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              !isSignIn
                ? 'bg-violet-100 text-violet-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Regístrate
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>
        )}

        <form onSubmit={isSignIn ? handleEmailSignIn : handleEmailSignUp} className="space-y-3 mb-5">
          {!isSignIn && (
            <input
              type="text"
              placeholder="Tu nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
          />
          <button
            type="submit"
            disabled={signing || loading || !isValid}
            className="w-full bg-violet-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {signing ? 'Procesando...' : isSignIn ? 'Inicia sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">o</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={signing || loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
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
