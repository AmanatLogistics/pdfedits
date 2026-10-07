// Manrope is bundled with the site (fast, no extra connection). Other fonts
// chosen in the admin panel are loaded from Google Fonts.
export const BUILT_IN_FONT = 'Manrope'
export const FONT_OPTIONS = [
  'Manrope', 'Inter', 'Plus Jakarta Sans', 'Montserrat', 'Poppins', 'DM Sans', 'Lato', 'Open Sans',
  'Roboto', 'Raleway', 'Nunito Sans', 'Work Sans', 'Outfit', 'Urbanist', 'Source Sans 3',
]

export function fontsHref(theme) {
  const families = [...new Set([theme.headingFont, theme.bodyFont].filter((f) => f && f !== BUILT_IN_FONT))]
  if (!families.length) return ''
  const q = families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700;800`).join('&')
  return `https://fonts.googleapis.com/css2?${q}&display=swap`
}

const safeColor = (c, fallback) => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : fallback)
const safeFont = (f, fallback) => (/^[\w -]+$/.test(f || '') ? f : fallback)
const stack = (f) => `'${f}'${f === BUILT_IN_FONT ? '' : `,'${BUILT_IN_FONT} Variable'`},'${BUILT_IN_FONT} Variable',system-ui,-apple-system,'Segoe UI',Arial,sans-serif`

export function themeCss(theme = {}) {
  const head = safeFont(theme.headingFont, BUILT_IN_FONT)
  const body = safeFont(theme.bodyFont, BUILT_IN_FONT)
  return `:root{--primary:${safeColor(theme.primary, '#6b3a1a')};--accent:${safeColor(theme.accent, '#c9962b')};--dark:${safeColor(theme.dark, '#1b120b')};--export:${safeColor(theme.exportColor, '#9c4f16')};--import:${safeColor(theme.importColor, '#e0a526')};--font-head:${stack(head)};--font-body:${stack(body)}}`
}
