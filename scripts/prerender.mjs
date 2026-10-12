// Runs after `vite build`: renders the website to static HTML with the current
// content, so the page shows instantly, search engines read it, and link
// previews (WhatsApp, LinkedIn, …) get the right title, text and picture.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const content = JSON.parse(readFileSync(path.join(root, 'src/content/site.json'), 'utf8'))
const { render, livePages } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href)
const { fontsHref } = await import(pathToFileURL(path.join(root, 'src/site/theme.js')).href)
const { responsiveSet } = await import(pathToFileURL(path.join(root, 'src/site/images.js')).href)
const { pageSeo, structuredData, baseUrl } = await import(pathToFileURL(path.join(root, 'src/site/seo.js')).href)
const { productPath, productSlug, PRODUCT_PAGE } = await import(pathToFileURL(path.join(root, 'src/site/pages.js')).href)

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
// The address set in the admin panel, or else the one Vercel publishes the site at.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''
const siteUrl = baseUrl(content, vercelUrl)
const absolute = (src) => {
  if (!src) return ''
  if (/^https?:\/\//.test(src)) return src
  return siteUrl ? `${siteUrl}${src.startsWith('/') ? '' : '/'}${src}` : ''
}

const fonts = fontsHref(content.theme || {})
// Start downloading the built-in font straight away.
const fontFile = readdirSync(path.join(root, 'dist/assets')).find((f) => /^manrope-latin-wght-normal-.*\.woff2$/.test(f))
const template = readFileSync(path.join(root, 'dist/index.html'), 'utf8')
const cssName = template.match(/<link rel="stylesheet" crossorigin href="\/assets\/(main-[\w-]+\.css)">/)?.[1]
const css = cssName ? readFileSync(path.join(root, 'dist/assets', cssName), 'utf8') : ''

function headFor({ id, title, description, url, heroSrc, imageAlt }) {
  const image = absolute(content.meta?.shareImage || heroSrc || content.hero?.image?.src)
  const heroSet = responsiveSet(heroSrc)
  const ld = structuredData(content, id, siteUrl)
  return [
    `<meta name="description" content="${esc(description)}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    content.meta?.googleVerification && `<meta name="google-site-verification" content="${esc(content.meta.googleVerification)}" />`,
    `<meta name="theme-color" content="${esc(content.theme?.dark || '#0f2018')}" />`,
    `<meta property="og:type" content="website" />`,
    '<meta property="og:locale" content="en_US" />',
    `<meta property="og:site_name" content="${esc(content.company?.name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    image && `<meta property="og:image" content="${esc(image)}" />`,
    image && imageAlt && `<meta property="og:image:alt" content="${esc(imageAlt)}" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    siteUrl && `<link rel="canonical" href="${esc(siteUrl + url)}" />`,
    siteUrl && `<meta property="og:url" content="${esc(siteUrl + url)}" />`,
    fontFile && `<link rel="preload" href="/assets/${fontFile}" as="font" type="font/woff2" crossorigin />`,
    heroSet && '<link rel="preconnect" href="https://images.pexels.com" />',
    heroSrc && (heroSet
      ? `<link rel="preload" as="image" href="${esc(heroSet.src)}" imagesrcset="${esc(heroSet.srcSet)}" imagesizes="100vw" fetchpriority="high" />`
      : `<link rel="preload" as="image" href="${esc(heroSrc)}" fetchpriority="high" />`),
    fonts && '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    fonts && '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    fonts && `<link rel="stylesheet" href="${esc(fonts)}" />`,
    ...ld.map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`),
  ].filter(Boolean).join('\n    ')
}

function writePage({ id, url, heroSrc, imageAlt }) {
  const { title, description } = pageSeo(content, id)
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace('<!--app-head-->', headFor({ id, title, description, url, heroSrc, imageAlt }))
    .replace('<div id="root"></div>', `<div id="root" data-page="${id}">${render(content, id)}</div>`)
    // Put the site's stylesheet inside the page, saving a round trip before
    // anything can be drawn — this matters most on slow mobile connections.
    .replace(/<link rel="stylesheet" crossorigin href="\/assets\/main-[\w-]+\.css">/, (tag) => (css && !css.includes('</style') ? `<style>${css}</style>` : tag))
  const file = url === '/' ? path.join(root, 'dist/index.html') : path.join(root, 'dist', url, 'index.html')
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, html)
  return Math.round(html.length / 1024)
}

const pages = livePages(content)
const sizes = [`/ (${writePage({ id: 'home', url: '/', heroSrc: content.hero?.image?.src, imageAlt: content.hero?.image?.alt })} KB)`]
for (const p of pages) {
  const kb = writePage({ id: p.id, url: p.path, heroSrc: p.image?.src, imageAlt: p.image?.alt })
  sizes.push(`${p.path} (${kb} KB)`)
}
// Each product's own page, when the products page is shown.
const productUrls = []
if (pages.some((p) => p.id === 'products')) {
  for (const item of (content.products?.items || []).filter((x) => x.title && productSlug(x.title))) {
    const url = productPath(item.title)
    writePage({ id: `${PRODUCT_PAGE}${productSlug(item.title)}`, url, heroSrc: item.image?.src, imageAlt: item.image?.alt })
    productUrls.push(url)
  }
  sizes.push(`${productUrls.length} product pages`)
}

writeFileSync(path.join(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ''}`)
if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = ['/', ...pages.map((p) => p.path), ...productUrls].map((u) => `<url><loc>${esc(siteUrl + u)}</loc><lastmod>${today}</lastmod><priority>${u === '/' ? '1.0' : u.startsWith('/products/') ? '0.9' : '0.8'}</priority></url>`).join('')
  writeFileSync(path.join(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`)
}
rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`Prerendered ${sizes.join(', ')}`)
