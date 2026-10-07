import { useCallback, useState } from 'preact/hooks'
import { responsiveSet } from './images.js'

export default function Photo({ image, className = '', sizes = '100vw', eager = false, plain = false, width, height }) {
  const [failed, setFailed] = useState(false)
  // A prerendered image can fail before scripts start, when React's onError
  // is not attached yet, so check again once the element is in place.
  const check = useCallback((el) => {
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])
  const src = image?.src
  if (!src || failed) return <div className={`photo photo--empty ${className}`} role="presentation" />
  const set = plain ? null : responsiveSet(src)
  return (
    <div className={`photo ${className}`}>
      <img
        ref={check}
        src={set?.src ?? src}
        srcSet={set?.srcSet}
        sizes={set ? sizes : undefined}
        alt={image.alt || ''}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
