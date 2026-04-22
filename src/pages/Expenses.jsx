import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp,
} from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const CATEGORIES = ['Comida', 'Servicios', 'Transporte', 'Salud', 'Entretenimiento', 'Ropa', 'Hogar', 'Otro']

const CAT_COLOR = {
  Comida: 'bg-orange-100 text-orange-700',
  Servicios: 'bg-blue-100 text-blue-700',
  Transporte: 'bg-cyan-100 text-cyan-700',
  Salud: 'bg-red-100 text-red-700',
  Entretenimiento: 'bg-purple-100 text-purple-700',
  Ropa: 'bg-pink-100 text-pink-700',
  Hogar: 'bg-green-100 text-green-700',
  Otro: 'bg-gray-100 text-gray-600',
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
    <div>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-green-600 text-white rounded-full p-2 hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
          <div className="text-base font-bold text-gray-900">{fmt(totalYo + totalElla)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total</div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-100">
          <div className="text-base font-bold text-blue-700">{fmt(totalYo)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Yo</div>
        </div>
        <div className="bg-pink-50 rounded-2xl p-3 text-center border border-pink-100">
          <div className="text-base font-bold text-pink-600">{fmt(totalElla)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Ella</div>
        </div>
      </div>

      {balance !== 0 && (
        <div className={`rounded-2xl p-3.5 mb-4 flex items-center gap-2 text-sm font-medium ${
          balance > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'
        }`}>
          {balance > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {balance > 0
            ? `Ella te debe ${fmt(balance / 2)}`
            : `Tú le debes ${fmt(Math.abs(balance) / 2)}`}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-3">
          <input
            autoFocus
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Descripción (ej. Supermercado)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Monto"
            min="0"
            step="0.01"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            {[['yo', 'Yo pagué', 'bg-blue-100 text-blue-700'], ['ella', 'Ella pagó', 'bg-pink-100 text-pink-600']].map(([val, label, active]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPaidBy(val)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  paidBy === val ? active : 'bg-gray-100 text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!desc.trim() || !amount || adding}
              className="flex-1 py-2 rounded-xl text-sm bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-16">
          <Wallet size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-300 text-sm">Sin gastos registrados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => (
            <div key={e.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{e.description}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[e.category] ?? CAT_COLOR.Otro}`}>
                    {e.category}
                  </span>
                  <span className={`text-xs ${e.paidBy === 'yo' ? 'text-blue-600' : 'text-pink-500'}`}>
                    {e.paidBy === 'yo' ? 'Yo' : 'Ella'}
                  </span>
                </div>
              </div>
              <span className="font-semibold text-gray-900 text-sm">{fmt(e.amount)}</span>
              <button onClick={() => handleDelete(e.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
