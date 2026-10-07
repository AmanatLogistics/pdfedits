import { HttpError } from './http.js'
import { CONTENT_PATH, UPLOAD_DIR } from './content.js'

// Publishes content by committing to the GitHub repository; Vercel then
// rebuilds and redeploys the site from that commit.

export function githubConfig() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER
  const slug = process.env.VERCEL_GIT_REPO_SLUG
  return {
    token: process.env.GITHUB_TOKEN || '',
    repo: process.env.GITHUB_REPO || (owner && slug ? `${owner}/${slug}` : ''),
    branch: process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main',
  }
}

async function gh(path, { method = 'GET', body } = {}) {
  const { token, repo } = githubConfig()
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'faiz-fayez-admin',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    const err = new HttpError(502, githubMessage(res.status, detail.message))
    err.githubStatus = res.status
    throw err
  }
  return res.json()
}

function githubMessage(status, message = '') {
  if (status === 401) return 'GitHub rejected the access token. Check GITHUB_TOKEN in the Vercel settings.'
  if (status === 403) return 'The GitHub token is not allowed to change this repository. Give it "Contents: Read and write" access.'
  if (status === 404) return 'GitHub could not find the repository or branch. Check GITHUB_REPO and GITHUB_BRANCH.'
  return `GitHub error ${status}${message ? `: ${message}` : ''}`
}

export const githubStorage = {
  mode: 'github',
  async read() {
    const { branch } = githubConfig()
    // Resolve the branch to its latest commit first: reading by branch name can
    // return a slightly old copy for a few seconds after a publish.
    const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`)
    const file = await gh(`/contents/${CONTENT_PATH}?ref=${ref.object.sha}`)
    return { text: Buffer.from(file.content, 'base64').toString('utf8') }
  },
  async upload({ name, buffer }) {
    const blob = await gh('/git/blobs', { method: 'POST', body: { content: buffer.toString('base64'), encoding: 'base64' } })
    return { path: `/uploads/${name}`, blob: blob.sha }
  },
  async publish({ text, uploads, message }) {
    const { branch } = githubConfig()
    const tree = [
      { path: CONTENT_PATH, mode: '100644', type: 'blob', content: text },
      ...uploads.map((u) => ({ path: `${UPLOAD_DIR}/${u.name}`, mode: '100644', type: 'blob', sha: u.blob })),
    ]
    // Retry once if someone else pushed in between.
    for (let attempt = 0; ; attempt++) {
      const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`)
      const parent = await gh(`/git/commits/${ref.object.sha}`)
      const newTree = await gh('/git/trees', { method: 'POST', body: { base_tree: parent.tree.sha, tree } })
      const commit = await gh('/git/commits', { method: 'POST', body: { message, tree: newTree.sha, parents: [ref.object.sha] } })
      try {
        await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: { sha: commit.sha, force: false } })
        return { commit: commit.sha, url: commit.html_url }
      } catch (err) {
        if (attempt === 0 && err.githubStatus === 422) continue
        throw err
      }
    }
  },
}
