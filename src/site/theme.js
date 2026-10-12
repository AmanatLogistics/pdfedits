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
  return `:root{--primary:${safeColor(theme.primary, '#1f4d3b')};--accent:${safeColor(theme.accent, '#e2a72e')};--dark:${safeColor(theme.dark, '#0f2018')};--export:${safeColor(theme.exportColor, '#2e7d5b')};--import:${safeColor(theme.importColor, '#e2a72e')};--font-head:${stack(head)};--font-body:${stack(body)}}`
}
