import { useEffect, useRef, useState } from 'preact/hooks'

// Counts up to `value` when the element scrolls into view. The first render
// (and the prerendered HTML) shows the real number, so nothing reads "0" if
// scripts are slow; the count-up only runs for numbers that start off-screen.
export function useCountUp(value) {
  const ref = useRef(null)
  const [progress, setProgress] = useState(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0) return
    let raf = requestAnimationFrame(() => setProgress(0))
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (t) => {
        const p = Math.min(1, (t - start) / 1400)
        setProgress(1 - Math.pow(1 - p, 3))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [])
  return [ref, progress === null ? value : Math.round(value * progress)]
}

// Adds `is-visible` to elements with the `reveal` class as they scroll in.
export function useReveal(deps) {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    // The admin preview redraws constantly; show everything there straight away.
    if (new URLSearchParams(window.location.search).has('preview')) return
    document.documentElement.classList.add('js-reveal')
    const els = [...document.querySelectorAll('.reveal:not(.is-visible)')]
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    els.forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight) el.classList.add('is-visible')
      else io.observe(el)
    })
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export const fmt = (n) => Number(n || 0).toLocaleString('en-IN')

export const telHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`
export const waHref = (number, text) => `https://wa.me/${String(number || '').replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`
