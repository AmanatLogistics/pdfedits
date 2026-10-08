import { useEffect, useState } from 'preact/hooks'
import { WhatsappLogo } from '../ph.jsx'
import { waHref } from '../hooks.js'

export default function WhatsAppButton({ content }) {
  const { whatsappButton: w, company } = content
  // Step aside while the closing banner or the footer is on screen: they have
  // their own WhatsApp and contact links, and the button would cover them.
  const [away, setAway] = useState(false)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const seen = new Set()
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)))
      setAway(seen.size > 0)
    }, { rootMargin: '0px 0px -40px 0px' })
    // The page's sections change when moving between pages, so look again after each change.
    const watch = () => { io.disconnect(); seen.clear(); setAway(false); document.querySelectorAll('.cta-band, .footer').forEach((el) => io.observe(el)) }
    watch()
    const mo = new MutationObserver(() => watch())
    const main = document.querySelector('main')?.parentElement
    if (main) mo.observe(main, { childList: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [])
  if (!w?.enabled || !company.whatsapp) return null
  return (
    <a className={`wa-float ${away ? 'is-away' : ''}`} href={waHref(company.whatsapp, w.message)} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp">
      <WhatsappLogo size={30} weight="fill" />
    </a>
  )
}
