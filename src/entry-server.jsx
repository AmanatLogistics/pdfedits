import { renderToString } from 'preact-render-to-string'
import Site from './site/Site.jsx'

export function render(content) {
  return renderToString(<Site content={content} />)
}
