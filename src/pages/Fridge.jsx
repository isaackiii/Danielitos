import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, CalendarClock, AlertTriangle, X, Refrigerator } from 'lucide-react'

const CATEGORIES = [
  { id: 'lacteos',      label: 'Lácteos',      color: 'bg-sky-50 text-sky-600' },
  { id: 'carnes',       label: 'Carnes',        color: 'bg-red-50 text-red-500' },
  { id: 'verduras',     label: 'Verduras',      color: 'bg-emerald-50 text-emerald-600' },
  { id: 'frutas',       label: 'Frutas',        color: 'bg-orange-50 text-orange-500' },
  { id: 'bebidas',      label: 'Bebidas',       color: 'bg-blue-50 text-blue-500' },
  { id: 'condimentos',  label: 'Condimentos',   color: 'bg-yellow-50 text-yellow-600' },
  { id: 'otros',        label: 'Otros',         color: 'bg-gray-100 text-gray-500' },
]

const UNITS = ['unidades', 'kg', 'g', 'L', 'ml', 'porciones']

function getUrgency(expiresAt) {
  if (!expiresAt) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expiresAt + 'T00:00:00')
  const diff = Math.round((exp - today) / 86400000)
  if (diff < 0) return 'vencido'
  if (diff <= 2) return 'critico'
  if (diff <= 6) return 'pronto'
  return 'ok'
}

function urgencyBadge(urgency, expiresAt) {
  if (!urgency) return null
  const date = new Date(expiresAt + 'T00:00:00')
  const label = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

  const styles = {
    vencido: 'bg-red-100 text-red-600',
    critico: 'bg-red-50 text-red-500',
    pronto:  'bg-amber-50 text-amber-500',
    ok:      'bg-green-50 text-green-600',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${styles[urgency]}`}>
      {(urgency === 'vencido' || urgency === 'critico') && <AlertTriangle size={11} />}
      {urgency === 'vencido' ? 'Vencido' : label}
    </span>
  )
}

function sortByUrgency(items) {
  const order = { vencido: 0, critico: 1, pronto: 2, ok: 3, null: 4 }
  return [...items].sort((a, b) => {
    const ua = getUrgency(a.expiresAt)
    const ub = getUrgency(b.expiresAt)
    const diff = (order[ua] ?? 4) - (order[ub] ?? 4)
    if (diff !== 0) return diff
    if (a.expiresAt && b.expiresAt) return a.expiresAt.localeCompare(b.expiresAt)
    return 0
  })
}

export default function Fridge() {
  const { householdId } = useAuth()
  const [items, setItems] = useState([])
  const [filterCat, setFilterCat] = useState('todas')
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('unidades')
  const [category, setCategory] = useState('otros')
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!householdId) return
    const unsub = onSnapshot(
      query(collection(db, 'households', householdId, 'fridge'), orderBy('createdAt', 'desc')),
      snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [householdId])

  const displayed = useMemo(() => {
    const filtered = filterCat === 'todas' ? items : items.filter(i => i.category === filterCat)
    return sortByUrgency(filtered)
  }, [items, filterCat])

  const expiringSoon = useMemo(
    () => items.filter(i => ['vencido', 'critico', 'pronto'].includes(getUrgency(i.expiresAt))).length,
    [items]
  )

  const resetForm = () => {
    setName(''); setQty(''); setUnit('unidades'); setCategory('otros'); setExpiresAt('')
    setShowForm(false)
  }

  const handleAdd = async e => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await addDoc(collection(db, 'households', householdId, 'fridge'), {
      name: name.trim(),
      qty: qty.trim(),
      unit,
      category,
      expiresAt: expiresAt || null,
      createdAt: serverTimestamp(),
    })
    setSaving(false)
    resetForm()
  }

  const handleDelete = id =>
    deleteDoc(doc(db, 'households', householdId, 'fridge', id))

  const catInfo = id => CATEGORIES.find(c => c.id === id) ?? CATEGORIES.at(-1)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pt-4 mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Refrigerator size={24} className="text-cyan-500" />
            La refri
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
            {expiringSoon > 0 && (
              <span className="ml-2 text-amber-500 font-medium">
                · {expiringSoon} {expiringSoon === 1 ? 'próximo a vencer' : 'próximos a vencer'}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-700">Nuevo producto</span>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del producto"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <div className="flex gap-2">
            <input
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder="Cantidad"
              className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
              <CalendarClock size={13} />
              Fecha de vencimiento (opcional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-medium py-2 rounded-xl text-sm transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar producto'}
          </button>
        </form>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {[{ id: 'todas', label: 'Todas' }, ...CATEGORIES].map(c => (
          <button
            key={c.id}
            onClick={() => setFilterCat(c.id)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filterCat === c.id
                ? 'bg-cyan-500 text-white border-cyan-500'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Items list */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Refrigerator size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {filterCat === 'todas' ? 'La refri está vacía' : 'Sin productos en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(item => {
            const urgency = getUrgency(item.expiresAt)
            const cat = catInfo(item.category)
            const isUrgent = urgency === 'vencido' || urgency === 'critico'
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 bg-white rounded-2xl border px-4 py-3 ${
                  isUrgent ? 'border-red-200' : 'border-gray-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    {item.qty && (
                      <span className="text-xs text-gray-400">{item.qty} {item.unit}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                      {cat.label}
                    </span>
                    {urgencyBadge(urgency, item.expiresAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  title="Eliminar (ya se consumió)"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
