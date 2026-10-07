import crypto from 'node:crypto'
import { HttpError } from './http.js'

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest()

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD

export function passwordMatches(input) {
  if (!adminConfigured()) return false
  return crypto.timingSafeEqual(sha(input ?? ''), sha(process.env.ADMIN_PASSWORD))
}

// The signing key is derived from the password, so changing ADMIN_PASSWORD
// logs everyone out.
const signingKey = () => sha(`faiz-fayez-admin:${process.env.ADMIN_SECRET || ''}:${process.env.ADMIN_PASSWORD}`)

export function issueToken(hours = 12) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + hours * 3_600_000 })).toString('base64url')
  const sig = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyToken(token) {
  if (!adminConfigured() || typeof token !== 'string') return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const expected = crypto.createHmac('sha256', signingKey()).update(payload).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return false
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now()
  } catch {
    return false
  }
}

export function requireAdmin(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!verifyToken(token)) throw new HttpError(401, 'Your session has expired. Please log in again.')
}
