import { BURBUJAS } from '../../lib/burbujasTheme'

export default function BurbCheckbox({ checked, color = BURBUJAS.green, onChange, size = 22, style = {} }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange?.(!checked) }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        border: `2.5px solid ${BURBUJAS.dark}`,
        background: checked ? color : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `2px 2px 0 ${BURBUJAS.dark}`,
        flexShrink: 0,
        cursor: 'pointer',
        padding: 0,
        transition: 'background .15s',
        ...style,
      }}
    >
      {checked && (
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 14 14">
          <path d="M2,7 L6,11 L12,3" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
