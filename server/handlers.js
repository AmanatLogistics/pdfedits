import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { HttpError, readJson, route, send } from './http.js'
import { adminConfigured, issueToken, passwordMatches, requireAdmin } from './auth.js'
import { CONTENT_PATH, UPLOAD_NAME, validateContent, versionOf } from './content.js'
import { githubConfig, githubStorage } from './storage-github.js'
import { localFiles } from './storage-local.js'

const useLocal = () => process.env.FAIZ_LOCAL_STORAGE === '1'

function storage() {
  if (useLocal()) return localFiles
  const { token, repo } = githubConfig()
  if (token && repo) return githubStorage
  return null
}

function needStorage() {
  const s = storage()
  if (!s) throw new HttpError(503, 'Publishing is not set up yet. Add GITHUB_TOKEN in the Vercel project settings, then redeploy.')
  return s
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

export const status = route({
  GET: async (req, res) => {
    const s = storage()
    // Public, so it only says what is set up, not where.
    send(res, 200, {
      adminPassword: adminConfigured(),
      publishing: s ? s.mode : null,
      email: !!process.env.RESEND_API_KEY,
    })
  },
})

export const login = route({
  POST: async (req, res) => {
    if (!adminConfigured()) throw new HttpError(503, 'The admin password is not set. Add ADMIN_PASSWORD in the Vercel project settings, then redeploy.')
    const { password } = await readJson(req)
    if (!passwordMatches(password)) {
      await pause(800)
      throw new HttpError(401, 'Wrong password.')
    }
    send(res, 200, { token: issueToken() })
  },
})

export const content = route({
  GET: async (req, res) => {
    requireAdmin(req)
    const { text } = await needStorage().read()
    send(res, 200, { content: JSON.parse(text), version: versionOf(text) })
  },
  POST: async (req, res) => {
    requireAdmin(req)
    const s = needStorage()
    const body = await readJson(req)
    const text = validateContent(body.content)
    const uploads = (Array.isArray(body.uploads) ? body.uploads : [])
      .filter((u) => u && UPLOAD_NAME.test(u.name) && typeof u.blob === 'string' && /^[0-9a-f]{40}$|^local$/.test(u.blob))
      .filter((u) => text.includes(`/uploads/${u.name}`) && u.blob !== 'local')
    // Refuse to overwrite changes someone else published after this editor loaded.
    const current = await s.read()
    if (body.version && body.version !== versionOf(current.text)) {
      throw new HttpError(409, 'The website was changed by someone else since you opened the admin panel. Reload to get the latest version.')
    }
    if (current.text === text && !uploads.length) return send(res, 200, { ok: true, unchanged: true, version: versionOf(text), mode: s.mode })
    const result = await s.publish({ text, uploads, message: 'Update website content from the admin panel' })
    send(res, 200, { ok: true, version: versionOf(text), mode: s.mode, ...result })
  },
})

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

export const upload = route({
  POST: async (req, res) => {
    requireAdmin(req)
    const s = needStorage()
    const { name, type, data } = await readJson(req)
    const ext = TYPES[type]
    if (!ext) throw new HttpError(400, 'Only JPG, PNG, WebP or GIF images can be uploaded.')
    const buffer = Buffer.from(String(data || ''), 'base64')
    if (!buffer.length) throw new HttpError(400, 'The file is empty.')
    if (buffer.length > 3_200_000) throw new HttpError(413, 'The image is too large. Please use a smaller photo.')
    const base = String(name || 'image').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'image'
    const fileName = `${base}-${Date.now().toString(36)}.${ext}`
    const result = await s.upload({ name: fileName, buffer })
    send(res, 200, { name: fileName, ...result })
  },
})

// Website inquiry form. Sends an email through Resend when RESEND_API_KEY is
// set; otherwise answers 501 and the page falls back to the visitor's email app.
// eslint-disable-next-line no-control-regex
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max)
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

async function siteContent() {
  return JSON.parse(await readFile(path.join(process.cwd(), CONTENT_PATH), 'utf8'))
}

export const inquiry = route({
  POST: async (req, res) => {
    const body = await readJson(req, 100_000)
    if (clean(body.website, 200)) return send(res, 200, { ok: true }) // spam trap
    const f = {
      type: clean(body.type, 80) || 'Inquiry',
      name: clean(body.name, 120),
      company: clean(body.company, 160),
      email: clean(body.email, 200),
      phone: clean(body.phone, 40),
      country: clean(body.country, 80),
      product: clean(body.product, 160),
      quantity: clean(body.quantity, 80),
      message: clean(body.message, 5000),
    }
    if (!f.name || !f.message) throw new HttpError(400, 'Please fill in your name and message.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) throw new HttpError(400, 'Please enter a valid email address.')
    if (!process.env.RESEND_API_KEY) throw new HttpError(501, 'Email sending is not set up.')

    const { company } = await siteContent()
    const to = body.partnership && company.partnershipEmail ? company.partnershipEmail : company.email
    const rows = [
      ['Inquiry', f.type], ['Name', f.name], ['Company', f.company], ['Email', f.email], ['Phone', f.phone],
      ['Country', f.country], ['Product', f.product], ['Quantity', f.quantity],
    ].filter(([, v]) => v)
    const subject = `${f.type}${f.product ? ` – ${f.product}` : ''} – ${f.name}${f.company ? `, ${f.company}` : ''}`
    const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${f.message}`
    const html = `<table style="font:14px/1.5 Arial,sans-serif;border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#777">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table><p style="font:15px/1.6 Arial,sans-serif;white-space:pre-wrap">${esc(f.message)}</p>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.INQUIRY_FROM || `${company.name} Website <onboarding@resend.dev>`,
        to: [to],
        reply_to: f.email,
        subject,
        text,
        html,
      }),
    })
    if (!r.ok) {
      console.error('Resend error', r.status, await r.text().catch(() => ''))
      throw new HttpError(502, 'The message could not be sent.')
    }
    send(res, 200, { ok: true })
  },
})
