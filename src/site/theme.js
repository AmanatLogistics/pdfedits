// Fonts the admin panel offers. All are on Google Fonts.
export const FONT_OPTIONS = [
  'Manrope', 'Inter', 'Plus Jakarta Sans', 'Montserrat', 'Poppins', 'DM Sans', 'Lato', 'Open Sans',
  'Roboto', 'Raleway', 'Nunito Sans', 'Work Sans', 'Outfit', 'Urbanist', 'Source Sans 3',
]

export function fontsHref(theme) {
  const families = [...new Set([theme.headingFont, theme.bodyFont].filter(Boolean))]
  if (!families.length) return ''
  const q = families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700;800`).join('&')
  return `https://fonts.googleapis.com/css2?${q}&display=swap`
}

const safeColor = (c, fallback) => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : fallback)
const safeFont = (f, fallback) => (/^[\w -]+$/.test(f || '') ? f : fallback)

export function themeCss(theme = {}) {
  return `:root{--primary:${safeColor(theme.primary, '#6b3a1a')};--accent:${safeColor(theme.accent, '#c9962b')};--dark:${safeColor(theme.dark, '#1e130b')};--import:${safeColor(theme.importColor, '#9c4f16')};--export:${safeColor(theme.exportColor, '#e0a526')};--font-head:'${safeFont(theme.headingFont, 'Manrope')}',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;--font-body:'${safeFont(theme.bodyFont, 'Inter')}',system-ui,-apple-system,'Segoe UI',Arial,sans-serif}`
}
