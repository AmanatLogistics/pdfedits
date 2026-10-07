import { useEffect, useState } from 'preact/hooks'
import { ArrowUp } from '../ph.jsx'

// A small button to jump back to the top on long pages.
export default function ToTop({ above }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 900)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <button type="button" className={`to-top ${above ? 'to-top--above' : ''} ${shown ? 'is-shown' : ''}`} aria-label="Back to top"
      tabIndex={shown ? 0 : -1} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <ArrowUp size={20} weight="bold" />
    </button>
  )
}
