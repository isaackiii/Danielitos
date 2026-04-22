import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

const BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

const mockAuthState = {
  loading: false,
  user: {
    uid: import.meta.env.VITE_DEV_UID || 'dev-user',
    displayName: import.meta.env.VITE_DEV_NAME || 'Dev User',
    email: 'dev@local',
    photoURL: null,
  },
  householdId: import.meta.env.VITE_DEV_HOUSEHOLD_ID || 'dev-household',
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(
    BYPASS_AUTH ? mockAuthState : { loading: true, user: null, householdId: null }
  )

  useEffect(() => {
    if (BYPASS_AUTH) return
    let unsubUser = () => {}

    const unsubAuth = onAuthStateChanged(auth, user => {
      unsubUser()
      if (!user) {
        setState({ loading: false, user: null, householdId: null })
        return
      }
      unsubUser = onSnapshot(doc(db, 'users', user.uid), snap => {
        setState({
          loading: false,
          user,
          householdId: snap.exists() ? snap.data().householdId : null,
        })
      })
    })

    return () => { unsubAuth(); unsubUser() }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
