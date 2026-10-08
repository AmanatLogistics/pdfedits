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
  next.records[0].tonnes = 20000
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
  assert.equal(saved.records[0].tonnes, 20000)
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
  for (const src of ['//evil.example/x.png', '/uploads/../../etc/passwd', 'http://example.com/a.jpg']) {
    bad.hero.image.src = src
    assert.equal((await call(h.content, 'POST', { content: bad, version: data.version }, token)).status, 400, src)
  }
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

test('trade figures are worked out from the records', async () => {
  const { tradeSummary } = await import('../src/site/trade.js')
  const t = tradeSummary({
    history: { exported: 100, orders: 5 },
    records: [
      { date: '2025', product: 'Raisins', country: 'India', direction: 'export', tonnes: 800, orders: 30 },
      { date: '2024', product: 'Raisins', country: 'India', direction: 'export', tonnes: 600, orders: 20 },
      { date: '2025', product: 'Mangoes', country: 'India', direction: 'import', tonnes: 50, orders: 2 },
      { date: '2026-03', product: 'Figs', country: 'Russia', direction: 'export', tonnes: 20, orders: 1 },
      { date: '2026-01', product: 'Figs', country: 'Russia', direction: 'export', tonnes: 0, orders: 1 },
    ],
  })
  assert.equal(t.exported, 1520)
  assert.equal(t.imported, 50)
  assert.equal(t.orders, 58)
  assert.equal(t.countries, 2)
  assert.deepEqual(t.byYear.map((y) => [y.year, y.exported, y.imported, y.partial]), [[2024, 600, 0, false], [2025, 800, 50, false], [2026, 20, 0, true]])
  assert.equal(t.byProduct[0].name, 'Raisins')
  assert.deepEqual(t.growth, { from: 2024, to: 2025, pct: 42 })
  assert.equal(t.recent.length, 1)
  // Records without a transport count as road freight.
  assert.deepEqual(t.byTransport.map((g) => [g.name, g.tonnes]), [['road', 1470]])
})

test('one ton is written in the singular', async () => {
  const { unitFor } = await import('../src/site/trade.js')
  assert.equal(unitFor(1, 'Tons'), 'Ton')
  assert.equal(unitFor(1.2, 'Tons'), 'Ton')
  assert.equal(unitFor(2, 'Tons'), 'Tons')
  assert.equal(unitFor(0, 'Tons'), 'Tons')
  assert.equal(unitFor(1, 'kg'), 'kg')
})

test('page addresses map to the right page', async () => {
  const { pageForPath, pageOfSection } = await import('../src/site/pages.js')
  assert.equal(pageForPath('/'), 'home')
  assert.equal(pageForPath('/products'), 'products')
  assert.equal(pageForPath('/track-record/'), 'track-record')
  assert.equal(pageForPath('/shipping/index.html'), 'shipping')
  assert.equal(pageForPath('/nope'), 'home')
  assert.equal(pageOfSection('faq').path, '/about')
})

test('rows pasted from Excel are understood', async () => {
  const { parseRows, toCsv } = await import('../src/admin/records.js')
  const rows = parseRows('Date\tProduct\tCountry\tType\tTonnes\tOrders\tTransport\nSep 2026\tPomegranates\tUAE\tExport\t1,200 t\t3\tAir cargo')
  assert.deepEqual(rows[0], { date: '2026-09', product: 'Pomegranates', country: 'United Arab Emirates', direction: 'export', tonnes: 1200, orders: 3, transport: 'air' })
  const csv = 'Date,Product,Country,Direction,Tons,Orders,Transport\n2025,Raisins,India,import,820,37,road'
  assert.deepEqual(parseRows(csv)[0], { date: '2025', product: 'Raisins', country: 'India', direction: 'import', tonnes: 820, orders: 37, transport: 'road' })
  assert.equal(toCsv(parseRows(csv)), csv)
})

test('pasted photo links are turned into links the website can show', async () => {
  const { normalizeImageLink } = await import('../src/admin/imageLinks.js')
  assert.equal(normalizeImageLink('https://images.unsplash.com/photo-1?w=400').src, 'https://images.unsplash.com/photo-1?w=400')
  assert.equal(normalizeImageLink('https://www.pexels.com/photo/pile-of-pomegranate-14650515/').src, 'https://images.pexels.com/photos/14650515/pexels-photo-14650515.jpeg?auto=compress&cs=tinysrgb&w=1600')
  assert.equal(normalizeImageLink('https://unsplash.com/photos/dried-figs-in-a-bowl-Zl8lwWNxWdY').src, 'https://unsplash.com/photos/Zl8lwWNxWdY/download?force=true&w=1600')
  assert.equal(normalizeImageLink('https://www.google.com/imgres?imgurl=https%3A%2F%2Fexample.com%2Ffigs.jpg&imgrefurl=x').src, 'https://example.com/figs.jpg')
  assert.ok(normalizeImageLink('https://www.google.com/url?sa=i&url=https%3A%2F%2Fexample.com').error)
  assert.ok(normalizeImageLink('https://unsplash.com/s/photos/figs').error)
  assert.ok(normalizeImageLink('data:image/png;base64,AAA').error)
  const http = normalizeImageLink('http://example.com/a.jpg')
  assert.equal(http.src, 'https://example.com/a.jpg')
  assert.ok(http.note)
  assert.equal(normalizeImageLink('/uploads/a.jpg').src, '/uploads/a.jpg')
  assert.equal(normalizeImageLink('/partners/logo.png').src, '/partners/logo.png')
  // Google's small search previews work, with a note that they will look blurry.
  const thumb = normalizeImageLink('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ')
  assert.equal(thumb.src, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ')
  assert.match(thumb.note, /blurry/)
})

test('photos from resizing hosts get a range of sizes', async () => {
  const { responsiveSet, thumbOf } = await import('../src/site/images.js')
  assert.match(responsiveSet('https://images.pexels.com/photos/1/pexels-photo-1.jpeg?w=800').srcSet, /w=2400\S* 2400w/)
  assert.match(responsiveSet('https://images.unsplash.com/photo-1?w=400').srcSet, /w=480\S* 480w/)
  const wiki = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Dried_Figs_(1).jpg/960px-Dried_Figs_(1).jpg'
  assert.match(responsiveSet(wiki).srcSet, /1280px-Dried_Figs_\(1\)\.jpg 1280w/)
  assert.equal(responsiveSet('https://example.com/a.jpg'), null)
  assert.match(thumbOf('https://images.pexels.com/photos/1/pexels-photo-1.jpeg?w=800', 96), /w=96/)
})
