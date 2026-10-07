import { renderToString } from 'react-dom/server'
import Site from './site/Site.jsx'

export function render(content) {
  return renderToString(<Site content={content} />)
}
