import { ArrowRight } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'
import { TRANSPORT } from '../icons.jsx'
import { fmtDate, fmtNum, unitOf } from '../trade.js'

const thumbOf = (src) => (src && /^https:\/\/images\.pexels\.com\//.test(src) ? src.replace(/([?&])w=\d+/, '$1w=120') : src)

export default function Shipments({ content, trade, tone, full, more }) {
  const { shipments: S, destinations, products } = content
  const count = Math.max(1, Number(S.count) || 6)
  const list = trade.recent.slice(0, full ? Math.max(count, Number(S.pageCount) || 24) : count)
  const unit = unitOf(content)
  if (!list.length) return null
  const hub = destinations?.hub || 'Kandahar'
  const thumbs = Object.fromEntries((products?.items || []).map((p) => [p.title, thumbOf(p.image?.src)]))
  return (
    <section className={`section section--${tone}`} id="shipments">
      <div className="container">
        <SectionHead eyebrow={S.eyebrow} title={S.title} text={S.text} align="split" more={more} />
        <ol className="ships">
          {list.map((r, i) => {
            const T = TRANSPORT[r.transport] ?? TRANSPORT.road
            const isImport = r.direction === 'import'
            return (
              <li className="ship reveal" style={{ '--i': i % 6 }} key={`${r.date}-${r.product}-${i}`}>
                <div className="ship__top">
                  <span className="ship__date">{fmtDate(r.date)}</span>
                  <span className={`ship__dir ship__dir--${isImport ? 'import' : 'export'}`}>{isImport ? 'Import' : 'Export'}</span>
                </div>
                <div className="ship__product">
                  <Photo image={{ src: thumbs[r.product], alt: '' }} className="ship__img" plain width="52" height="52" />
                  <div>
                    <strong>{r.product}</strong>
                    <span className="ship__tonnes">{fmtNum(r.tonnes)} {unit}</span>
                  </div>
                </div>
                <div className="ship__route">
                  <span>{isImport ? r.country : hub}</span>
                  <span className="ship__line" aria-hidden="true"><T.C size={18} weight="duotone" /><ArrowRight size={14} weight="bold" /></span>
                  <span>{isImport ? hub : r.country}</span>
                </div>
                <span className="ship__mode">{T.label} freight</span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
