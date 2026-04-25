import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, CalendarClock, AlertTriangle, X, Refrigerator } from 'lucide-react'
import { BURBUJAS, navColors, burbFontFamily } from '../lib/burbujasTheme'

const CATEGORIES = [
  { id: 'lacteos',     label: 'Lácteos',     emoji: '🥛', color: BURBUJAS.blue },
  { id: 'carnes',      label: 'Carnes',      emoji: '🥩', color: BURBUJAS.pink },
  { id: 'verduras',    label: 'Verduras',    emoji: '🥬', color: BURBUJAS.green },
  { id: 'frutas',      label: 'Frutas',      emoji: '🍎', color: BURBUJAS.orange },
  { id: 'bebidas',     label: 'Bebidas',     emoji: '🥤', color: BURBUJAS.purple },
  { id: 'condimentos', label: 'Condimentos', emoji: '🧂', color: BURBUJAS.yellow },
  { id: 'otros',       label: 'Otros',       emoji: '📦', color: BURBUJAS.darkSoft },
]

const UNITS = ['unidades', 'kg', 'g', 'L', 'ml', 'porciones']

const inputStyle = {
  width: '100%',
  border: `2.5px solid ${BURBUJAS.dark}`,
  borderRadius: 12,
  padding: '8px 12px',
  fontSize: 14,
  fontFamily: burbFontFamily,
  fontWeight: 600,
  outline: 'none',
  background: '#fff',
  color: BURBUJAS.dark,
  boxSizing: 'border-box',
}

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

