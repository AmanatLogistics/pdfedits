// Runs after `vite build`: renders the website to static HTML with the current
// content, so the page shows instantly, search engines read it, and link
// previews (WhatsApp, LinkedIn, …) get the right title, text and picture.
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const content = JSON.parse(readFileSync(path.join(root, 'src/content/site.json'), 'utf8'))
const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href)
const { fontsHref } = await import(pathToFileURL(path.join(root, 'src/site/theme.js')).href)
const { responsiveSet } = await import(pathToFileURL(path.join(root, 'src/site/images.js')).href)

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const siteUrl = String(content.meta?.siteUrl || '').replace(/\/+$/, '')
const absolute = (src) => {
  if (!src) return ''
  if (/^https?:\/\//.test(src)) return src
  return siteUrl ? `${siteUrl}${src.startsWith('/') ? '' : '/'}${src}` : ''
}

const title = content.meta?.title || content.company?.name || ''
const description = content.meta?.description || ''
const image = absolute(content.meta?.shareImage || content.hero?.image?.src)
const fonts = fontsHref(content.theme || {})
// Start downloading the built-in font and the top photo straight away.
const fontFile = readdirSync(path.join(root, 'dist/assets')).find((f) => /^manrope-latin-wght-normal-.*\.woff2$/.test(f))
const heroSrc = content.hero?.image?.src
const heroSet = responsiveSet(heroSrc)

const head = [
  `<meta name="description" content="${esc(description)}" />`,
  `<meta name="theme-color" content="${esc(content.theme?.dark || '#1e130b')}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:site_name" content="${esc(content.company?.name)}" />`,
  `<meta property="og:title" content="${esc(title)}" />`,
  `<meta property="og:description" content="${esc(description)}" />`,
  image && `<meta property="og:image" content="${esc(image)}" />`,
  `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
  siteUrl && `<link rel="canonical" href="${esc(siteUrl)}/" />`,
  siteUrl && `<meta property="og:url" content="${esc(siteUrl)}/" />`,
  fontFile && `<link rel="preload" href="/assets/${fontFile}" as="font" type="font/woff2" crossorigin />`,
  heroSet && '<link rel="preconnect" href="https://images.pexels.com" />',
  heroSrc && (heroSet
    ? `<link rel="preload" as="image" href="${esc(heroSet.src)}" imagesrcset="${esc(heroSet.srcSet)}" imagesizes="100vw" fetchpriority="high" />`
    : `<link rel="preload" as="image" href="${esc(heroSrc)}" fetchpriority="high" />`),
  fonts && '<link rel="preconnect" href="https://fonts.googleapis.com" />',
  fonts && '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  fonts && `<link rel="stylesheet" href="${esc(fonts)}" />`,
  `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: content.company?.name,
    description,
    email: content.company?.email || undefined,
    telephone: content.company?.phone || undefined,
    address: content.company?.address || undefined,
    foundingDate: content.company?.since ? String(content.company.since) : undefined,
    url: siteUrl || undefined,
  }).replace(/</g, '\\u003c')}</script>`,
].filter(Boolean).join('\n    ')

const file = path.join(root, 'dist/index.html')
let html = readFileSync(file, 'utf8')
html = html
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
  .replace('<!--app-head-->', head)
  .replace('<div id="root"></div>', `<div id="root">${render(content)}</div>`)
  // Put the site's stylesheet inside the page, saving a round trip before
  // anything can be drawn — this matters most on slow mobile connections.
  .replace(/<link rel="stylesheet" crossorigin href="\/assets\/(main-[\w-]+\.css)">/, (tag, name) => {
    const css = readFileSync(path.join(root, 'dist/assets', name), 'utf8')
    return css.includes('</style') ? tag : `<style>${css}</style>`
  })
writeFileSync(file, html)

writeFileSync(path.join(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ''}`)
if (siteUrl) {
  writeFileSync(path.join(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(siteUrl)}/</loc></url></urlset>\n`)
}
rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`Prerendered dist/index.html (${Math.round(html.length / 1024)} KB)`)
