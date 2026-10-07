import { hydrate, render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { inject } from '@vercel/analytics'
import '@fontsource-variable/manrope'
import Site from './site/Site.jsx'
import initialContent from './content/site.json'
import './site/site.css'

const isPreview = new URLSearchParams(window.location.search).has('preview') && window.parent !== window

// In the admin panel the site runs inside an iframe and redraws as the
// content is edited, before anything is published.
function PreviewSite() {
  const [content, setContent] = useState(initialContent)
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'faiz:preview') return
      setContent(e.data.content)
      if (e.data.scrollTo) document.getElementById(e.data.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'faiz:preview-ready' }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  return <Site content={content} />
}

const root = document.getElementById('root')
if (isPreview) {
  render(<PreviewSite />, root)
} else {
  // The page arrives fully rendered; this only attaches the interactive parts.
  (root.hasChildNodes() ? hydrate : render)(<Site content={initialContent} />, root)
  if (import.meta.env.PROD) inject()
}
