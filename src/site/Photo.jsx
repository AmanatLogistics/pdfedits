import { useCallback, useState } from 'react'

// Pexels images can be requested at any width, so offer the browser a range.
function pexelsSet(src) {
  if (!/^https:\/\/images\.pexels\.com\//.test(src)) return null
  const at = (w) => {
    const u = new URL(src)
    u.searchParams.set('auto', 'compress')
    u.searchParams.set('cs', 'tinysrgb')
    u.searchParams.set('w', String(w))
    return u.toString()
  }
  return { src: at(1200), srcSet: [480, 800, 1200, 1800, 2400].map((w) => `${at(w)} ${w}w`).join(', ') }
}

export default function Photo({ image, className = '', sizes = '100vw', eager = false }) {
  const [failed, setFailed] = useState(false)
  // A prerendered image can fail before scripts start, when React's onError
  // is not attached yet, so check again once the element is in place.
  const check = useCallback((el) => {
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])
  const src = image?.src
  if (!src || failed) return <div className={`photo photo--empty ${className}`} role="presentation" />
  const set = pexelsSet(src)
  return (
    <div className={`photo ${className}`}>
      <img
        ref={check}
        src={set?.src ?? src}
        srcSet={set?.srcSet}
        sizes={set ? sizes : undefined}
        alt={image.alt || ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
