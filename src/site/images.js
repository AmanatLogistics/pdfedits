// Pexels images can be requested at any width, so offer the browser a range.
export function responsiveSet(src) {
  if (!/^https:\/\/images\.pexels\.com\//.test(src || '')) return null
  const at = (w) => {
    const u = new URL(src)
    u.searchParams.set('auto', 'compress')
    u.searchParams.set('cs', 'tinysrgb')
    u.searchParams.set('w', String(w))
    return u.toString()
  }
  return { src: at(1200), srcSet: [480, 800, 1200, 1800, 2400].map((w) => `${at(w)} ${w}w`).join(', ') }
}
