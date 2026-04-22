import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, householdId: null })

  useEffect(() => {
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
