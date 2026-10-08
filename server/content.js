import crypto from 'node:crypto'
import { HttpError } from './http.js'

export const CONTENT_PATH = 'src/content/site.json'
export const UPLOAD_DIR = 'public/uploads'
export const UPLOAD_NAME = /^[a-z0-9][a-z0-9-]{0,80}\.(jpg|jpeg|png|webp|gif)$/

const REQUIRED = ['meta', 'theme', 'company', 'sections', 'hero', 'records']
// Web addresses, or files on this website such as /uploads/photo.jpg or /partners/logo.png.
const SAFE_LINK = /^(https:\/\/|\/(?!\/)(?!.*\.\.)[\w\-./%]+$)/

export const versionOf = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)

export function serialize(content) {
  return `${JSON.stringify(content, null, 2)}\n`
}

// Basic shape checks so a broken save cannot take the website down.
export function validateContent(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) throw new HttpError(400, 'Content must be an object.')
  for (const key of REQUIRED) {
    if (!(key in content)) throw new HttpError(400, `Content is missing "${key}".`)
  }
  if (!Array.isArray(content.sections) || !Array.isArray(content.records)) throw new HttpError(400, 'Sections and trade records must be lists.')
  if (content.records.length > 20000) throw new HttpError(400, 'Too many trade records (the limit is 20,000).')
  if (typeof content.company?.name !== 'string' || !content.company.name.trim()) throw new HttpError(400, 'The company name cannot be empty.')
  const text = serialize(content)
  if (text.length > 1_000_000) throw new HttpError(400, 'Content is too large.')
  // Every image must be a web address or an uploaded file.
  const bad = []
  const walk = (v, path) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`))
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, path ? `${path}.${k}` : k))
    else if (typeof v === 'string' && /(^|\.)(src|fallback|creditUrl|logo|shareImage|link|mapEmbedUrl)$/.test(path) && v && !SAFE_LINK.test(v)) bad.push(path)
  }
  walk(content, '')
  if (bad.length) throw new HttpError(400, `These links must start with https:// or be files on this website: ${bad.join(', ')}`)
  return text
}
