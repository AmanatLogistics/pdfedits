import { useId } from 'react'

// Hand-built SVG illustrations of each fruit, so every product card has a
// picture even before real photos are added. Each item shape is drawn centred
// on (0,0) and then piled into a bowl or crate.

function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ITEMS = {
  almond: {
    size: [34, 22],
    colors: ['#c47a45', '#7a3f1c'],
    draw: (g) => (
      <>
        <path d="M-17 0C-14-11 8-12 17 0 8 12-14 11-17 0Z" fill={`url(#${g})`} />
        <path d="M-12-2C-6-6 4-6 12-1M-11 3C-4 5 5 4 11 1" stroke="#5e2e12" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
        <path d="M-10-5C-5-8 2-8 7-6" stroke="#fff" strokeOpacity=".25" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  cashew: {
    size: [34, 28],
    colors: ['#f7e6c0', '#d6ae6e'],
    draw: (g) => (
      <>
        <path d="M-16-4C-14-14 6-16 14-6 18 0 16 10 8 12 4 13 2 8 5 4 8 0 4-6-2-5-8-4-10 2-12 4-16 6-18 0-16-4Z" fill={`url(#${g})`} stroke="#b88b4a" strokeOpacity=".5" />
        <path d="M-11-7C-6-11 3-12 9-8" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  pistachio: {
    size: [32, 24],
    colors: ['#f1e2c2', '#cdb183'],
    draw: (g) => (
      <>
        <ellipse rx="15" ry="11" fill={`url(#${g})`} stroke="#b39463" strokeOpacity=".6" />
        <path d="M-10-3C-4-9 5-9 11-3C5-5-4-5-10-3Z" fill="#7a9a36" />
        <path d="M-8-3.5C-3-7 4-7 9-3.5" stroke="#8a4f67" strokeWidth="1.3" fill="none" />
        <path d="M-9 5C-3 8 4 8 9 5" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" fill="none" />
      </>
    ),
  },
  walnut: {
    size: [32, 30],
    colors: ['#c99a62', '#8a5f33'],
    draw: (g) => (
      <>
        <circle r="15" fill={`url(#${g})`} />
        <path d="M0-15C-3-5 3 5 0 15" stroke="#6b4522" strokeWidth="1.6" fill="none" />
        <path d="M-10-8C-6-6-9-1-5 1S-8 8-10 9M10-8C6-5 9 0 5 2S8 8 9 10M-4-12C-6-9-3-7-5-4M5-12C7-9 4-7 6-4" stroke="#6b4522" strokeOpacity=".6" strokeWidth="1.1" fill="none" />
        <circle cx="-5" cy="-7" r="4" fill="#fff" opacity=".15" />
      </>
    ),
  },
  raisin: {
    size: [18, 16],
    colors: ['#6b2a3f', '#2e0f1a'],
    draw: (g) => (
      <>
        <path d="M-8-2C-7-8 3-9 7-4 10 1 6 8 0 8-6 8-9 3-8-2Z" fill={`url(#${g})`} />
        <path d="M-4-4C-2-1-5 2-2 4M3-5C1-2 4 1 2 4" stroke="#000" strokeOpacity=".3" strokeWidth="1" fill="none" />
        <circle cx="-3" cy="-4" r="1.6" fill="#fff" opacity=".35" />
      </>
    ),
  },
  goldenRaisin: {
    size: [18, 16],
    colors: ['#e0a94a', '#a8691c'],
    draw: (g) => ITEMS.raisin.draw(g),
  },
  date: {
    size: [36, 20],
    colors: ['#8a3d1c', '#3d160a'],
    draw: (g) => (
      <>
        <ellipse rx="17" ry="9" fill={`url(#${g})`} />
        <path d="M-10-2C-4 0 2-3 9 0M-8 4C-2 5 4 3 10 4" stroke="#000" strokeOpacity=".25" strokeWidth="1" fill="none" />
        <ellipse cx="-4" cy="-4.5" rx="8" ry="2" fill="#fff" opacity=".28" />
      </>
    ),
  },
  apricot: {
    size: [32, 26],
    colors: ['#f7a23c', '#d7641a'],
    draw: (g) => (
      <>
        <ellipse rx="15" ry="12" fill={`url(#${g})`} />
        <path d="M-2-11C-6-3-5 5 1 11" stroke="#b44d10" strokeOpacity=".55" strokeWidth="1.5" fill="none" />
        <path d="M-9-5C-7-8-4-9-1-9" stroke="#fff" strokeOpacity=".45" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  fig: {
    size: [30, 28],
    colors: ['#c49a62', '#86582d'],
    draw: (g) => (
      <>
        <path d="M0-14C4-14 3-9 7-8 14-6 16 3 13 8 9 14-9 14-13 8-16 3-14-6-7-8-3-9-4-14 0-14Z" fill={`url(#${g})`} />
        {[[-5, 0], [3, 3], [-2, 7], [6, -2], [-8, 5]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.9" fill="#f3e2c0" opacity=".7" />
        ))}
        <path d="M-7-4C-5-6-2-7 1-7" stroke="#fff" strokeOpacity=".3" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  mango: {
    size: [50, 40],
    colors: ['#fbd34a', '#f08a24'],
    draw: (g) => (
      <>
        <path d="M-22 4C-24-14 0-22 16-12 26-4 22 14 6 18-10 22-20 16-22 4Z" fill={`url(#${g})`} />
        <path d="M-22 4C-24-14 0-22 16-12 8-12-6-6-12 2-15 7-18 8-22 4Z" fill="#e2452b" opacity=".35" />
        <path d="M16-12L20-17" stroke="#5b3a1a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M20-17C26-24 36-22 38-18 30-14 24-14 20-17Z" fill="#3f8a3a" />
        <ellipse cx="-4" cy="-8" rx="9" ry="3.5" fill="#fff" opacity=".3" transform="rotate(-12)" />
      </>
    ),
  },
  pomegranate: {
    size: [44, 46],
    colors: ['#d8323f', '#86101c'],
    draw: (g) => (
      <>
        <circle r="20" cy="3" fill={`url(#${g})`} />
        <path d="M-6-16L-8-23-3-19 0-25 3-19 8-23 6-16Z" fill="#7d0f1c" />
        <ellipse cx="-8" cy="-4" rx="6" ry="4" fill="#fff" opacity=".22" />
      </>
    ),
  },
  apple: {
    size: [42, 44],
    colors: ['#e2393a', '#9c1515'],
    draw: (g) => (
      <>
        <path d="M0-12C-8-20-22-16-21-1-20 12-10 22 0 18 10 22 20 12 21-1 22-16 8-20 0-12Z" fill={`url(#${g})`} />
        <path d="M0-12C0-17 1-20 3-23" stroke="#5b3a1a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M3-19C9-25 16-22 17-19 11-16 6-16 3-19Z" fill="#4c9a3a" />
        <ellipse cx="-10" cy="-5" rx="4" ry="6" fill="#fff" opacity=".25" transform="rotate(20 -10 -5)" />
      </>
    ),
  },
  grape: {
    size: [20, 20],
    colors: ['#b9d65a', '#6f9a26'],
    draw: (g) => (
      <>
        <circle r="9" fill={`url(#${g})`} />
        <circle cx="-3" cy="-3" r="2.4" fill="#fff" opacity=".45" />
      </>
    ),
  },
  orange: {
    size: [42, 42],
    colors: ['#ffa53a', '#e2650c'],
    draw: (g) => (
      <>
        <circle r="19" fill={`url(#${g})`} />
        {[[-7, 2], [4, 8], [9, -3], [-2, -8], [-10, -6], [2, 0], [-4, 11], [11, 7]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.9" fill="#b84c05" opacity=".45" />
        ))}
        <circle cx="0" cy="-17" r="2" fill="#5d7a2a" />
        <ellipse cx="-7" cy="-7" rx="5" ry="3.5" fill="#fff" opacity=".3" transform="rotate(-30 -7 -7)" />
      </>
    ),
  },
  banana: {
    size: [56, 30],
    colors: ['#fbe25a', '#e3b21e'],
    draw: (g) => (
      <>
        <path d="M-26-6C-18 10 14 12 26-4 24-2 22 0 20-1 8 6-12 6-22-8Z" fill={`url(#${g})`} stroke="#b88a14" strokeOpacity=".5" />
        <path d="M-26-6L-28-10" stroke="#5b3a1a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="25" cy="-3.5" r="1.8" fill="#4a3210" />
        <path d="M-16 2C-6 7 8 6 18 0" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" fill="none" />
      </>
    ),
  },
}

const SCENES = {
  almond: { items: ['almond'], bg: ['#fbe9d7', '#f2c9a0'], vessel: 'bowl', scale: 1 },
  cashew: { items: ['cashew'], bg: ['#fdf3dc', '#efd6a2'], vessel: 'bowl', scale: 1 },
  pistachio: { items: ['pistachio'], bg: ['#eef4dc', '#cfdea6'], vessel: 'bowl', scale: 1 },
  walnut: { items: ['walnut'], bg: ['#f6ead9', '#dcc1a0'], vessel: 'bowl', scale: 1 },
  raisin: { items: ['raisin', 'raisin', 'goldenRaisin'], bg: ['#f6e6ea', '#dfb8c3'], vessel: 'bowl', scale: 1.15 },
  date: { items: ['date'], bg: ['#f7e3d6', '#e1b394'], vessel: 'bowl', scale: 1 },
  apricot: { items: ['apricot'], bg: ['#fff0dc', '#f8c98d'], vessel: 'bowl', scale: 1 },
  fig: { items: ['fig'], bg: ['#f4eadb', '#d8bf9a'], vessel: 'bowl', scale: 1 },
  mango: { items: ['mango'], bg: ['#fff6d6', '#fbd77c'], vessel: 'crate', scale: 0.85 },
  pomegranate: { items: ['pomegranate'], bg: ['#fde4e4', '#f2a7ab'], vessel: 'crate', scale: 0.85 },
  apple: { items: ['apple'], bg: ['#fde6e2', '#f3b0a6'], vessel: 'crate', scale: 0.85 },
  grape: { items: ['grape'], bg: ['#eff6d9', '#cfe39c'], vessel: 'crate', scale: 1.05 },
  orange: { items: ['orange'], bg: ['#fff0dc', '#fbc98a'], vessel: 'crate', scale: 0.85 },
  banana: { items: ['banana'], bg: ['#fffadf', '#f5e08d'], vessel: 'crate', scale: 1.15 },
  mixed: {
    items: ['almond', 'cashew', 'pistachio', 'walnut', 'apricot', 'date', 'fig', 'raisin', 'goldenRaisin'],
    bg: null,
    vessel: 'bowl',
    scale: 1,
  },
}

function buildPile({ kinds, seed, cx, baseY, width, scale, rows }) {
  const rand = rng(seed)
  const out = []
  for (let r = 0; r < rows; r++) {
    const rowW = width * (1 - (r / rows) * 0.85)
    const kind0 = ITEMS[kinds[0]]
    const step = kind0.size[0] * scale * 0.72
    const n = Math.max(1, Math.floor(rowW / step))
    const y = baseY - r * kind0.size[1] * scale * 0.72
    for (let i = 0; i < n; i++) {
      const kind = kinds[Math.floor(rand() * kinds.length)]
      const x = cx - rowW / 2 + step * (i + 0.5) + (rand() - 0.5) * step * 0.5
      out.push({ kind, x, y: y + (rand() - 0.5) * 6, rot: (rand() - 0.5) * 80, s: scale * (0.9 + rand() * 0.2) })
    }
  }
  // Draw the top of the heap first so nearer items overlap it.
  return out.reverse()
}

function Defs({ uid, kinds }) {
  return (
    <defs>
      {kinds.map((k) => (
        <linearGradient key={k} id={`${uid}-${k}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={ITEMS[k].colors[0]} />
          <stop offset="1" stopColor={ITEMS[k].colors[1]} />
        </linearGradient>
      ))}
      <linearGradient id={`${uid}-bowl`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9a5b2c" />
        <stop offset="1" stopColor="#5a3015" />
      </linearGradient>
      <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d7a86a" />
        <stop offset="1" stopColor="#a8773f" />
      </linearGradient>
      <radialGradient id={`${uid}-shadow`}>
        <stop offset="0" stopColor="#000" stopOpacity=".28" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

function Item({ uid, it }) {
  return (
    <g transform={`translate(${it.x.toFixed(1)} ${it.y.toFixed(1)}) rotate(${it.rot.toFixed(1)}) scale(${it.s.toFixed(2)})`}>
      {ITEMS[it.kind].draw(`${uid}-${it.kind}`)}
    </g>
  )
}

// A bowl (dry fruits) or a wooden crate (fresh fruits) filled with fruit.
function Vessel({ uid, scene, seed, cx, cy, w }) {
  const kinds = SCENES[scene].items
  const { vessel, scale } = SCENES[scene]
  const h = w * 0.36
  const pile = buildPile({
    kinds,
    seed,
    cx,
    baseY: cy + h * 0.1,
    width: w * 0.9,
    scale: scale * (w / 260),
    rows: vessel === 'bowl' ? 5 : 4,
  })
  const loose = buildPile({ kinds, seed: seed + 7, cx: cx + w * 0.42, baseY: cy + h * 1.05, width: w * 0.35, scale: scale * (w / 260), rows: 1 })

  return (
    <g>
      <ellipse cx={cx} cy={cy + h * 1.08} rx={w * 0.62} ry={h * 0.18} fill={`url(#${uid}-shadow)`} />
      {vessel === 'bowl' ? (
        <>
          <ellipse cx={cx} cy={cy} rx={w / 2} ry={h * 0.28} fill="#3d1f0c" />
          {pile.map((it, i) => <Item key={i} uid={uid} it={it} />)}
          <path
            d={`M${cx - w / 2} ${cy} Q${cx - w / 2 + 6} ${cy + h} ${cx} ${cy + h} Q${cx + w / 2 - 6} ${cy + h} ${cx + w / 2} ${cy} A${w / 2} ${h * 0.28} 0 0 1 ${cx - w / 2} ${cy}Z`}
            fill={`url(#${uid}-bowl)`}
          />
          <path d={`M${cx - w / 2 + 14} ${cy + h * 0.3} Q${cx - w / 3} ${cy + h * 0.8} ${cx - w / 6} ${cy + h * 0.88}`} stroke="#fff" strokeOpacity=".18" strokeWidth="5" fill="none" strokeLinecap="round" />
          <ellipse cx={cx} cy={cy + h * 0.98} rx={w * 0.2} ry={h * 0.07} fill="#4a260f" />
        </>
      ) : (
        <>
          <rect x={cx - w / 2} y={cy - h * 0.25} width={w} height={h * 0.3} fill="#8a5a2b" />
          {pile.map((it, i) => <Item key={i} uid={uid} it={it} />)}
          {[0, 1, 2].map((k) => (
            <rect key={k} x={cx - w / 2} y={cy + k * h * 0.34} width={w} height={h * 0.3} rx="3" fill={`url(#${uid}-wood)`} stroke="#8a5a2b" strokeWidth="1.5" />
          ))}
          <rect x={cx - w / 2} y={cy - h * 0.05} width={w * 0.06} height={h * 1.08} fill="#9b6a35" />
          <rect x={cx + w / 2 - w * 0.06} y={cy - h * 0.05} width={w * 0.06} height={h * 1.08} fill="#9b6a35" />
        </>
      )}
      {loose.slice(0, 2).map((it, i) => <Item key={`l${i}`} uid={uid} it={it} />)}
    </g>
  )
}

export default function FruitArt({ art, seed = 3, className, title }) {
  const uid = useId().replace(/:/g, '')
  const key = SCENES[art]?.bg ? art : 'almond'
  const scene = SCENES[key]
  return (
    <svg className={className} viewBox="0 0 400 280" role="img" aria-label={title ?? art} preserveAspectRatio="xMidYMid slice">
      <Defs uid={uid} kinds={Object.keys(ITEMS)} />
      <radialGradient id={`${uid}-bg`} cx="0.5" cy="0.35" r="0.8">
        <stop offset="0" stopColor={scene.bg[0]} />
        <stop offset="1" stopColor={scene.bg[1]} />
      </radialGradient>
      <rect width="400" height="280" fill={`url(#${uid}-bg)`} />
      <circle cx="330" cy="60" r="70" fill="#fff" opacity=".25" />
      <circle cx="60" cy="230" r="50" fill="#fff" opacity=".15" />
      <Vessel uid={uid} scene={key} seed={seed} cx={200} cy={150} w={250} />
    </svg>
  )
}

// Large mixed bowl for the hero, drawn on a transparent background.
export function HeroBowl({ className }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className={className} viewBox="0 0 520 420" role="img" aria-label="A bowl of mixed dry fruits: almonds, cashews, pistachios, walnuts, apricots, dates, figs and raisins">
      <Defs uid={uid} kinds={Object.keys(ITEMS)} />
      <Vessel uid={uid} scene="mixed" seed={11} cx={260} cy={220} w={400} />
    </svg>
  )
}
