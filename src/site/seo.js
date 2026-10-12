// What search engines and link previews see for each page: the title and
// description (editable per page in the admin panel) and the structured data
// that tells Google what the business is, what it sells and its FAQ.

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

// The Google headline and description for a page.
export function pageSeo(content, pageId) {
  const company = content.company?.name || ''
  if (pageId === 'home' || !content.pages?.[pageId]) {
    return { title: clean(content.meta?.title) || company, description: clean(content.meta?.description) }
  }
  const p = content.pages[pageId]
  return {
    title: clean(p.seoTitle) || `${clean(p.title || p.label)} | ${company}`,
    description: clean(p.seoDescription) || clean(p.text) || clean(content.meta?.description),
  }
}

// The address the website is published at, without a trailing slash.
export const baseUrl = (content, fallback = '') => String(content.meta?.siteUrl || fallback || '').replace(/\/+$/, '')

const PAGE_PATHS = { 'track-record': '/track-record', products: '/products', shipping: '/shipping', about: '/about', contact: '/contact' }

// schema.org data for a page, as a list of objects for <script type="application/ld+json">.
export function structuredData(content, pageId, siteUrl) {
  const c = content.company || {}
  const abs = (src) => (!src ? undefined : /^https?:\/\//.test(src) ? src : siteUrl ? `${siteUrl}${src.startsWith('/') ? '' : '/'}${src}` : undefined)
  const orgId = siteUrl ? `${siteUrl}/#organization` : undefined
  const [city, country] = String(c.address || '').split(',').map((s) => s.trim())
  const products = (content.products?.items || []).filter((p) => p.title)
  const out = []

  if (pageId === 'home') {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': orgId,
      name: c.name,
      alternateName: c.tagline ? `${c.name} – ${c.tagline}` : undefined,
      description: clean(content.meta?.description) || undefined,
      url: siteUrl || undefined,
      logo: abs(c.logo) || abs('/favicon.svg'),
      image: abs(content.meta?.shareImage || content.hero?.image?.src),
      email: c.email || undefined,
      telephone: c.phone || undefined,
      foundingDate: c.since ? String(c.since) : undefined,
      address: c.address ? { '@type': 'PostalAddress', addressLocality: city || c.address, addressCountry: country || undefined } : undefined,
      areaServed: 'Worldwide',
      knowsAbout: ['Dry fruits', 'Dried fruit export', ...products.map((p) => p.title)],
      contactPoint: c.email || c.phone ? [{ '@type': 'ContactPoint', contactType: 'sales', email: c.email || undefined, telephone: c.phone || undefined, availableLanguage: ['English', 'Pashto', 'Dari'] }] : undefined,
      sameAs: [c.whatsapp && `https://wa.me/${String(c.whatsapp).replace(/\D/g, '')}`].filter(Boolean),
    })
    out.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: c.name, url: siteUrl || undefined, publisher: orgId ? { '@id': orgId } : undefined })
  }

  if (pageId === 'products' && products.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: clean(content.products?.title) || 'Products',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.title,
          category: p.tag || undefined,
          image: abs(p.image?.src),
          description: [p.image?.alt, p.season && `Season: ${p.season}`].filter(Boolean).join('. ') || undefined,
          countryOfOrigin: 'Afghanistan',
          brand: { '@type': 'Brand', name: c.name },
        },
      })),
    })
  }

  const faq = (content.faq?.items || []).filter((f) => f.q && f.a)
  const faqVisible = content.sections?.some((s) => s.id === 'faq' && s.visible)
  if (pageId === 'about' && faq.length && faqVisible) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: clean(f.q), acceptedAnswer: { '@type': 'Answer', text: clean(f.a) } })),
    })
  }

  if (pageId !== 'home' && siteUrl && PAGE_PATHS[pageId]) {
    const p = content.pages?.[pageId] || {}
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: clean(p.label || p.title || pageId), item: `${siteUrl}${PAGE_PATHS[pageId]}` },
      ],
    })
  }
  return out
}
