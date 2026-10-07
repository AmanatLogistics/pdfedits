// Moving between the website's pages without reloading: links to a page of
// this site update the address and redraw the page in place. Every page also
// exists as its own HTML file, so addresses still work when opened directly.
import { PAGES } from './pages.js'

const PATHS = new Set(['/', ...PAGES.map((p) => p.path)])
const clean = (pathname) => `/${String(pathname || '').replace(/\/index\.html$/, '').replace(/^\/+|\/+$/g, '')}`
export const isPagePath = (pathname) => PATHS.has(clean(pathname))

const listeners = new Set()
export const onNavigate = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function navigate(href) {
  const url = new URL(href, window.location.href)
  if (url.origin !== window.location.origin || !isPagePath(url.pathname) || !listeners.size) {
    window.location.href = url.href
    return
  }
  // Remember where this page was scrolled to, for the Back button.
  window.history.replaceState({ ...(window.history.state || {}), y: window.scrollY }, '')
  window.history.pushState({ y: 0 }, '', url.pathname + url.search + url.hash)
  listeners.forEach((fn) => fn(url))
}

// Turns clicks on links to other pages into in-place navigation.
export function interceptLinks() {
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest?.('a[href]')
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
    const url = new URL(a.href, window.location.href)
    if (url.origin !== window.location.origin || !isPagePath(url.pathname)) return
    // A link to a section of the page already open scrolls the usual way.
    if (clean(url.pathname) === clean(window.location.pathname) && url.search === window.location.search && url.hash) return
    e.preventDefault()
    navigate(url.href)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
