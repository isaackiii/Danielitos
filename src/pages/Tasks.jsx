import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Check, Trash2 } from 'lucide-react'

const ASSIGNEES = [
  { value: 'yo', label: 'Yo', color: 'bg-blue-100 text-blue-700' },
  { value: 'ella', label: 'Ella', color: 'bg-pink-100 text-pink-700' },
  { value: 'ambos', label: 'Ambos', color: 'bg-violet-100 text-violet-700' },
]

const assigneeColor = v => ASSIGNEES.find(a => a.value === v)?.color ?? 'bg-gray-100 text-gray-500'
const assigneeLabel = v => ASSIGNEES.find(a => a.value === v)?.label ?? v

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
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900">Tareas</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-violet-600 text-white rounded-full p-2 hover:bg-violet-700 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-3">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="¿Qué hay que hacer?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <div className="flex gap-2">
            {ASSIGNEES.map(a => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAssignee(a.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  assignee === a.value ? a.color : 'bg-gray-100 text-gray-400'
                }`}
              >
                {a.label}
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
              disabled={!title.trim() || adding}
              className="flex-1 py-2 rounded-xl text-sm bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              Agregar
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        {[['pending', 'Pendientes'], ['done', 'Hechas'], ['all', 'Todas']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === val ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-300 text-sm">
          {filter === 'pending' ? '¡Sin tareas pendientes! 🎉' : 'No hay tareas aquí.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3"
            >
              <button
                onClick={() => toggleDone(task)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  task.done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-violet-400'
                }`}
              >
                {task.done && <Check size={12} strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                {task.title}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${assigneeColor(task.assignee)}`}>
                {assigneeLabel(task.assignee)}
              </span>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-gray-200 hover:text-red-400 transition-colors"
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
