// Tests for the admin API and inquiry form: `npm test`.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import * as mock from './mock-github.mjs'

const port = await mock.ready
Object.assign(process.env, { GITHUB_API_URL: `http://localhost:${port}`, GITHUB_TOKEN: 'good-token', GITHUB_REPO: 'o/r', GITHUB_BRANCH: 'main', ADMIN_PASSWORD: 'pw' })
delete process.env.FAIZ_LOCAL_STORAGE
delete process.env.RESEND_API_KEY
const h = await import('../server/handlers.js')
after(() => mock.server.close())

const call = (fn, method, body, token) => new Promise((resolve) => {
  const req = { method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }
  const res = { statusCode: 0, setHeader() {}, end(d) { resolve({ status: this.statusCode, data: JSON.parse(d) }) } }
  fn(req, res)
})
const login = async () => (await call(h.login, 'POST', { password: 'pw' })).data.token

test('login checks the password and tokens cannot be forged', async () => {
  assert.equal((await call(h.login, 'POST', { password: 'nope' })).status, 401)
  const token = await login()
  assert.equal((await call(h.content, 'GET')).status, 401)
  assert.equal((await call(h.content, 'GET', undefined, `${token.slice(0, -2)}xx`)).status, 401)
  assert.equal((await call(h.content, 'GET', undefined, token)).status, 200)
})

test('publishing commits the content and used uploads in one commit, even if someone pushes meanwhile', async () => {
  const token = await login()
  const got = await call(h.content, 'GET', undefined, token)
  const up = await call(h.upload, 'POST', { name: 'Mango Crate.JPG', type: 'image/jpeg', data: Buffer.from('jpeg').toString('base64') }, token)
  assert.equal(up.status, 200)
  assert.match(up.data.path, /^\/uploads\/mango-crate-[a-z0-9]+\.jpg$/)

  const next = structuredClone(got.data.content)
  next.stats[0].value = 20000
  next.hero.image.src = up.data.path
  mock.race.once = true
  const pub = await call(h.content, 'POST', {
    content: next, version: got.data.version,
    uploads: [{ name: up.data.name, blob: up.data.blob }, { name: 'unused-1.jpg', blob: up.data.blob }],
  }, token)
  assert.equal(pub.status, 200)

  const head = mock.commits.get(mock.refs.get('main'))
  const tree = mock.trees.get(head.tree)
  assert.ok(tree.has(`public/uploads/${up.data.name}`))
  assert.ok(!tree.has('public/uploads/unused-1.jpg'))
  const saved = JSON.parse(mock.blobs.get(tree.get('src/content/site.json')).toString())
  assert.equal(saved.stats[0].value, 20000)
  assert.deepEqual(mock.problems, [])

  const stale = await call(h.content, 'POST', { content: got.data.content, version: got.data.version }, token)
  assert.equal(stale.status, 409)
  const same = await call(h.content, 'POST', { content: next, version: pub.data.version }, token)
  assert.equal(same.data.unchanged, true)
})

test('content and uploads are validated', async () => {
  const token = await login()
  const { data } = await call(h.content, 'GET', undefined, token)
  const bad = structuredClone(data.content)
  bad.hero.image.src = 'javascript:alert(1)'
  assert.equal((await call(h.content, 'POST', { content: bad, version: data.version }, token)).status, 400)
  assert.equal((await call(h.content, 'POST', { content: { hero: {} }, version: data.version }, token)).status, 400)
  assert.equal((await call(h.upload, 'POST', { name: 'x.svg', type: 'image/svg+xml', data: 'PHN2Zz4=' }, token)).status, 400)
})

test('inquiries are emailed to the right inbox when email is set up', async () => {
  assert.equal((await call(h.inquiry, 'POST', { name: 'A', email: 'a@b.co', message: 'hi' })).status, 501)
  process.env.RESEND_API_KEY = 're_test'
  const realFetch = globalThis.fetch
  const sent = []
  globalThis.fetch = async (url, opts) => { sent.push(JSON.parse(opts.body)); return new Response('{}') }
  try {
    assert.equal((await call(h.inquiry, 'POST', { name: 'A', email: 'bad', message: 'hi' })).status, 400)
    assert.equal((await call(h.inquiry, 'POST', { name: 'A', email: 'a@b.co', message: 'hi', website: 'spam' })).status, 200)
    assert.equal(sent.length, 0)
    await call(h.inquiry, 'POST', { name: 'Ravi <b>', email: 'ravi@acme.com', product: 'Almonds', message: '<script>x</script>' })
    await call(h.inquiry, 'POST', { name: 'Sara', email: 's@x.ae', message: 'Distribute', partnership: true })
    assert.deepEqual(sent.map((s) => s.to[0]), ['info@faizfayez.com', 'partners@faizfayez.com'])
    assert.equal(sent[0].reply_to, 'ravi@acme.com')
    assert.ok(!sent[0].html.includes('<script>') && sent[0].html.includes('Ravi &lt;b&gt;'))
  } finally {
    globalThis.fetch = realFetch
    delete process.env.RESEND_API_KEY
  }
})
