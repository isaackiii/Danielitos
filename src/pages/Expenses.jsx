import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp,
} from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2 } from 'lucide-react'
import { BURBUJAS, navColors } from '../lib/burbujasTheme'

const CATEGORIES = ['Comida', 'Servicios', 'Transporte', 'Salud', 'Entretenimiento', 'Ropa', 'Hogar', 'Otro']

const CAT_EMOJI = {
  Comida: '🍕',
  Servicios: '💡',
  Transporte: '🚗',
  Salud: '🏥',
  Entretenimiento: '🎬',
  Ropa: '👕',
  Hogar: '🏠',
  Otro: '📦',
}

const fmt = n => `$${Number(n).toFixed(2)}`

export default function Expenses() {
  const { householdId } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Comida')
  const [paidBy, setPaidBy] = useState('yo')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!householdId) return
    const q = query(
      collection(db, 'households', householdId, 'expenses'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap =>
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [householdId])

  const totalYo = expenses.filter(e => e.paidBy === 'yo').reduce((s, e) => s + e.amount, 0)
  const totalElla = expenses.filter(e => e.paidBy === 'ella').reduce((s, e) => s + e.amount, 0)
  const balance = totalYo - totalElla

  const handleAdd = async e => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!desc.trim() || isNaN(num) || num <= 0) return
    setAdding(true)
    await addDoc(collection(db, 'households', householdId, 'expenses'), {
      description: desc.trim(),
      amount: num,
      category,
      paidBy,
      createdAt: serverTimestamp(),
    })
    setDesc('')
    setAmount('')
    setCategory('Comida')
    setPaidBy('yo')
    setShowForm(false)
    setAdding(false)
  }

  const handleDelete = id =>
    deleteDoc(doc(db, 'households', householdId, 'expenses', id))

  return (
    <div style={{
      fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: navColors.fin,
            color: '#fff',
            borderRadius: '50%',
            padding: 8,
            border: `2.5px solid ${BURBUJAS.dark}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          <Plus size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{
          background: BURBUJAS.yellow,
          borderRadius: 20,
          padding: 12,
          textAlign: 'center',
          border: `2.5px solid ${BURBUJAS.dark}`,
          boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: BURBUJAS.dark }}>{fmt(totalYo + totalElla)}</div>
          <div style={{ fontSize: 11, color: BURBUJAS.dark, opacity: 0.6, marginTop: 4, fontWeight: 600 }}>Total</div>
        </div>
        <div style={{
          background: BURBUJAS.blue,
          borderRadius: 20,
          padding: 12,
          textAlign: 'center',
          border: `2.5px solid ${BURBUJAS.dark}`,
          boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
          color: '#fff',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(totalYo)}</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, fontWeight: 600 }}>Yo pagué</div>
        </div>
        <div style={{
          background: BURBUJAS.pink,
          borderRadius: 20,
          padding: 12,
          textAlign: 'center',
          border: `2.5px solid ${BURBUJAS.dark}`,
          boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
          color: '#fff',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(totalElla)}</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, fontWeight: 600 }}>Ella pagó</div>
        </div>
      </div>

      {balance !== 0 && (
        <div style={{
          borderRadius: 20,
          padding: 12,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 700,
          background: balance > 0 ? BURBUJAS.green : BURBUJAS.orange,
          color: '#fff',
          border: `2.5px solid ${BURBUJAS.dark}`,
          boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
        }}>
          {balance > 0 ? '📈' : '📉'}
          {balance > 0
            ? `Ella te debe ${fmt(Math.abs(balance) / 2)}`
            : `Tú le debes ${fmt(Math.abs(balance) / 2)}`}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} style={{
          background: '#fff',
          borderRadius: 20,
          border: `2.5px solid ${BURBUJAS.dark}`,
          padding: 16,
          marginBottom: 16,
          boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <input
            autoFocus
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Descripción (ej. Supermercado)"
            style={{
              width: '100%',
              border: `2.5px solid ${BURBUJAS.dark}`,
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 14,
              fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
              fontWeight: 600,
              outline: 'none',
            }}
          />
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Monto"
            min="0"
            step="0.01"
            style={{
              width: '100%',
              border: `2.5px solid ${BURBUJAS.dark}`,
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 14,
              fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
              fontWeight: 600,
              outline: 'none',
            }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              width: '100%',
              border: `2.5px solid ${BURBUJAS.dark}`,
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 14,
              fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
              fontWeight: 600,
              outline: 'none',
              background: '#fff',
              color: BURBUJAS.dark,
            }}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['yo', '🐻 Yo pagué', BURBUJAS.blue], ['ella', '🦊 Ella pagó', BURBUJAS.pink]].map(([val, label, color]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPaidBy(val)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  border: `2.5px solid ${BURBUJAS.dark}`,
                  background: paidBy === val ? color : '#fff',
                  color: paidBy === val ? '#fff' : BURBUJAS.dark,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                }}
                onMouseEnter={e => {
                  if (paidBy !== val) {
                    e.target.style.background = color;
                    e.target.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (paidBy !== val) {
                    e.target.style.background = '#fff';
                    e.target.style.color = BURBUJAS.dark;
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 14,
                color: BURBUJAS.dark,
                background: '#fff',
                border: `2.5px solid ${BURBUJAS.dark}`,
                cursor: 'pointer',
                fontWeight: 700,
                fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = BURBUJAS.yellow}
              onMouseLeave={e => e.target.style.background = '#fff'}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!desc.trim() || !amount || adding}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 14,
                background: navColors.fin,
                color: '#fff',
                border: `2.5px solid ${BURBUJAS.dark}`,
                cursor: !desc.trim() || !amount || adding ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                opacity: !desc.trim() || !amount || adding ? 0.5 : 1,
              }}
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          paddingTop: 64,
          paddingBottom: 64,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
          <p style={{ color: BURBUJAS.dark, opacity: 0.4, fontSize: 14 }}>Sin gastos registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expenses.map(e => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#fff',
                borderRadius: 20,
                border: `2.5px solid ${BURBUJAS.dark}`,
                padding: '12px 16px',
                boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e_el => {
                e_el.currentTarget.style.transform = 'translateY(-2px)';
                e_el.currentTarget.style.boxShadow = `3px 5px 0 ${BURBUJAS.dark}`;
              }}
              onMouseLeave={e_el => {
                e_el.currentTarget.style.transform = 'translateY(0)';
                e_el.currentTarget.style.boxShadow = `3px 3px 0 ${BURBUJAS.dark}`;
              }}
            >
              <div style={{
                flex: 1,
                minWidth: 0,
              }}>
                <div style={{ fontWeight: 600, color: BURBUJAS.dark, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {CAT_EMOJI[e.category] ?? '📦'} {e.description}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 999,
                    fontWeight: 800,
                    background: BURBUJAS.cream,
                    color: BURBUJAS.dark,
                    border: `2px solid ${BURBUJAS.dark}`,
                  }}>
                    {e.category}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: e.paidBy === 'yo' ? BURBUJAS.blue : BURBUJAS.pink,
                    fontWeight: 700,
                  }}>
                    {e.paidBy === 'yo' ? '🐻' : '🦊'}
                  </span>
                </div>
              </div>
              <span style={{ fontWeight: 800, color: BURBUJAS.dark, fontSize: 14 }}>{fmt(e.amount)}</span>
              <button
                onClick={() => handleDelete(e.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: BURBUJAS.dark,
                  cursor: 'pointer',
                  padding: 4,
                  opacity: 0.3,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.target.style.opacity = 1}
                onMouseLeave={e => e.target.style.opacity = 0.3}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
