import { useEffect, useRef, useState } from 'react'

// True once the element has scrolled into view (and stays true).
export default function useInView(threshold = 0.25) {
  const ref = useRef(null)
  const [inView, setInView] = useState(() => !('IntersectionObserver' in window))
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        io.disconnect()
      }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView]
}
