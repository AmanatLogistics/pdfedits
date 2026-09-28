import { useEffect, useRef, useState } from 'react'

// True once the element has scrolled into view.
export default function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(() => !('IntersectionObserver' in window))
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true)
        io.disconnect()
      }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView]
}
