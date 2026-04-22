import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Home } from 'lucide-react'

export default function Login() {
  const { loading, user, householdId } = useAuth()
  const navigate = useNavigate()
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
      setError('No se pudo iniciar sesión. Intenta de nuevo.')
      setSigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
        <div className="flex justify-center mb-5">
          <div className="bg-violet-100 rounded-2xl p-4">
            <Home size={32} className="text-violet-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nuestro Hogar</h1>
        <p className="text-gray-400 text-sm mb-8">Organiza tu hogar junto a tu familia</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>
        )}

        <button
          onClick={handleGoogle}
          disabled={signing || loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
