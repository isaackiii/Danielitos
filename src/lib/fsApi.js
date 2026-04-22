// Facade over firebase/firestore. In dev bypass mode, swaps to an in-memory mock store.
import * as real from 'firebase/firestore'
import * as mock from './devMockStore'

const BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

const impl = BYPASS ? mock : real

export const collection = (...a) => impl.collection(...a)
export const doc = (...a) => impl.doc(...a)
export const query = (...a) => impl.query(...a)
export const orderBy = (...a) => impl.orderBy(...a)
export const where = (...a) => impl.where(...a)
export const onSnapshot = (...a) => impl.onSnapshot(...a)
export const addDoc = (...a) => impl.addDoc(...a)
export const updateDoc = (...a) => impl.updateDoc(...a)
export const deleteDoc = (...a) => impl.deleteDoc(...a)
export const setDoc = (...a) => impl.setDoc(...a)
export const getDoc = (...a) => impl.getDoc(...a)
export const serverTimestamp = (...a) => impl.serverTimestamp(...a)
