import { BURBUJAS } from '../../lib/burbujasTheme'

export default function BurbPill({ children, bg = BURBUJAS.purple, color = '#fff', border = true, onClick, style = {} }) {
  return (
    <div onClick={onClick} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 800,
      border: border ? `2px solid ${BURBUJAS.dark}` : 'none',
      whiteSpace: 'nowrap',
      cursor: onClick ? 'pointer' : 'default',
      fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
      ...style,
    }}>
      {children}
    </div>
  );
}
