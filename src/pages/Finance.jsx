import { useSearchParams } from 'react-router-dom'
import { Wallet, Receipt } from 'lucide-react'
import Expenses from './Expenses'
import Debts from './Debts'

const TABS = [
  { key: 'gastos', label: 'Gastos', icon: Wallet },
  { key: 'deudas', label: 'Deudas', icon: Receipt },
]

export default function Finance() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'deudas' ? 'deudas' : 'gastos'

  const setTab = key => {
    if (key === 'gastos') {
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ tab: key }, { replace: true })
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="pt-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Finanzas</h2>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'gastos' ? <Expenses /> : <Debts />}
    </div>
  )
}
