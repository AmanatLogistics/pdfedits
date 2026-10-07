// The Faiz Fayez emblem: a Kandahar pomegranate with an "FF" monogram,
// drawn in the brand colours. Used unless a logo image is uploaded.
export function Emblem({ size = 44, className = '' }) {
  return (
    <svg className={`emblem ${className}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="13" fill="var(--primary, #6b3a1a)" />
      <path d="M18.6 16.4 19.3 9.8l3 3.3L24 8.4l1.7 4.7 3-3.3.7 6.6Z" fill="var(--accent, #c9962b)" />
      <path d="M29.2 13.6c2.6-3.2 6.2-3.9 8.6-3.2-.9 3.1-3.9 5.3-7.9 5.1Z" fill="#9fbf6a" />
      <circle cx="24" cy="27.6" r="12.2" fill="var(--accent, #c9962b)" />
      <path d="M14.4 24.6a10 10 0 0 1 6.4-6.6" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17.6 21.2h6v2.5h-3.3v2.3h2.8v2.4h-2.8v4.8h-2.7Zm7.7 0h6v2.5H28v2.3h2.8v2.4H28v4.8h-2.7Z" fill="var(--primary, #6b3a1a)" />
    </svg>
  )
}

export default function Logo({ company, light = false }) {
  const name = String(company.name || '')
  const m = name.match(/^(.*?)\s+(LTD\.?|Ltd\.?|Limited|LLC|Co\.?)$/)
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      {company.logo ? <img className="logo__img" src={company.logo} alt="" /> : <Emblem className="logo__mark" />}
      <span className="logo__text">
        <strong>{m ? <>{m[1]} <span className="logo__suffix">{m[2]}</span></> : name}</strong>
        {company.tagline && <small>{company.tagline}</small>}
      </span>
    </span>
  )
}
