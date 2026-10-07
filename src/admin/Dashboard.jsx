import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardPaste, ExternalLink, Image, Mail, PanelTop, Plus, Truck } from 'lucide-react'
import { fmtDate, fmtNum, tradeSummary } from '../site/trade.js'

export default function Dashboard({ content, status, dirty, goTo }) {
  const t = useMemo(() => tradeSummary(content), [content])
  const actions = [
    { icon: Plus, title: 'Add a shipment', text: 'Record a new consignment or a yearly total.', page: 'records', action: 'add' },
    { icon: ClipboardPaste, title: 'Paste from Excel', text: 'Bring in many records at once.', page: 'records', action: 'paste' },
    { icon: Image, title: 'Products & photos', text: 'Change product names, photos and seasons.', page: 'products' },
    { icon: PanelTop, title: 'Top banner', text: 'Headline, buttons and the main photo.', page: 'hero' },
    { icon: Mail, title: 'Contact details', text: 'Emails, phone, WhatsApp and address.', page: 'company' },
    { icon: Truck, title: 'Destinations map', text: 'Home city and shipping methods.', page: 'destinations' },
  ]
  return (
    <div className="dash">
      {content.sampleData && (
        <div className="callout callout--warn">
          <AlertTriangle size={20} />
          <div>
            <strong>The trade figures are examples.</strong> Replace them with your own records so the website shows your real business.
            <div className="callout__actions"><button type="button" className="b b--primary" onClick={() => goTo('records')}>Open trade records</button></div>
          </div>
        </div>
      )}
      {dirty && (
        <div className="callout callout--info">
          <CheckCircle2 size={20} />
          <div>You have changes that are not live yet. Press <b>Publish</b> at the top when you are ready.</div>
        </div>
      )}

      <div className="dash__totals">
        <div className="dash__main"><span>Total shipped</span><strong>{fmtNum(t.shipped)}<small> tonnes</small></strong></div>
        <div><span>Exported</span><strong>{fmtNum(t.exported)} t</strong></div>
        <div><span>Imported</span><strong>{fmtNum(t.imported)} t</strong></div>
        <div><span>Orders</span><strong>{fmtNum(t.orders)}</strong></div>
        <div><span>Countries</span><strong>{t.countries}</strong></div>
        <div><span>Latest record</span><strong>{t.latest ? fmtDate(t.latest) : '—'}</strong></div>
      </div>

      <h2 className="dash__h">What would you like to do?</h2>
      <div className="dash__actions">
        {actions.map(({ icon: I, title, text, page, action }) => (
          <button type="button" key={title} className="dash__action" onClick={() => goTo(page, action)}>
            <span className="dash__icon"><I size={20} /></span>
            <span><strong>{title}</strong><span>{text}</span></span>
          </button>
        ))}
        <a className="dash__action" href="/" target="_blank" rel="noreferrer">
          <span className="dash__icon"><ExternalLink size={20} /></span>
          <span><strong>View the website</strong><span>Opens the live site in a new tab.</span></span>
        </a>
      </div>

      <h2 className="dash__h">Set-up</h2>
      <ul className="dash__setup">
        <li className={status?.publishing ? 'ok' : 'todo'}>{status?.publishing ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} Publishing {status?.publishing ? 'is set up' : 'needs GITHUB_TOKEN in Vercel (see README)'}</li>
        <li className={status?.email ? 'ok' : 'todo'}>{status?.email ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {status?.email ? 'Inquiries are emailed to you directly' : 'Inquiry emails open the visitor’s email app (add RESEND_API_KEY to send them directly)'}</li>
      </ul>
    </div>
  )
}
