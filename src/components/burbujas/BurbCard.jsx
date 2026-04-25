import { useState } from 'react'
import { BURBUJAS } from '../../lib/burbujasTheme'

export default function BurbCard({
  children,
  color = '#fff',
  offset = 3,
  rounded = 18,
  onClick,
  style = {},
}) {
  const [pressed, setPressed] = useState(false)
  const off = pressed ? Math.max(0, offset - 2) : offset
  return (
    <div
      onClick={onClick}
      onPointerDown={() => onClick && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: color,
        border: `2.5px solid ${BURBUJAS.dark}`,
        borderRadius: rounded,
        boxShadow: `${off}px ${off}px 0 ${BURBUJAS.dark}`,
        transform: pressed ? `translate(${offset - off}px, ${offset - off}px)` : 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .08s, box-shadow .08s',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
