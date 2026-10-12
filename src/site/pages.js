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

// Each product has its own page at /products/<slug>, e.g. /products/dried-figs.
export const productSlug = (title) => String(title || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-')
export const productPath = (title) => `/products/${productSlug(title)}`
export const PRODUCT_PAGE = 'product:'
export const isProductPage = (pageId) => String(pageId || '').startsWith(PRODUCT_PAGE)
export const findProduct = (content, pageId) => (isProductPage(pageId)
  ? (content.products?.items || []).find((p) => p.title && productSlug(p.title) === pageId.slice(PRODUCT_PAGE.length))
  : null)

export function pageForPath(pathname) {
  const clean = `/${String(pathname || '').replace(/\/index\.html$/, '').replace(/^\/+|\/+$/g, '')}`
  const product = clean.match(/^\/products\/([\w-]+)$/)
  if (product) return `${PRODUCT_PAGE}${product[1]}`
  return PAGES.find((p) => p.path === clean)?.id || 'home'
}

// Which page a home-page section links to with its "see more" link.
export const pageOfSection = (sectionId) => PAGES.find((p) => p.sections.includes(sectionId))
