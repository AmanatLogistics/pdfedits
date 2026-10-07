export default function SectionHead({ eyebrow, title, text, align = 'center', light = false }) {
  return (
    <div className={`shead shead--${align} ${light ? 'shead--light' : ''} reveal`}>
      <div className="shead__main">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h2>{title}</h2>}
      </div>
      {text && <p className="shead__text">{text}</p>}
    </div>
  )
}
