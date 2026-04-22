import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc,
} from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, Receipt, ChevronDown, ChevronUp, CheckCircle2, Circle, CreditCard } from 'lucide-react'

const fmt = n => `$${Number(n).toFixed(2)}`
const uid = () => Math.random().toString(36).slice(2, 10)

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'nos_deben', label: 'Nos deben' },
  { key: 'debemos', label: 'Debemos' },
  { key: 'pagadas', label: 'Pagadas' },
]

export default function Debts() {
  const { householdId } = useAuth()
  const [deudas, setDeudas] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('todos')
  const [expanded, setExpanded] = useState(null)
  const [adding, setAdding] = useState(false)

  // form nueva deuda
  const [person, setPerson] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('debemos')

  // form abono
  const [abonoDeudaId, setAbonoDeudaId] = useState(null)
  const [abonoAmount, setAbonoAmount] = useState('')
  const [abonoNote, setAbonoNote] = useState('')

  useEffect(() => {
    if (!householdId) return
    const q = query(
      collection(db, 'households', householdId, 'deudas'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap =>
      setDeudas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [householdId])

  const totalNosDebenActivo = deudas
    .filter(d => d.type === 'nos_deben' && !d.paid)
    .reduce((s, d) => s + saldoPendiente(d), 0)

  const totalDebemosActivo = deudas
    .filter(d => d.type === 'debemos' && !d.paid)
    .reduce((s, d) => s + saldoPendiente(d), 0)

  function saldoPendiente(deuda) {
    const abonado = (deuda.abonos ?? []).reduce((s, a) => s + a.amount, 0)
    return Math.max(0, deuda.amount - abonado)
  }

  function totalAbonado(deuda) {
    return (deuda.abonos ?? []).reduce((s, a) => s + a.amount, 0)
  }

  const filtered = deudas.filter(d => {
    if (filter === 'todos') return !d.paid
    if (filter === 'pagadas') return d.paid
    return d.type === filter && !d.paid
  })

  const handleAdd = async e => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!person.trim() || !description.trim() || isNaN(num) || num <= 0) {
      console.warn('[Deudas] Validación falló', { person, description, amount, num, householdId })
      return
    }
    if (!householdId) {
      alert('No hay hogar configurado. Recarga la página o vuelve a iniciar sesión.')
      return
    }
    setAdding(true)
    try {
      await addDoc(collection(db, 'households', householdId, 'deudas'), {
        person: person.trim(),
        description: description.trim(),
        amount: num,
        type,
        abonos: [],
        paid: false,
        createdAt: serverTimestamp(),
      })
      setPerson('')
      setDescription('')
      setAmount('')
      setType('debemos')
      setShowForm(false)
    } catch (err) {
      console.error('[Deudas] Error al guardar:', err)
      alert('Error al guardar: ' + (err?.message ?? err))
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = id =>
    deleteDoc(doc(db, 'households', householdId, 'deudas', id))

  const handleTogglePaid = async deuda => {
    await updateDoc(doc(db, 'households', householdId, 'deudas', deuda.id), {
      paid: !deuda.paid,
    })
  }

  const handleAbono = async e => {
    e.preventDefault()
    const num = parseFloat(abonoAmount)
    if (isNaN(num) || num <= 0 || !abonoDeudaId) return
    const deuda = deudas.find(d => d.id === abonoDeudaId)
    if (!deuda) return
    const saldo = saldoPendiente(deuda)
    const nuevoAbono = { id: uid(), amount: Math.min(num, saldo), note: abonoNote.trim(), date: new Date().toISOString() }
    const nuevosAbonos = [...(deuda.abonos ?? []), nuevoAbono]
    const nuevoPaid = nuevosAbonos.reduce((s, a) => s + a.amount, 0) >= deuda.amount
    await updateDoc(doc(db, 'households', householdId, 'deudas', abonoDeudaId), {
      abonos: nuevosAbonos,
      paid: nuevoPaid,
    })
    setAbonoAmount('')
    setAbonoNote('')
    setAbonoDeudaId(null)
  }

  const toggleExpand = id => {
    setExpanded(prev => (prev === id ? null : id))
    setAbonoDeudaId(null)
    setAbonoAmount('')
    setAbonoNote('')
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => { setShowForm(v => !v); setExpanded(null) }}
          className="bg-orange-500 text-white rounded-full p-2 hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-100">
          <div className="text-base font-bold text-emerald-700">{fmt(totalNosDebenActivo)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Nos deben</div>
        </div>
        <div className="bg-red-50 rounded-2xl p-3 text-center border border-red-100">
          <div className="text-base font-bold text-red-600">{fmt(totalDebemosActivo)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Debemos</div>
        </div>
        <div className={`rounded-2xl p-3 text-center border ${
          totalNosDebenActivo >= totalDebemosActivo
            ? 'bg-emerald-50 border-emerald-100'
            : 'bg-red-50 border-red-100'
        }`}>
          <div className={`text-base font-bold ${
            totalNosDebenActivo >= totalDebemosActivo ? 'text-emerald-700' : 'text-red-600'
          }`}>
            {fmt(Math.abs(totalNosDebenActivo - totalDebemosActivo))}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Balance</div>
        </div>
      </div>

      {/* Formulario nueva deuda */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-3">
          <input
            autoFocus
            value={person}
            onChange={e => setPerson(e.target.value)}
            placeholder="Nombre (ej. Juan, Mamá...)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Concepto (ej. Préstamo de emergencia)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Monto original"
            min="0"
            step="0.01"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="flex gap-2">
            {[['debemos', 'Nosotros debemos', 'bg-red-100 text-red-600'], ['nos_deben', 'Nos deben a nosotros', 'bg-emerald-100 text-emerald-700']].map(([val, label, active]) => (
              <button
                key={val}
                type="button"
                onClick={() => setType(val)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  type === val ? active : 'bg-gray-100 text-gray-400'
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
              disabled={!person.trim() || !description.trim() || !amount || adding}
              className="flex-1 py-2 rounded-xl text-sm bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Receipt size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-300 text-sm">
            {filter === 'pagadas' ? 'Sin deudas pagadas.' : 'Sin deudas pendientes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(deuda => {
            const saldo = saldoPendiente(deuda)
            const abonado = totalAbonado(deuda)
            const progreso = deuda.amount > 0 ? Math.min(100, (abonado / deuda.amount) * 100) : 0
            const isExpanded = expanded === deuda.id

            return (
              <div key={deuda.id} className={`bg-white rounded-2xl border transition-all ${
                deuda.paid ? 'border-gray-100 opacity-60' : 'border-gray-100'
              }`}>
                {/* Cabecera de la deuda */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => handleTogglePaid(deuda)}
                    className={`flex-shrink-0 transition-colors ${deuda.paid ? 'text-emerald-500' : 'text-gray-200 hover:text-orange-400'}`}
                  >
                    {deuda.paid ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>

                  <div className="flex-1 min-w-0" onClick={() => toggleExpand(deuda.id)} style={{cursor:'pointer'}}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{deuda.person}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        deuda.type === 'nos_deben'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {deuda.type === 'nos_deben' ? 'Nos debe' : 'Le debemos'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{deuda.description}</div>
                    {!deuda.paid && abonado > 0 && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-400 rounded-full transition-all"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Abonado {fmt(abonado)} de {fmt(deuda.amount)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 text-sm">{fmt(saldo)}</div>
                      {abonado > 0 && !deuda.paid && (
                        <div className="text-xs text-gray-400">saldo</div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleExpand(deuda.id)}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(deuda.id)}
                      className="text-gray-200 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Panel expandido: abonos */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                    {/* Historial de abonos */}
                    {(deuda.abonos ?? []).length > 0 && (
                      <div className="space-y-1 mb-2">
                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Abonos</div>
                        {deuda.abonos.map(a => (
                          <div key={a.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                            <span className="text-gray-400">{a.date ? new Date(a.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}</span>
                            {a.note && <span className="flex-1 mx-2 truncate text-gray-500">{a.note}</span>}
                            <span className="font-medium text-emerald-600">+{fmt(a.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario nuevo abono */}
                    {!deuda.paid && saldo > 0 && (
                      <>
                        {abonoDeudaId === deuda.id ? (
                          <form onSubmit={handleAbono} className="space-y-2">
                            <input
                              autoFocus
                              type="number"
                              value={abonoAmount}
                              onChange={e => setAbonoAmount(e.target.value)}
                              placeholder={`Monto (máx. ${fmt(saldo)})`}
                              min="0.01"
                              step="0.01"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                            <input
                              value={abonoNote}
                              onChange={e => setAbonoNote(e.target.value)}
                              placeholder="Nota opcional"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setAbonoDeudaId(null)}
                                className="flex-1 py-1.5 rounded-xl text-xs text-gray-500 border border-gray-200 hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={!abonoAmount}
                                className="flex-1 py-1.5 rounded-xl text-xs bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
                              >
                                Registrar abono
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => { setAbonoDeudaId(deuda.id); setAbonoAmount(''); setAbonoNote('') }}
                            className="flex items-center gap-2 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                          >
                            <CreditCard size={14} />
                            Registrar abono
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
