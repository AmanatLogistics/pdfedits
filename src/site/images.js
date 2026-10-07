// Photo hosts that can resize images on request: offer the browser a range
// of widths so phones download small files and big screens get sharp ones.
const widths = (list, at) => ({ src: at(list.includes(1200) ? 1200 : list[Math.floor(list.length / 2)]), srcSet: list.map((w) => `${at(w)} ${w}w`).join(', ') })

export function responsiveSet(src) {
  if (!src) return null
  if (/^https:\/\/images\.pexels\.com\//.test(src)) {
    return widths([480, 800, 1200, 1800, 2400], (w) => {
      const u = new URL(src)
      u.searchParams.set('auto', 'compress')
      u.searchParams.set('cs', 'tinysrgb')
      u.searchParams.set('w', String(w))
      return u.toString()
    })
  }
  if (/^https:\/\/images\.unsplash\.com\//.test(src)) {
    return widths([480, 800, 1200, 1800, 2400], (w) => {
      const u = new URL(src)
      u.searchParams.set('auto', 'format')
      u.searchParams.set('fit', 'crop')
      u.searchParams.set('q', '80')
      u.searchParams.set('w', String(w))
      return u.toString()
    })
  }
  // Wikimedia Commons thumbnails: …/thumb/a/ab/Name.jpg/960px-Name.jpg
  if (/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+\/\d+px-[^/]+$/.test(src)) {
    return widths([500, 960, 1280], (w) => src.replace(/\/\d+px-([^/]+)$/, `/${w}px-$1`))
  }
  return null
}

// A small copy of a photo, for thumbnails in lists.
export function thumbOf(src, w = 120) {
  const set = responsiveSet(src)
  if (!set) return src
  return set.srcSet.split(', ')[0].split(' ')[0].replace(/([?&]w=)\d+/, `$1${w}`).replace(/\/\d+px-([^/]+)$/, '/500px-$1')
}
