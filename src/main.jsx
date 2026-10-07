import { StrictMode, useEffect, useState } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
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
const app = isPreview
  ? <PreviewSite />
  : (
    <StrictMode>
      <Site content={initialContent} />
      <Analytics />
    </StrictMode>
  )

// (In development, editing content can re-run this file; reuse the root then.)
if (root.__faizRoot) root.__faizRoot.render(app)
else if (!isPreview && root.hasChildNodes()) root.__faizRoot = hydrateRoot(root, app)
else (root.__faizRoot = createRoot(root)).render(app)
