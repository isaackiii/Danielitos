// Burbujas design tokens — mirrors `B` object in danielitos/project/burb-core.jsx
export const BURBUJAS = {
  bg: '#fff4e8',
  surface: '#ffffff',
  dark: '#2b2040',
  darkSoft: '#4a3b68',
  purple: '#8b5cf6',
  purpleDark: '#7040e0',
  pink: '#ff6b9d',
  pinkSoft: '#ffd4e2',
  yellow: '#ffd23f',
  yellowSoft: '#fff0b3',
  green: '#3ed598',
  greenDark: '#2aa876',
  blue: '#4dabf7',
  orange: '#ff8f3c',
  cream: '#fff9f0',
  line: 'rgba(43,32,64,0.12)',
}

export const burbFontFamily = '"Nunito", "Quicksand", system-ui, sans-serif'

export const burbShadow = (offset = 3) => ({
  boxShadow: `${offset}px ${offset}px 0 ${BURBUJAS.dark}`,
  border: `2.5px solid ${BURBUJAS.dark}`,
})

export const burbShadowLg = (offset = 4) => ({
  boxShadow: `${offset}px ${offset}px 0 ${BURBUJAS.dark}`,
  border: `2.5px solid ${BURBUJAS.dark}`,
})

export const navColors = {
  home: BURBUJAS.orange,
  task: BURBUJAS.green,
  shop: BURBUJAS.pink,
  fin: BURBUJAS.purple,
  refri: BURBUJAS.blue,
  settings: BURBUJAS.yellow,
}

export const colorMap = {
  primary: BURBUJAS.purple,
  secondary: BURBUJAS.pink,
  success: BURBUJAS.green,
  warning: BURBUJAS.yellow,
  accent: BURBUJAS.orange,
  info: BURBUJAS.blue,
}
