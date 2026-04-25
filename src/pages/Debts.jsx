import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc,
} from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, Receipt, ChevronDown, ChevronUp, CheckCircle2, Circle, CreditCard } from 'lucide-react'
import { BURBUJAS, navColors, burbFontFamily } from '../lib/burbujasTheme'

const fmt = n => `$${Number(n).toFixed(2)}`
const uid = () => Math.random().toString(36).slice(2, 10)

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'nos_deben', label: 'Nos deben' },
  { key: 'debemos', label: 'Debemos' },
  { key: 'pagadas', label: 'Pagadas' },
]

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

export default function Debts() {
  const { householdId } = useAuth()
  const [deudas, setDeudas] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('todos')
  const [expanded, setExpanded] = useState(null)
  const [adding, setAdding] = useState(false)

  const [person, setPerson] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('debemos')

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

  function saldoPendiente(deuda) {
    const abonado = (deuda.abonos ?? []).reduce((s, a) => s + a.amount, 0)
    return Math.max(0, deuda.amount - abonado)
  }

  function totalAbonado(deuda) {
    return (deuda.abonos ?? []).reduce((s, a) => s + a.amount, 0)
  }

  const totalNosDebenActivo = deudas
    .filter(d => d.type === 'nos_deben' && !d.paid)
    .reduce((s, d) => s + saldoPendiente(d), 0)

  const totalDebemosActivo = deudas
    .filter(d => d.type === 'debemos' && !d.paid)
    .reduce((s, d) => s + saldoPendiente(d), 0)

  const filtered = deudas.filter(d => {
    if (filter === 'todos') return !d.paid
    if (filter === 'pagadas') return d.paid
    return d.type === filter && !d.paid
  })

  const handleAdd = async e => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!person.trim() || !description.trim() || isNaN(num) || num <= 0) return
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
      setPerson(''); setDescription(''); setAmount(''); setType('debemos'); setShowForm(false)
    } catch (err) {
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
    setAbonoAmount(''); setAbonoNote(''); setAbonoDeudaId(null)
  }

  const toggleExpand = id => {
    setExpanded(prev => (prev === id ? null : id))
    setAbonoDeudaId(null); setAbonoAmount(''); setAbonoNote('')
  }

  const balanceNeto = totalNosDebenActivo - totalDebemosActivo

  return (
    <div style={{ fontFamily: burbFontFamily, color: BURBUJAS.dark }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => { setShowForm(v => !v); setExpanded(null) }}
          style={{
            background: navColors.fin,
            color: '#fff',
            borderRadius: '50%',
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
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label={showForm ? 'Cerrar formulario' : 'Agregar deuda'}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{
          background: BURBUJAS.green, borderRadius: 20, padding: 12, textAlign: 'center',
          border: `2.5px solid ${BURBUJAS.dark}`, boxShadow: `2px 2px 0 ${BURBUJAS.dark}`, color: '#fff',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(totalNosDebenActivo)}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, fontWeight: 700 }}>Nos deben</div>
        </div>
        <div style={{
          background: BURBUJAS.orange, borderRadius: 20, padding: 12, textAlign: 'center',
          border: `2.5px solid ${BURBUJAS.dark}`, boxShadow: `2px 2px 0 ${BURBUJAS.dark}`, color: '#fff',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(totalDebemosActivo)}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, fontWeight: 700 }}>Debemos</div>
        </div>
        <div style={{
          background: balanceNeto >= 0 ? BURBUJAS.yellow : BURBUJAS.pink,
          borderRadius: 20, padding: 12, textAlign: 'center',
          border: `2.5px solid ${BURBUJAS.dark}`, boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
          color: balanceNeto >= 0 ? BURBUJAS.dark : '#fff',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(Math.abs(balanceNeto))}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, fontWeight: 700 }}>Balance</div>
        </div>
      </div>

      {/* Formulario nueva deuda */}
      {showForm && (
        <form onSubmit={handleAdd} style={{
          background: '#fff', borderRadius: 20, border: `2.5px solid ${BURBUJAS.dark}`,
          padding: 16, marginBottom: 16, boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <input autoFocus value={person} onChange={e => setPerson(e.target.value)}
            placeholder="Nombre (ej. Juan, Mamá...)" style={inputStyle} />
          <input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Concepto (ej. Préstamo de emergencia)" style={inputStyle} />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Monto original" min="0" step="0.01" style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[['debemos', '📉 Debemos', BURBUJAS.orange], ['nos_deben', '📈 Nos deben', BURBUJAS.green]].map(([val, label, color]) => (
              <button key={val} type="button" onClick={() => setType(val)}
                style={{
                  flex: 1, padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                  border: `2.5px solid ${BURBUJAS.dark}`,
                  background: type === val ? color : '#fff',
                  color: type === val ? '#fff' : BURBUJAS.dark,
                  cursor: 'pointer', fontFamily: burbFontFamily, transition: 'all 0.2s',
                }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setShowForm(false)}
              style={{
                flex: 1, padding: '8px 16px', borderRadius: 12, fontSize: 14, color: BURBUJAS.dark,
                background: '#fff', border: `2.5px solid ${BURBUJAS.dark}`, cursor: 'pointer',
                fontWeight: 700, fontFamily: burbFontFamily,
              }}>
              Cancelar
            </button>
            <button type="submit" disabled={!person.trim() || !description.trim() || !amount || adding}
              style={{
                flex: 1, padding: '8px 16px', borderRadius: 12, fontSize: 14, background: navColors.fin,
                color: '#fff', border: `2.5px solid ${BURBUJAS.dark}`,
                cursor: (!person.trim() || !description.trim() || !amount || adding) ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontFamily: burbFontFamily,
                opacity: (!person.trim() || !description.trim() || !amount || adding) ? 0.5 : 1,
              }}>
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              whiteSpace: 'nowrap', cursor: 'pointer',
              border: `2.5px solid ${BURBUJAS.dark}`,
              background: filter === f.key ? navColors.fin : '#fff',
              color: filter === f.key ? '#fff' : BURBUJAS.dark,
              fontFamily: burbFontFamily,
              boxShadow: filter === f.key ? `2px 2px 0 ${BURBUJAS.dark}` : 'none',
              transition: 'all 0.2s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 64 }}>
          <Receipt size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <p style={{ color: BURBUJAS.dark, opacity: 0.5, fontSize: 14, fontWeight: 600 }}>
            {filter === 'pagadas' ? 'Sin deudas pagadas.' : 'Sin deudas pendientes.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(deuda => {
            const saldo = saldoPendiente(deuda)
            const abonado = totalAbonado(deuda)
            const progreso = deuda.amount > 0 ? Math.min(100, (abonado / deuda.amount) * 100) : 0
            const isExpanded = expanded === deuda.id
            const tipoColor = deuda.type === 'nos_deben' ? BURBUJAS.green : BURBUJAS.orange

            return (
              <div key={deuda.id} style={{
                background: '#fff', borderRadius: 20,
                border: `2.5px solid ${BURBUJAS.dark}`,
                boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
                opacity: deuda.paid ? 0.55 : 1,
                transition: 'all 0.2s',
              }}>
                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                  <button onClick={() => handleTogglePaid(deuda)}
                    style={{
                      flexShrink: 0, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                      color: deuda.paid ? BURBUJAS.green : BURBUJAS.dark,
                      opacity: deuda.paid ? 1 : 0.3,
                      display: 'flex', alignItems: 'center',
                    }}>
                    {deuda.paid ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => toggleExpand(deuda.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{deuda.person}</span>
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 999, fontWeight: 800,
                        background: tipoColor, color: '#fff',
                        border: `2px solid ${BURBUJAS.dark}`,
                      }}>
                        {deuda.type === 'nos_deben' ? 'Nos debe' : 'Le debemos'}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, opacity: 0.6, fontWeight: 600,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2,
                    }}>
                      {deuda.description}
                    </div>
                    {!deuda.paid && abonado > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{
                          height: 6, background: BURBUJAS.line, borderRadius: 999, overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: `${progreso}%`, background: BURBUJAS.green,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, fontWeight: 600 }}>
                          Abonado {fmt(abonado)} de {fmt(deuda.amount)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{fmt(saldo)}</div>
                      {abonado > 0 && !deuda.paid && (
                        <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 700 }}>saldo</div>
                      )}
                    </div>
                    <button onClick={() => toggleExpand(deuda.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: BURBUJAS.dark, opacity: 0.5 }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => handleDelete(deuda.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: BURBUJAS.dark, opacity: 0.3 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.3}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Panel expandido */}
                {isExpanded && (
                  <div style={{
                    borderTop: `2px solid ${BURBUJAS.line}`,
                    padding: '12px 14px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    {(deuda.abonos ?? []).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.6, letterSpacing: 0.5 }}>ABONOS</div>
                        {deuda.abonos.map(a => (
                          <div key={a.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontSize: 12, background: BURBUJAS.cream, borderRadius: 12, padding: '8px 12px',
                            border: `2px solid ${BURBUJAS.dark}`, fontWeight: 700,
                          }}>
                            <span style={{ opacity: 0.6 }}>
                              {a.date ? new Date(a.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                            </span>
                            {a.note && <span style={{ flex: 1, margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}>{a.note}</span>}
                            <span style={{ color: BURBUJAS.greenDark, fontWeight: 800 }}>+{fmt(a.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!deuda.paid && saldo > 0 && (
                      abonoDeudaId === deuda.id ? (
                        <form onSubmit={handleAbono} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input autoFocus type="number" value={abonoAmount} onChange={e => setAbonoAmount(e.target.value)}
                            placeholder={`Monto (máx. ${fmt(saldo)})`} min="0.01" step="0.01" style={inputStyle} />
                          <input value={abonoNote} onChange={e => setAbonoNote(e.target.value)}
                            placeholder="Nota opcional" style={inputStyle} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" onClick={() => setAbonoDeudaId(null)}
                              style={{
                                flex: 1, padding: '6px 12px', borderRadius: 12, fontSize: 12, color: BURBUJAS.dark,
                                background: '#fff', border: `2.5px solid ${BURBUJAS.dark}`,
                                cursor: 'pointer', fontWeight: 700, fontFamily: burbFontFamily,
                              }}>
                              Cancelar
                            </button>
                            <button type="submit" disabled={!abonoAmount}
                              style={{
                                flex: 1, padding: '6px 12px', borderRadius: 12, fontSize: 12, background: BURBUJAS.green,
                                color: '#fff', border: `2.5px solid ${BURBUJAS.dark}`,
                                cursor: !abonoAmount ? 'not-allowed' : 'pointer',
                                fontWeight: 700, fontFamily: burbFontFamily, opacity: !abonoAmount ? 0.5 : 1,
                              }}>
                              Registrar abono
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => { setAbonoDeudaId(deuda.id); setAbonoAmount(''); setAbonoNote('') }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            borderRadius: 12, fontSize: 12, fontWeight: 800,
                            background: BURBUJAS.yellow, color: BURBUJAS.dark,
                            border: `2.5px solid ${BURBUJAS.dark}`,
                            boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
                            cursor: 'pointer', fontFamily: burbFontFamily, alignSelf: 'flex-start',
                          }}>
                          <CreditCard size={14} />
                          Registrar abono
                        </button>
                      )
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
