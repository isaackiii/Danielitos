// In-memory Firestore emulation for dev bypass. Only loaded when VITE_DEV_BYPASS_AUTH=true.

const HH = 'dev-household'
const now = () => new Date()
const uid = () => Math.random().toString(36).slice(2, 10)

const seed = () => ({
  [`households/${HH}/tasks`]: [
    { id: 't1', title: 'Pagar el arriendo', assignee: 'yo', done: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: 't2', title: 'Lavar la ropa blanca', assignee: 'ambos', done: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
    { id: 't3', title: 'Llamar al veterinario', assignee: 'ella', done: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
    { id: 't4', title: 'Limpiar el refrigerador', assignee: 'ambos', done: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96) },
  ],
  [`households/${HH}/shoppingLists`]: [
    {
      id: 's1',
      name: 'Supermercado',
      items: [
        { id: 'i1', name: 'Leche', done: false },
        { id: 'i2', name: 'Pan', done: false },
        { id: 'i3', name: 'Huevos', done: true },
        { id: 'i4', name: 'Manzanas', done: false },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: 's2',
      name: 'Farmacia',
      items: [
        { id: 'i5', name: 'Ibuprofeno', done: false },
        { id: 'i6', name: 'Crema de manos', done: false },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  ],
  [`households/${HH}/expenses`]: [
    { id: 'e1', description: 'Supermercado semanal', amount: 85.40, category: 'Comida', paidBy: 'yo', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: 'e2', description: 'Luz', amount: 42.10, category: 'Servicios', paidBy: 'ella', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
    { id: 'e3', description: 'Gasolina', amount: 30.00, category: 'Transporte', paidBy: 'yo', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
    { id: 'e4', description: 'Cine', amount: 18.50, category: 'Entretenimiento', paidBy: 'ella', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96) },
  ],
  [`households/${HH}/deudas`]: [
    {
      id: 'd1',
      person: 'Juan',
      description: 'Préstamo de emergencia',
      amount: 200,
      type: 'nos_deben',
      abonos: [{ id: 'a1', amount: 50, note: 'Primer abono', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() }],
      paid: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    },
    {
      id: 'd2',
      person: 'Mamá',
      description: 'Mercado del mes',
      amount: 120,
      type: 'debemos',
      abonos: [],
      paid: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
  ],
})

const store = seed()
const listeners = new Map() // path -> Set<fn>

const notify = path => {
  const set = listeners.get(path)
  if (!set) return
  for (const fn of set) fn()
}

// Reference shapes
const collRef = path => ({ __type: 'coll', path })
const docRef = path => ({ __type: 'doc', path })

const parsePath = (...segments) => segments.filter(s => typeof s === 'string').join('/')

export const collection = (_db, ...segments) => collRef(parsePath(...segments))
export const doc = (_db, ...segments) => {
  // doc(db, 'col', 'id') or doc(collRef, 'id')
  if (_db && _db.__type === 'coll') {
    return docRef(parsePath(_db.path, ...segments))
  }
  return docRef(parsePath(...segments))
}

export const orderBy = (field, dir = 'asc') => ({ __type: 'orderBy', field, dir })
export const where = (field, op, value) => ({ __type: 'where', field, op, value })

export const query = (collection, ...constraints) => ({
  __type: 'query',
  coll: collection,
  constraints,
})

const applyConstraints = (rows, constraints) => {
  let out = [...rows]
  for (const c of constraints) {
    if (c.__type === 'where') {
      out = out.filter(r => {
        const v = r[c.field]
        switch (c.op) {
          case '==': return v === c.value
          case '!=': return v !== c.value
          case '<': return v < c.value
          case '<=': return v <= c.value
          case '>': return v > c.value
          case '>=': return v >= c.value
          default: return true
        }
      })
    } else if (c.__type === 'orderBy') {
      out.sort((a, b) => {
        const av = a[c.field]; const bv = b[c.field]
        if (av === bv) return 0
        const res = av > bv ? 1 : -1
        return c.dir === 'desc' ? -res : res
      })
    }
  }
  return out
}

const buildSnap = (ref) => {
  if (ref.__type === 'query' || ref.__type === 'coll') {
    const path = ref.__type === 'query' ? ref.coll.path : ref.path
    const rows = store[path] ?? []
    const filtered = ref.__type === 'query' ? applyConstraints(rows, ref.constraints) : rows
    return {
      size: filtered.length,
      docs: filtered.map(r => ({
        id: r.id,
        data: () => {
          const { id, ...rest } = r
          return rest
        },
      })),
    }
  }
  if (ref.__type === 'doc') {
    const parts = ref.path.split('/')
    const id = parts.pop()
    const collPath = parts.join('/')
    const rows = store[collPath] ?? []
    const found = rows.find(r => r.id === id)
    return {
      exists: () => !!found,
      data: () => {
        if (!found) return undefined
        const { id: _id, ...rest } = found
        return rest
      },
    }
  }
  return { size: 0, docs: [] }
}

export const onSnapshot = (ref, cb) => {
  const path = ref.__type === 'query' ? ref.coll.path : ref.path
  const pathKey = ref.__type === 'doc' ? ref.path.split('/').slice(0, -1).join('/') : path
  const emit = () => cb(buildSnap(ref))
  if (!listeners.has(pathKey)) listeners.set(pathKey, new Set())
  listeners.get(pathKey).add(emit)
  queueMicrotask(emit)
  return () => listeners.get(pathKey)?.delete(emit)
}

export const addDoc = async (collRef, data) => {
  const id = uid()
  if (!store[collRef.path]) store[collRef.path] = []
  store[collRef.path].push({ id, ...data, createdAt: data.createdAt instanceof Date ? data.createdAt : now() })
  notify(collRef.path)
  return { id }
}

export const updateDoc = async (docRef, data) => {
  const parts = docRef.path.split('/')
  const id = parts.pop()
  const collPath = parts.join('/')
  const rows = store[collPath] ?? []
  const idx = rows.findIndex(r => r.id === id)
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...data }
    notify(collPath)
  }
}

export const deleteDoc = async (docRef) => {
  const parts = docRef.path.split('/')
  const id = parts.pop()
  const collPath = parts.join('/')
  const rows = store[collPath] ?? []
  const idx = rows.findIndex(r => r.id === id)
  if (idx >= 0) {
    rows.splice(idx, 1)
    notify(collPath)
  }
}

export const setDoc = async (docRef, data) => {
  const parts = docRef.path.split('/')
  const id = parts.pop()
  const collPath = parts.join('/')
  if (!store[collPath]) store[collPath] = []
  const rows = store[collPath]
  const idx = rows.findIndex(r => r.id === id)
  if (idx >= 0) rows[idx] = { id, ...data }
  else rows.push({ id, ...data })
  notify(collPath)
}

export const getDoc = async (docRef) => buildSnap(docRef)

export const serverTimestamp = () => now()
