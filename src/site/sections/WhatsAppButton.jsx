import { WhatsappLogo } from '../ph.jsx'
import { waHref } from '../hooks.js'

export default function WhatsAppButton({ content }) {
  const { whatsappButton: w, company } = content
  if (!w?.enabled || !company.whatsapp) return null
  return (
    <a className="wa-float" href={waHref(company.whatsapp, w.message)} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp">
      <WhatsappLogo size={30} weight="fill" />
    </a>
  )
}
