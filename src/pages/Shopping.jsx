import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from '../lib/fsApi'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, ChevronLeft, ShoppingBasket } from 'lucide-react'
import { BURBUJAS, navColors } from '../lib/burbujasTheme'
import BurbCheckbox from '../components/burbujas/BurbCheckbox'

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
      <div style={{
        padding: 16,
        maxWidth: 896,
        margin: '0 auto',
        fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, marginBottom: 16 }}>
          <button
            onClick={() => setActiveId(null)}
            style={{
              background: 'transparent',
              border: `2.5px solid ${BURBUJAS.dark}`,
              borderRadius: 12,
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => e.target.style.background = BURBUJAS.yellow}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            <ChevronLeft size={20} color={BURBUJAS.dark} />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: BURBUJAS.dark, flex: 1 }}>{current.name}</h2>
          <button
            onClick={() => deleteList(activeId)}
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
            <Trash2 size={18} />
          </button>
        </div>

        <form onSubmit={addItem} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="Agregar ítem..."
            style={{
              flex: 1,
              border: `2.5px solid ${BURBUJAS.dark}`,
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 14,
              fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
              fontWeight: 600,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!newItem.trim()}
            style={{
              background: navColors.shop,
              color: '#fff',
              borderRadius: 12,
              padding: '8px 12px',
              border: `2.5px solid ${BURBUJAS.dark}`,
              cursor: !newItem.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !newItem.trim() ? 0.5 : 1,
              transition: 'transform 0.2s',
              fontWeight: 700,
            }}
            onMouseEnter={e => !newItem.trim() || (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            <Plus size={18} />
          </button>
        </form>

        {pending.length === 0 && done.length === 0 && (
          <p style={{
            textAlign: 'center',
            paddingTop: 48,
            paddingBottom: 48,
            color: BURBUJAS.dark,
            opacity: 0.4,
            fontSize: 14,
          }}>
            Lista vacía. Agrega ítems arriba.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pending.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#fff',
                borderRadius: 20,
                border: `2.5px solid ${BURBUJAS.dark}`,
                padding: '12px 16px',
                boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
              }}
            >
              <BurbCheckbox
                checked={false}
                color={navColors.shop}
                onChange={() => toggleItem(item.id)}
              />
              <span style={{
                flex: 1,
                fontSize: 14,
                color: BURBUJAS.dark,
                fontWeight: 500,
              }}>
                {item.name}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
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

          {done.length > 0 && (
            <>
              <p style={{
                fontSize: 12,
                color: BURBUJAS.dark,
                fontWeight: 800,
                paddingTop: 12,
                paddingBottom: 4,
                paddingLeft: 4,
                opacity: 0.6,
              }}>
                En el carrito
              </p>
              {done.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: BURBUJAS.yellow,
                    borderRadius: 20,
                    border: `2.5px solid ${BURBUJAS.dark}`,
                    padding: '12px 16px',
                    boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
                    opacity: 0.7,
                  }}
                >
                  <BurbCheckbox
                    checked={true}
                    color={navColors.shop}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span style={{
                    flex: 1,
                    fontSize: 14,
                    color: BURBUJAS.dark,
                    textDecoration: 'line-through',
                    fontWeight: 400,
                  }}>
                    {item.name}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
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
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: 16,
      maxWidth: 896,
      margin: '0 auto',
      fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: BURBUJAS.dark }}>Compras</h2>
        <button
          onClick={() => setShowNewList(v => !v)}
          style={{
            background: navColors.shop,
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

      {showNewList && (
        <form onSubmit={createList} style={{
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
            value={listName}
            onChange={e => setListName(e.target.value)}
            placeholder="Nombre de la lista (ej. Supermercado)"
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
            <button
              type="button"
              onClick={() => setShowNewList(false)}
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
              disabled={!listName.trim()}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 14,
                background: navColors.shop,
                color: '#fff',
                border: `2.5px solid ${BURBUJAS.dark}`,
                cursor: !listName.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
                opacity: !listName.trim() ? 0.5 : 1,
              }}
            >
              Crear
            </button>
          </div>
        </form>
      )}

      {lists.length === 0 ? (
        <div style={{
          textAlign: 'center',
          paddingTop: 64,
          paddingBottom: 64,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
          <p style={{ color: BURBUJAS.dark, opacity: 0.4, fontSize: 14 }}>Sin listas. Crea una con el botón +</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lists.map(list => {
            const total = list.items?.length ?? 0
            const done = list.items?.filter(i => i.done).length ?? 0
            return (
              <button
                key={list.id}
                onClick={() => setActiveId(list.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: '#fff',
                  borderRadius: 20,
                  border: `2.5px solid ${BURBUJAS.dark}`,
                  padding: '12px 16px',
                  boxShadow: `3px 3px 0 ${BURBUJAS.dark}`,
                  textAlign: 'left',
                  cursor: 'pointer',
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
                <div style={{
                  background: navColors.shop,
                  borderRadius: 12,
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${BURBUJAS.dark}`,
                  color: '#fff',
                }}>
                  🛍️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: BURBUJAS.dark, fontSize: 14 }}>{list.name}</div>
                  <div style={{ fontSize: 12, color: BURBUJAS.dark, opacity: 0.6 }}>{done}/{total} ítems</div>
                </div>
                {total > 0 && (
                  <div style={{
                    width: 56,
                    background: BURBUJAS.cream,
                    borderRadius: 999,
                    height: 6,
                    border: `2px solid ${BURBUJAS.dark}`,
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        background: navColors.shop,
                        height: 6,
                        transition: 'width 0.3s',
                        width: `${(done / total) * 100}%`,
                      }}
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
