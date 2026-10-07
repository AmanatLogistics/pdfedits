import { ArrowRight } from './ph.jsx'

export default function SectionHead({ eyebrow, title, text, align = 'center', light = false, more }) {
  return (
    <div className={`shead shead--${align} ${light ? 'shead--light' : ''} reveal`}>
      <div className="shead__main">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h2>{title}</h2>}
      </div>
      {(text || more) && (
        <div className="shead__side">
          {text && <p className="shead__text">{text}</p>}
          {more && <a className="more-link" href={more.href}>{more.label} <ArrowRight size={16} weight="bold" /></a>}
        </div>
      )}
    </div>
  )
}