function UrgencyBadge({ urgency, expiresAt }) {
  if (!urgency) return null
  const date = new Date(expiresAt + 'T00:00:00')
  const label = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const colors = {
    vencido: { bg: BURBUJAS.pink, fg: '#fff' },
    critico: { bg: BURBUJAS.orange, fg: '#fff' },
    pronto:  { bg: BURBUJAS.yellow, fg: BURBUJAS.dark },
    ok:      { bg: BURBUJAS.green, fg: '#fff' },
  }
  const c = colors[urgency]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, padding: '3px 8px', borderRadius: 999, fontWeight: 800,
      background: c.bg, color: c.fg,
      border: `2px solid ${BURBUJAS.dark}`,
    }}>
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
  const [error, setError] = useState('')

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

  const urgentItems = useMemo(
    () => items.filter(i => ['vencido', 'critico'].includes(getUrgency(i.expiresAt))),
    [items]
  )

  const resetForm = () => {
    setName(''); setQty(''); setUnit('unidades'); setCategory('otros'); setExpiresAt('')
    setError('')
    setShowForm(false)
  }

  const handleAdd = async e => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await addDoc(collection(db, 'households', householdId, 'fridge'), {
        name: name.trim(),
        qty: qty.trim(),
        unit,
        category,
        expiresAt: expiresAt || null,
        createdAt: serverTimestamp(),
      })
      resetForm()
    } catch (err) {
      setError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id, name) => {
    if (!window.confirm(`¿Eliminar "${name}" de la refri?`)) return
    deleteDoc(doc(db, 'households', householdId, 'fridge', id))
  }

  const setExpiresInDays = days => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setExpiresAt(d.toISOString().slice(0, 10))
  }

  const catInfo = id => CATEGORIES.find(c => c.id === id) ?? CATEGORIES.at(-1)

  return (
    <div style={{
      padding: '16px 16px 24px',
      maxWidth: 896,
      margin: '0 auto',
      fontFamily: burbFontFamily,
      color: BURBUJAS.dark,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 20, gap: 12, paddingTop: 8,
      }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8,
            margin: 0, lineHeight: 1.1,
          }}>
            🧊 La refri
          </h1>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4, fontWeight: 600 }}>
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
            {expiringSoon > 0 && (
              <span style={{ marginLeft: 8, color: BURBUJAS.orange, fontWeight: 800 }}>
                · {expiringSoon} {expiringSoon === 1 ? 'próximo a vencer' : 'próximos a vencer'}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: navColors.refri, color: '#fff', fontSize: 13, fontWeight: 800,
            padding: '8px 14px', borderRadius: 14,
            border: `2.5px solid ${BURBUJAS.dark}`,
            boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
            cursor: 'pointer', fontFamily: burbFontFamily,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} style={{
          background: '#fff', borderRadius: 20,
          border: `2.5px solid ${BURBUJAS.dark}`,
          padding: 16, marginBottom: 16,
          boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>Nuevo producto</span>
            <button type="button" onClick={resetForm} aria-label="Cerrar"
              style={{
                background: '#fff', border: `2px solid ${BURBUJAS.dark}`, cursor: 'pointer',
                color: BURBUJAS.dark, padding: 4, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <X size={14} />
            </button>
          </div>

          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder="Nombre del producto" style={inputStyle} />

          <div style={{ display: 'flex', gap: 8 }}>
            <input value={qty} onChange={e => setQty(e.target.value)}
              inputMode="decimal"
              placeholder="Cantidad" style={{ ...inputStyle, width: 96, flex: 'none' }} />
            <select value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>

          <div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, opacity: 0.6, marginBottom: 6, fontWeight: 700,
            }}>
              <CalendarClock size={13} />
              Fecha de vencimiento (opcional)
            </label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Hoy', days: 0 },
                { label: '+3 días', days: 3 },
                { label: '+1 semana', days: 7 },
                { label: '+2 semanas', days: 14 },
              ].map(s => (
                <button key={s.label} type="button" onClick={() => setExpiresInDays(s.days)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                    border: `2px solid ${BURBUJAS.dark}`, background: '#fff', color: BURBUJAS.dark,
                    cursor: 'pointer', fontFamily: burbFontFamily,
                  }}>
                  {s.label}
                </button>
              ))}
              {expiresAt && (
                <button type="button" onClick={() => setExpiresAt('')}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                    border: `2px solid ${BURBUJAS.dark}`, background: BURBUJAS.cream, color: BURBUJAS.dark,
                    cursor: 'pointer', fontFamily: burbFontFamily,
                  }}>
                  Quitar fecha
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 12,
              background: BURBUJAS.pink, color: '#fff',
              border: `2px solid ${BURBUJAS.dark}`,
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving || !name.trim()}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 14, fontSize: 14,
              background: navColors.refri, color: '#fff',
              border: `2.5px solid ${BURBUJAS.dark}`,
              boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
              cursor: (saving || !name.trim()) ? 'not-allowed' : 'pointer',
              fontWeight: 800, fontFamily: burbFontFamily,
              opacity: (saving || !name.trim()) ? 0.5 : 1,
            }}>
            {saving ? 'Guardando…' : 'Guardar producto'}
          </button>
        </form>
      )}

      {/* Urgent banner */}
      {urgentItems.length > 0 && filterCat === 'todas' && !showForm && (
        <div style={{
          background: BURBUJAS.pink, color: '#fff',
          border: `2.5px solid ${BURBUJAS.dark}`, borderRadius: 16,
          boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
          padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>
            {urgentItems.length === 1
              ? `1 producto urgente: ${urgentItems[0].name}`
              : `${urgentItems.length} productos vencidos o por vencer`}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
        {[{ id: 'todas', label: 'Todas', emoji: '🍱' }, ...CATEGORIES].map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)}
            style={{
              flexShrink: 0, fontSize: 12, fontWeight: 700,
              padding: '6px 12px', borderRadius: 999,
              border: `2.5px solid ${BURBUJAS.dark}`,
              background: filterCat === c.id ? navColors.refri : '#fff',
              color: filterCat === c.id ? '#fff' : BURBUJAS.dark,
              cursor: 'pointer', fontFamily: burbFontFamily,
              boxShadow: filterCat === c.id ? `2px 2px 0 ${BURBUJAS.dark}` : 'none',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Items list */}
      {displayed.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 64 }}>
          <Refrigerator size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, opacity: 0.5, fontWeight: 600 }}>
            {filterCat === 'todas' ? 'La refri está vacía' : 'Sin productos en esta categoría'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map(item => {
            const urgency = getUrgency(item.expiresAt)
            const cat = catInfo(item.category)
            const isUrgent = urgency === 'vencido' || urgency === 'critico'
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff', borderRadius: 20,
                border: `2.5px solid ${isUrgent ? BURBUJAS.pink : BURBUJAS.dark}`,
                boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
                padding: '12px 14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `3px 5px 0 ${BURBUJAS.dark}`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = `3px 3px 0 ${BURBUJAS.dark}`
              }}>
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  borderRadius: 12, background: cat.color,
                  border: `2px solid ${BURBUJAS.dark}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {cat.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{item.name}</span>
                    {item.qty && (
                      <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>{item.qty} {item.unit}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 999,
                      fontWeight: 800, background: BURBUJAS.cream, color: BURBUJAS.dark,
                      border: `2px solid ${BURBUJAS.dark}`,
                    }}>
                      {cat.label}
                    </span>
                    <UrgencyBadge urgency={urgency} expiresAt={item.expiresAt} />
                  </div>
                </div>
                <button onClick={() => handleDelete(item.id, item.name)}
                  aria-label={`Eliminar ${item.name}`}
                  style={{
                    background: '#fff', border: `2px solid ${BURBUJAS.dark}`, padding: 6,
                    color: BURBUJAS.dark, cursor: 'pointer', flexShrink: 0,
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = BURBUJAS.pink; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = BURBUJAS.dark }}
                  title="Eliminar (ya se consumió)">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
