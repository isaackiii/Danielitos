import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Home, Users } from 'lucide-react'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
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

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Configura tu hogar</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">¿Creas uno nuevo o te unes a un hogar existente?</p>

        {!mode && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-violet-300 hover:bg-violet-50 transition-colors text-left"
            >
              <div className="bg-violet-100 rounded-xl p-2">
                <Home size={20} className="text-violet-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Crear nuevo hogar</div>
                <div className="text-xs text-gray-400">Generarás un código para invitar a tu pareja</div>
              </div>
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="bg-gray-100 rounded-xl p-2">
                <Users size={20} className="text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Unirme a un hogar</div>
                <div className="text-xs text-gray-400">Tengo el código de mi pareja</div>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Se creará un hogar y podrás compartir el código de 6 letras con tu pareja para que se una.
            </p>
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
            <button
              onClick={handleCreate}
              disabled={busy}
              className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Creando...' : 'Crear hogar'}
            </button>
            <button onClick={() => setMode(null)} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">
              Volver
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Ingresa el código de tu hogar:</p>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
            <button
              onClick={handleJoin}
              disabled={busy || code.length < 4}
              className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Uniéndome...' : 'Unirme'}
            </button>
            <button onClick={() => setMode(null)} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
