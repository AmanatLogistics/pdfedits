import { hydrate, render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { inject } from '@vercel/analytics'
import '@fontsource-variable/manrope'
import Site from './site/Site.jsx'
import { pageForPath, titleFor } from './site/pages.js'
import { interceptLinks, onNavigate } from './site/router.js'
import { scrollToForm } from './site/hooks.js'
import initialContent from './content/site.json'
import './site/site.css'

const isPreview = new URLSearchParams(window.location.search).has('preview') && window.parent !== window

// scrollIntoView would also scroll the admin panel around the preview, so
// only scroll the preview's own window.
function scrollToEl(el, behavior = 'auto') {
  window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY : 0, behavior })
}

// In the admin panel the site runs inside an iframe and redraws as the
// content is edited, before anything is published.
function PreviewSite() {
  const [content, setContent] = useState(initialContent)
  const [page, setPage] = useState('home')
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'faiz:preview') return
      setContent(e.data.content)
      if (e.data.page) setPage(e.data.page)
      if (e.data.scrollTo) {
        const id = e.data.scrollTo
        setTimeout(() => scrollToEl(document.getElementById(id), 'smooth'), 80)
      }
    }
    // Links between pages switch the preview instead of leaving it.
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="/"]')
      if (!a || a.target === '_blank') return
      const url = new URL(a.href)
      e.preventDefault()
      setPage(pageForPath(url.pathname))
      setTimeout(() => scrollToEl(url.hash ? document.querySelector(url.hash) : null), 60)
    }
    document.addEventListener('click', onClick)
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'faiz:preview-ready' }, window.location.origin)
    return () => { window.removeEventListener('message', onMessage); document.removeEventListener('click', onClick) }
  }, [])
  return <Site content={content} page={page} />
}

// The live website: links between its pages redraw the page in place
// instead of loading a new one.
function LiveSite() {
  const [page, setPage] = useState(() => pageForPath(window.location.pathname))
  const [moved, setMoved] = useState(false)
  useEffect(() => {
    const show = (url, y = 0) => {
      // Scroll first, so the new page's animations start from the top.
      window.scrollTo(0, url.hash ? window.scrollY : y)
      setPage(pageForPath(url.pathname))
      setMoved(true)
      // Links to the inquiry form land on the form itself, not the top of the contact section.
      if (url.hash === '#contact') setTimeout(() => scrollToForm(), 60)
      else if (url.hash) setTimeout(() => scrollToEl(document.querySelector(url.hash), 'smooth'), 60)
    }
    const offNavigate = onNavigate((url) => show(url))
    const onPop = (e) => show(new URL(window.location.href), e.state?.y || 0)
    window.addEventListener('popstate', onPop)
    const offLinks = interceptLinks()
    return () => { offNavigate(); offLinks(); window.removeEventListener('popstate', onPop) }
  }, [])
  useEffect(() => {
    if (!moved) return
    document.title = titleFor(initialContent, page)
    const p = initialContent.pages?.[page]
    document.querySelector('meta[name="description"]')?.setAttribute('content', (page !== 'home' && p?.text) || initialContent.meta?.description || '')
  }, [page, moved])
  return <Site content={initialContent} page={page} moved={moved} />
}

const root = document.getElementById('root')
if (isPreview) {
  render(<PreviewSite />, root)
} else {
  // The page arrives fully rendered; this only attaches the interactive parts.
  (root.hasChildNodes() ? hydrate : render)(<LiveSite />, root)
  if (import.meta.env.PROD) inject()
}
