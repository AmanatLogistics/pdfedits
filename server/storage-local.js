import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CONTENT_PATH, UPLOAD_DIR } from './content.js'

// Used by `npm run dev`: saves straight into the project folder.
const root = process.cwd()

export const localFiles = {
  mode: 'local',
  async read() {
    return { text: await readFile(path.join(root, CONTENT_PATH), 'utf8') }
  },
  async upload({ name, buffer }) {
    await mkdir(path.join(root, UPLOAD_DIR), { recursive: true })
    await writeFile(path.join(root, UPLOAD_DIR, name), buffer)
    return { path: `/uploads/${name}`, blob: 'local' }
  },
  async publish({ text }) {
    await writeFile(path.join(root, CONTENT_PATH), text)
    return { commit: '', url: '' }
  },
}
