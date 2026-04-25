import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2 } from 'lucide-react'
import { BURBUJAS, navColors } from '../lib/burbujasTheme'
import BurbCheckbox from '../components/burbujas/BurbCheckbox'

const ASSIGNEES = [
  { value: 'yo', label: 'Yo', emoji: '🐻', color: BURBUJAS.blue },
  { value: 'ella', label: 'Ella', emoji: '🦊', color: BURBUJAS.pink },
  { value: 'ambos', label: 'Ambos', emoji: '💞', color: BURBUJAS.purple },
]

const getAssignee = v => ASSIGNEES.find(a => a.value === v) || ASSIGNEES[2]

export default function Tasks() {
  const { householdId } = useAuth()
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('pending')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('ambos')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!householdId) return
    const q = query(
      collection(db, 'households', householdId, 'tasks'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap =>
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [householdId])

  const filtered = tasks.filter(t =>
    filter === 'all' ? true : filter === 'pending' ? !t.done : t.done
  )

  const handleAdd = async e => {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    await addDoc(collection(db, 'households', householdId, 'tasks'), {
      title: title.trim(),
      assignee,
      done: false,
      createdAt: serverTimestamp(),
    })
    setTitle('')
    setAssignee('ambos')
    setShowForm(false)
    setAdding(false)
  }

  const toggleDone = task =>
    updateDoc(doc(db, 'households', householdId, 'tasks', task.id), { done: !task.done })

  const handleDelete = id =>
    deleteDoc(doc(db, 'households', householdId, 'tasks', id))

  return (
    <div style={{
      padding: 16,
      maxWidth: 896,
      margin: '0 auto',
      fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: BURBUJAS.dark }}>Tareas</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: navColors.task,
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
            fontWeight: 800,
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          <Plus size={20} />
        </button>
      </div>

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
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="¿Qué hay que hacer?"
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
          <div style={{ display: 'flex', gap: 8 }}>
            {ASSIGNEES.map(a => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAssignee(a.value)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  border: `2.5px solid ${BURBUJAS.dark}`,
                  background: assignee === a.value ? a.color : '#fff',
                  color: assignee === a.value ? '#fff' : BURBUJAS.dark,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                }}
                onMouseEnter={e => {
                  if (assignee !== a.value) {
                    e.target.style.background = a.color;
                    e.target.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (assignee !== a.value) {
                    e.target.style.background = '#fff';
                    e.target.style.color = BURBUJAS.dark;
                  }
                }}
              >
                {a.emoji} {a.label}
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
              disabled={!title.trim() || adding}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 14,
                background: navColors.task,
                color: '#fff',
                border: `2.5px solid ${BURBUJAS.dark}`,
                cursor: !title.trim() || adding ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                opacity: !title.trim() || adding ? 0.5 : 1,
              }}
            >
              Agregar
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['pending', 'Pendientes'], ['done', 'Hechas'], ['all', 'Todas']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              background: filter === val ? navColors.task : '#fff',
              color: filter === val ? '#fff' : BURBUJAS.dark,
              border: `2.5px solid ${BURBUJAS.dark}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
            }}
            onMouseEnter={e => {
              if (filter !== val) {
                e.target.style.background = navColors.task;
                e.target.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              if (filter !== val) {
                e.target.style.background = '#fff';
                e.target.style.color = BURBUJAS.dark;
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          paddingTop: 64,
          paddingBottom: 64,
          color: BURBUJAS.dark,
          opacity: 0.4,
          fontSize: 14,
        }}>
          {filter === 'pending' ? '¡Sin tareas pendientes! 🎉' : 'No hay tareas aquí.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(task => {
            const assigneeData = getAssignee(task.assignee)
            return (
              <div
                key={task.id}
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
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `3px 5px 0 ${BURBUJAS.dark}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `3px 3px 0 ${BURBUJAS.dark}`;
                }}
              >
                <BurbCheckbox
                  checked={task.done}
                  color={assigneeData.color}
                  onChange={() => toggleDone(task)}
                />
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  color: BURBUJAS.dark,
                  textDecoration: task.done ? 'line-through' : 'none',
                  opacity: task.done ? 0.5 : 1,
                  fontWeight: task.done ? 400 : 500,
                }}>
                  {task.title}
                </span>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  background: assigneeData.color,
                  color: '#fff',
                  border: `2px solid ${BURBUJAS.dark}`,
                }}>
                  {assigneeData.emoji} {assigneeData.label}
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
