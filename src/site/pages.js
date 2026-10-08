// The website's pages. The home page shows every section; each other page
// shows a group of them under its own banner. Texts, photos and menu names
// for each page come from `content.pages`.

export const PAGES = [
  { id: 'track-record', path: '/track-record', sections: ['record', 'shipments'] },
  { id: 'products', path: '/products', sections: ['products', 'gallery'] },
  { id: 'shipping', path: '/shipping', sections: ['destinations'] },
  { id: 'about', path: '/about', sections: ['about', 'certifications', 'testimonials', 'faq'] },
  { id: 'contact', path: '/contact', sections: ['contact'] },
]

export const PAGE_NAMES = {
  'track-record': 'Track record', products: 'Products', shipping: 'Shipping', about: 'About', contact: 'Contact',
}

export const pageById = (id) => PAGES.find((p) => p.id === id)

export function pageForPath(pathname) {
  const clean = `/${String(pathname || '').replace(/^\/+|\/+$/g, '').replace(/\/index\.html$/, '')}`
  return PAGES.find((p) => p.path === clean)?.id || 'home'
}

// Which page a home-page section links to with its "see more" link.
export const pageOfSection = (sectionId) => PAGES.find((p) => p.sections.includes(sectionId))

// The browser-tab title for a page (the same as the prerendered pages use).
export function titleFor(content, pageId) {
  const p = content.pages?.[pageId]
  if (pageId === 'home' || !p) return content.meta?.title || content.company?.name || ''
  return `${p.title || p.label} | ${content.company?.name || ''}`
}
