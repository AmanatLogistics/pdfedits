import { renderToString } from 'preact-render-to-string'
import Site, { livePages } from './site/Site.jsx'

export { livePages }

export function render(content, page = 'home') {
  return renderToString(<Site content={content} page={page} />)
}
