// Small helpers shared by the Vercel functions in /api and the local dev server.

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function readJson(req, limit = 4_400_000) {
  // Vercel parses JSON bodies itself; the Vite dev server does not.
  try {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}')
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new HttpError(413, 'The request is too large.')
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
}

export function send(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

// Wraps a handler so thrown HttpErrors become JSON responses.
export function route(methods) {
  return async (req, res) => {
    const fn = methods[req.method]
    if (!fn) return send(res, 405, { error: 'Method not allowed' })
    try {
      await fn(req, res)
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500
      if (!(err instanceof HttpError)) console.error(err)
      send(res, status, { error: status >= 500 && !(err instanceof HttpError) ? 'Something went wrong on the server.' : err.message })
    }
  }
}
