import { useState } from 'react'

const pexels = (id, w) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

// A real photograph. Uses a local file when `src` is set, otherwise Pexels.
// If the image cannot load, the frame stays a plain paper-toned block
// rather than showing a broken-image icon.
export default function Photo({ photo, sizes = '100vw', className = '', eager = false }) {
  const [failed, setFailed] = useState(false)
  const props = photo.src
    ? { src: photo.src }
    : {
        src: pexels(photo.pexels, 1400),
        srcSet: [640, 1000, 1400, 2000].map((w) => `${pexels(photo.pexels, w)} ${w}w`).join(', '),
        sizes,
      }
  return (
    <div className={`photo ${failed ? 'photo--missing' : ''} ${className}`}>
      {!failed && (
        <img {...props} alt={photo.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
      )}
    </div>
  )
}
