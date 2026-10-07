import { useCallback, useState } from 'preact/hooks'
import { responsiveSet } from './images.js'

export default function Photo({ image, className = '', sizes = '100vw', eager = false, plain = false, width, height }) {
  // 0: the photo, 1: its backup address (image.fallback), 2: show an empty box.
  const [attempt, setAttempt] = useState(0)
  const fail = useCallback(() => setAttempt((a) => (a === 0 && image?.fallback ? 1 : 2)), [image?.fallback])
  // A prerendered image can fail before scripts start, when React's onError
  // is not attached yet, so check again once the element is in place.
  // Only eager images are checked: some browsers report a lazy image that
  // has not started loading yet as "complete" with no size.
  const check = useCallback((el) => {
    if (el && eager && el.complete && el.naturalWidth === 0) fail()
  }, [eager, fail])
  const src = attempt === 1 ? image?.fallback : image?.src
  if (!src || attempt === 2) return <div className={`photo photo--empty ${className}`} role="presentation" />
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
        onError={fail}
      />
    </div>
  )
}
