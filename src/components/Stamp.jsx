import { useId } from 'react'

// Round customs-style rubber stamp.
export default function Stamp({ text, center, className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={`stamp ${className}`} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id={`${id}-c`} d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
        <filter id={`${id}-rough`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.25" />
          <feComposite in="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}-rough)`}>
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="2" />
        <text fontSize="15" letterSpacing="2.6" fill="currentColor" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
          <textPath href={`#${id}-c`}>{text}</textPath>
        </text>
        <text x="100" y="100" textAnchor="middle" fontSize="30" fill="currentColor" fontFamily="Rozha One, serif">{center[0]}</text>
        <text x="100" y="124" textAnchor="middle" fontSize="12" letterSpacing="2" fill="currentColor" fontFamily="IBM Plex Mono, monospace" fontWeight="600">{center[1]}</text>
      </g>
    </svg>
  )
}
