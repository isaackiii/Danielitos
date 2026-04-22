import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { ClipboardList, ShoppingCart, Wallet, ChevronRight, Copy, Check } from 'lucide-react'

export default function Home() {
  const { user, householdId } = useAuth()
  const [pendingTasks, setPendingTasks] = useState(0)
  const [shoppingItems, setShoppingItems] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!householdId) return

    const unsubTasks = onSnapshot(
      query(collection(db, 'households', householdId, 'tasks'), where('done', '==', false)),
      snap => setPendingTasks(snap.size)
    )

    const unsubShopping = onSnapshot(
      collection(db, 'households', householdId, 'shoppingLists'),
      snap => {
        const total = snap.docs.reduce((acc, d) => {
          const items = d.data().items || []
          return acc + items.filter(i => !i.done).length
        }, 0)
        setShoppingItems(total)
      }
    )

    return () => { unsubTasks(); unsubShopping() }
  }, [householdId])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.displayName?.split(' ')[0] ?? ''

  const copyCode = () => {
    navigator.clipboard.writeText(householdId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="pt-4 mb-6">
        <p className="text-sm text-gray-400">{greeting}</p>
        <h2 className="text-2xl font-bold text-gray-900">{firstName} 👋</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-violet-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-violet-600 mb-1">{pendingTasks}</div>
          <div className="text-sm text-gray-500">Tareas pendientes</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-amber-500 mb-1">{shoppingItems}</div>
          <div className="text-sm text-gray-500">Items por comprar</div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {[
          { to: '/tareas', icon: ClipboardList, label: 'Tareas', desc: 'Gestiona las tareas del hogar', iconClass: 'text-violet-600 bg-violet-50' },
          { to: '/compras', icon: ShoppingCart, label: 'Compras', desc: 'Listas de compras compartidas', iconClass: 'text-amber-500 bg-amber-50' },
          { to: '/finanzas', icon: Wallet, label: 'Finanzas', desc: 'Gastos y balance familiar', iconClass: 'text-green-600 bg-green-50' },
        ].map(({ to, icon: Icon, label, desc, iconClass }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:border-gray-200 transition-colors"
          >
            <div className={`p-2 rounded-xl ${iconClass}`}>
              <Icon size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">{label}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <p className="text-xs text-gray-400 mb-2">Código de tu hogar · Compártelo con tu pareja</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-mono font-bold text-gray-700 tracking-widest">{householdId}</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 transition-colors"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
