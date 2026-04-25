import { BURBUJAS } from '../../lib/burbujasTheme'

export default function BurbProgressBar({ value, total, color = BURBUJAS.yellow, height = 10 }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{
      height,
      borderRadius: height / 2,
      background: 'rgba(0,0,0,0.08)',
      border: `2px solid ${BURBUJAS.dark}`,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: color,
        transition: 'width .3s cubic-bezier(.3,1.4,.5,1)',
      }} />
    </div>
  )
}
