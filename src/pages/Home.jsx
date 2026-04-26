import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { BURBUJAS, burbFontFamily } from '../lib/burbujasTheme'
import BurbCard from '../components/burbujas/BurbCard'
import BurbPill from '../components/burbujas/BurbPill'
import BurbCheckbox from '../components/burbujas/BurbCheckbox'
import BurbAvatar from '../components/burbujas/BurbAvatar'
import BurbProgressBar from '../components/burbujas/BurbProgressBar'

const whoColor = w => w === 'yo' ? BURBUJAS.green : w === 'ella' ? BURBUJAS.pink : BURBUJAS.purple
const whoEmoji = w => w === 'yo' ? '🐻' : w === 'ella' ? '🦊' : '💞'

function Blob({ color, size, x, y }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, zIndex: 0,
      width: size, height: size, borderRadius: '50%',
      background: color, opacity: 0.32, filter: 'blur(30px)',
      pointerEvents: 'none',
    }} />
  )
}

export default function Home() {
  const { householdId } = useAuth()
  const nav = useNavigate()
  const [tasks, setTasks] = useState([])
  const [lists, setLists] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    if (!householdId) return
    const unsubT = onSnapshot(
      query(collection(db, 'households', householdId, 'tasks'), orderBy('createdAt', 'desc')),
      snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const unsubL = onSnapshot(
      collection(db, 'households', householdId, 'shoppingLists'),
      snap => setLists(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const unsubE = onSnapshot(
      collection(db, 'households', householdId, 'expenses'),
      snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { unsubT(); unsubL(); unsubE() }
  }, [householdId])

  const pendingTasks = tasks.filter(t => !t.done)
  const todayTasks = pendingTasks.slice(0, 3)
  const pendingCount = pendingTasks.length

  const activeList = lists[0]
  const listItems = activeList?.items || []
  const listDone = listItems.filter(i => i.done).length
  const listTotal = listItems.length
  const listPct = listTotal > 0 ? Math.round((listDone / listTotal) * 100) : 0

  const totalYo = expenses.filter(e => e.paidBy === 'yo').reduce((s, e) => s + (e.amount || 0), 0)
  const totalElla = expenses.filter(e => e.paidBy === 'ella').reduce((s, e) => s + (e.amount || 0), 0)
  const balance = Math.abs((totalYo - totalElla) / 2)
  const sheOwes = totalYo > totalElla
  const balanceInt = Math.floor(balance)
  const balanceCents = Math.round((balance - balanceInt) * 100).toString().padStart(2, '0')

  const streak = 12

  const toggleTask = task =>
    updateDoc(doc(db, 'households', householdId, 'tasks', task.id), { done: !task.done })

  return (
    <div style={{
      padding: '16px 16px 24px',
      maxWidth: 896,
      margin: '0 auto',
      fontFamily: burbFontFamily,
      color: BURBUJAS.dark,
      fontWeight: 700,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Blob color={BURBUJAS.pink} size={180} x={-60} y={60} />
      <Blob color={BURBUJAS.blue} size={150} x={'60%'} y={260} />

      {/* Header: greeting + avatares */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 2, paddingTop: 8,
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
          ¡Hola, mi amor!
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BurbAvatar emoji="🦊" bg={BURBUJAS.pink} size={32} offset={2} />
          <div style={{ marginLeft: -10, zIndex: 1 }}>
            <BurbAvatar emoji="🐻" bg={BURBUJAS.green} size={32} offset={2} />
          </div>
        </div>
      </div>

      {/* Racha del hogar */}
      <BurbCard color={BURBUJAS.yellow} offset={3} style={{
        marginTop: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontSize: 26 }}>🔥</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.7, letterSpacing: 0.5 }}>RACHA DEL HOGAR</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{streak} días 💪</div>
        </div>
        <BurbPill bg={BURBUJAS.dark}>¡sigan!</BurbPill>
      </BurbCard>

      {/* Nos toca hoy */}
      <BurbCard color="#fff" offset={4} style={{
        marginTop: 10, padding: 12, position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 8, gap: 8,
        }}>
          <div style={{ fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap' }}>Nos toca hoy</div>
          <BurbPill bg={BURBUJAS.green}>{pendingCount}</BurbPill>
        </div>
        {todayTasks.length === 0 && (
          <div style={{ padding: '8px 0', fontSize: 13, opacity: 0.5 }}>
            ¡Todo listo por hoy! 🎉
          </div>
        )}
        {todayTasks.map(t => {
          const c = whoColor(t.assignee)
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderTop: `1.5px solid ${BURBUJAS.line}`,
            }}>
              <BurbCheckbox checked={t.done} color={c} size={20} onChange={() => toggleTask(t)} />
              <span style={{
                flex: 1, fontSize: 13.5, fontWeight: 700,
                textDecoration: t.done ? 'line-through' : 'none',
                opacity: t.done ? 0.4 : 1,
              }}>{t.title}</span>
              <span style={{ fontSize: 14 }}>{whoEmoji(t.assignee)}</span>
            </div>
          )
        })}
        <div
          onClick={() => nav('/tareas')}
          style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: BURBUJAS.purple, cursor: 'pointer' }}
        >
          ver todas →
        </div>
      </BurbCard>

      {/* Duo: lista activa + te debe */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        marginTop: 10, position: 'relative', zIndex: 1,
      }}>
        <BurbCard
          color={BURBUJAS.pink}
          offset={3}
          onClick={() => nav('/compras')}
          style={{ padding: 12, color: '#fff' }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.9, letterSpacing: 0.5 }}>LISTA ACTIVA</div>
          <div style={{ fontSize: 13, fontWeight: 900, marginTop: 2, lineHeight: 1.15 }}>
            {activeList ? `${activeList.icon || '🛒'} ${activeList.name}` : '🛒 Sin lista'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{listPct}%</div>
          <div style={{ marginTop: 5 }}>
            <BurbProgressBar value={listDone} total={Math.max(listTotal, 1)} color="#fff" height={7} />
          </div>
        </BurbCard>
        <BurbCard
          color={BURBUJAS.purple}
          offset={3}
          onClick={() => nav('/finanzas')}
          style={{ padding: 12, color: '#fff' }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.9, letterSpacing: 0.5 }}>
            {sheOwes ? '🦊 TE DEBE' : '🐻 LE DEBES'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, marginTop: 6 }}>
            ${balanceInt}
            <span style={{ fontSize: 13, opacity: 0.75 }}>.{balanceCents}</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 8, opacity: 0.9 }}>este mes</div>
        </BurbCard>
      </div>

    </div>
  )
}
