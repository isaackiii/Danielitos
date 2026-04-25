import { BURBUJAS } from '../../lib/burbujasTheme'

export default function BurbAvatar({ emoji, bg, size = 32, offset = 2, style = {} }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: bg,
      border: `2.5px solid ${BURBUJAS.dark}`,
      boxShadow: `${offset}px ${offset}px 0 ${BURBUJAS.dark}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.5,
      flexShrink: 0,
      ...style,
    }}>{emoji}</div>
  )
}
