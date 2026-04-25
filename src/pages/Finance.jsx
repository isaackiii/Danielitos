import { useSearchParams } from 'react-router-dom'
import { BURBUJAS, navColors } from '../lib/burbujasTheme'
import Expenses from './Expenses'
import Debts from './Debts'

const TABS = [
  { key: 'gastos', label: 'Gastos', emoji: '💸' },
  { key: 'deudas', label: 'Deudas', emoji: '💝' },
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
    <div style={{
      padding: 16,
      maxWidth: 896,
      margin: '0 auto',
      fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
    }}>
      <div style={{ paddingTop: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: BURBUJAS.dark, marginBottom: 12 }}>Finanzas</h2>
        <div style={{
          display: 'flex',
          gap: 4,
          background: BURBUJAS.cream,
          borderRadius: 14,
          padding: 4,
          border: `2.5px solid ${BURBUJAS.dark}`,
        }}>
          {TABS.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                background: tab === key ? (key === 'gastos' ? navColors.fin : BURBUJAS.pink) : 'transparent',
                color: tab === key ? '#fff' : BURBUJAS.dark,
                border: tab === key ? `2.5px solid ${BURBUJAS.dark}` : '2px solid transparent',
                boxShadow: tab === key ? `2px 2px 0 ${BURBUJAS.dark}` : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
              }}
              onMouseEnter={e => {
                if (tab !== key) {
                  e.target.style.background = BURBUJAS.yellow;
                }
              }}
              onMouseLeave={e => {
                if (tab !== key) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 16 }}>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'gastos' ? <Expenses /> : <Debts />}
    </div>
  )
}
