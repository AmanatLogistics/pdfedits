// In-memory stand-in for the parts of the GitHub API the admin panel uses, so
// publishing can be tested without touching a real repository.
import http from 'node:http'
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex')
const blobs = new Map() // sha -> Buffer
const trees = new Map() // sha -> Map(path -> blobSha)
const commits = new Map() // sha -> { tree, parents, message }
const refs = new Map()
const problems = []
function addBlob(buf) { const s = sha(buf); blobs.set(s, buf); return s }
const initial = new Map([['src/content/site.json', addBlob(readFileSync(new URL('../src/content/site.json', import.meta.url)))]])
trees.set('t0', initial); commits.set('c0', { tree: 't0', parents: [], message: 'init' }); refs.set('main', 'c0')
export const race = { once: false }
const server = http.createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c
  const j = body ? JSON.parse(body) : {}
  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)) }
  if (req.headers.authorization !== 'Bearer good-token') return send(401, { message: 'Bad credentials' })
  const u = new URL(req.url, 'http://x'); const p = u.pathname.replace('/repos/o/r', '')
  let m
  if (req.method === 'GET' && (m = p.match(/^\/git\/ref\/heads\/(.+)$/))) return refs.has(m[1]) ? send(200, { object: { sha: refs.get(m[1]) } }) : send(404, { message: 'Not Found' })
  if (req.method === 'GET' && (m = p.match(/^\/git\/commits\/(.+)$/))) return send(200, { sha: m[1], tree: { sha: commits.get(m[1]).tree } })
  if (req.method === 'GET' && (m = p.match(/^\/contents\/(.+)$/))) {
    const ref = u.searchParams.get('ref'); const c = commits.get(ref) ? ref : refs.get(ref)
    if (!commits.get(ref)) problems.push('contents read by branch name, not commit sha')
    const b = trees.get(commits.get(c).tree).get(m[1]); return send(200, { content: blobs.get(b).toString('base64') })
  }
  if (req.method === 'POST' && p === '/git/blobs') { if (j.encoding !== 'base64') problems.push('blob not base64'); return send(201, { sha: addBlob(Buffer.from(j.content, 'base64')) }) }
  if (req.method === 'POST' && p === '/git/trees') {
    const base = trees.get(j.base_tree); if (!base) problems.push('missing base_tree')
    const t = new Map(base)
    for (const e of j.tree) {
      if (e.mode !== '100644' || e.type !== 'blob') problems.push('bad tree entry ' + JSON.stringify(e))
      if (e.sha && !blobs.has(e.sha)) return send(422, { message: 'tree.sha is invalid' })
      t.set(e.path, e.sha ?? addBlob(Buffer.from(e.content)))
    }
    const s = sha(JSON.stringify([...t])); trees.set(s, t); return send(201, { sha: s })
  }
  if (req.method === 'POST' && p === '/git/commits') {
    if (!Array.isArray(j.parents) || j.parents.length !== 1) problems.push('commit parents wrong')
    const s = sha(JSON.stringify(j) + Math.random()); commits.set(s, { tree: j.tree, parents: j.parents, message: j.message }); return send(201, { sha: s, html_url: `https://github.com/o/r/commit/${s}` })
  }
  if (req.method === 'PATCH' && (m = p.match(/^\/git\/refs\/heads\/(.+)$/))) {
    if (j.force !== false) problems.push('ref update not force:false')
    if (race.once) { // someone else pushed just before us
      race.once = false
      const other = sha('other' + Math.random()); commits.set(other, { tree: commits.get(refs.get(m[1])).tree, parents: [refs.get(m[1])], message: 'other' }); refs.set(m[1], other)
    }
    if (!commits.get(j.sha).parents.includes(refs.get(m[1]))) return send(422, { message: 'Update is not a fast forward' })
    refs.set(m[1], j.sha); return send(200, { object: { sha: j.sha } })
  }
  send(404, { message: 'Not Found: ' + req.method + ' ' + p })
})
export const ready = new Promise((r) => server.listen(0, () => r(server.address().port)))
export { server, refs, commits, trees, blobs, problems }
