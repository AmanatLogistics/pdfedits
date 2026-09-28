import { useState } from 'react'

const pexels = (id, w) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

// A real photograph: a local file when `src` is set, otherwise from Pexels.
// If it cannot load, a soft coloured block stays in its place.
export default function Photo({ photo, sizes = '100vw', className = '', eager = false }) {
  const [failed, setFailed] = useState(false)
  const props = photo.src
    ? { src: photo.src }
    : {
        src: pexels(photo.pexels, 1200),
        srcSet: [480, 800, 1200, 1800].map((w) => `${pexels(photo.pexels, w)} ${w}w`).join(', '),
        sizes,
      }
  return (
    <div className={`photo ${failed ? 'photo--missing' : ''} ${className}`}>
      {!failed && <img {...props} alt={photo.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />}
    </div>
  )
}
