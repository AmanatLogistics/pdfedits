import { hydrate, render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { inject } from '@vercel/analytics'
import '@fontsource-variable/manrope'
import Site from './site/Site.jsx'
import { pageForPath } from './site/pages.js'
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

const root = document.getElementById('root')
if (isPreview) {
  render(<PreviewSite />, root)
} else {
  // The page arrives fully rendered; this only attaches the interactive parts.
  (root.hasChildNodes() ? hydrate : render)(<Site content={initialContent} page={pageForPath(window.location.pathname)} />, root)
  if (import.meta.env.PROD) inject()
}
