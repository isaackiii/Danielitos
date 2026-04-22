import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Check, Trash2, ChevronLeft, ShoppingBasket } from 'lucide-react'

export default function Shopping() {
  const { householdId } = useAuth()
  const [lists, setLists] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [showNewList, setShowNewList] = useState(false)
  const [listName, setListName] = useState('')
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    if (!householdId) return
    const q = query(
      collection(db, 'households', householdId, 'shoppingLists'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap =>
      setLists(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [householdId])

  const current = lists.find(l => l.id === activeId)
  const listRef = id => doc(db, 'households', householdId, 'shoppingLists', id)

  const createList = async e => {
    e.preventDefault()
    if (!listName.trim()) return
    const ref = await addDoc(collection(db, 'households', householdId, 'shoppingLists'), {
      name: listName.trim(),
      items: [],
      createdAt: serverTimestamp(),
    })
    setListName('')
    setShowNewList(false)
    setActiveId(ref.id)
  }

  const addItem = async e => {
    e.preventDefault()
    if (!newItem.trim() || !current) return
    await updateDoc(listRef(activeId), {
      items: [...(current.items || []), { id: Date.now().toString(), name: newItem.trim(), done: false }],
    })
    setNewItem('')
  }

  const toggleItem = async itemId => {
    await updateDoc(listRef(activeId), {
      items: current.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i),
    })
  }

  const deleteItem = async itemId => {
    await updateDoc(listRef(activeId), {
      items: current.items.filter(i => i.id !== itemId),
    })
  }

  const deleteList = async id => {
    await deleteDoc(listRef(id))
    if (activeId === id) setActiveId(null)
  }

  if (activeId && current) {
    const pending = current.items?.filter(i => !i.done) ?? []
    const done = current.items?.filter(i => i.done) ?? []

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 pt-4 mb-4">
          <button onClick={() => setActiveId(null)} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 flex-1">{current.name}</h2>
          <button onClick={() => deleteList(activeId)} className="text-gray-200 hover:text-red-400 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>

        <form onSubmit={addItem} className="flex gap-2 mb-4">
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="Agregar ítem..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={!newItem.trim()}
            className="bg-amber-500 text-white rounded-xl px-4 hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            <Plus size={18} />
          </button>
        </form>

        {pending.length === 0 && done.length === 0 && (
          <p className="text-center py-12 text-gray-300 text-sm">Lista vacía. Agrega ítems arriba.</p>
        )}

        <div className="space-y-2">
          {pending.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <button
                onClick={() => toggleItem(item.id)}
                className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 hover:border-amber-400 transition-colors"
              />
              <span className="flex-1 text-sm text-gray-800">{item.name}</span>
              <button onClick={() => deleteItem(item.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {done.length > 0 && (
            <>
              <p className="text-xs text-gray-300 font-medium pt-3 pb-1 px-1">En el carrito</p>
              {done.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3 opacity-60">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-amber-400 bg-amber-400 flex items-center justify-center text-white"
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
                  <button onClick={() => deleteItem(item.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900">Compras</h2>
        <button
          onClick={() => setShowNewList(v => !v)}
          className="bg-amber-500 text-white rounded-full p-2 hover:bg-amber-600 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {showNewList && (
        <form onSubmit={createList} className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-3">
          <input
            autoFocus
            value={listName}
            onChange={e => setListName(e.target.value)}
            placeholder="Nombre de la lista (ej. Supermercado)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNewList(false)}
              className="flex-1 py-2 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!listName.trim()}
              className="flex-1 py-2 rounded-xl text-sm bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50"
            >
              Crear
            </button>
          </div>
        </form>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBasket size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-300 text-sm">Sin listas. Crea una con el botón +</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map(list => {
            const total = list.items?.length ?? 0
            const done = list.items?.filter(i => i.done).length ?? 0
            return (
              <button
                key={list.id}
                onClick={() => setActiveId(list.id)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-4 py-4 hover:border-gray-200 transition-colors text-left"
              >
                <div className="bg-amber-50 rounded-xl p-2">
                  <ShoppingBasket size={20} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{list.name}</div>
                  <div className="text-xs text-gray-400">{done}/{total} ítems</div>
                </div>
                {total > 0 && (
                  <div className="w-14 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${(done / total) * 100}%` }}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
