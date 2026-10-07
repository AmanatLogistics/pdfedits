import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In `npm run dev` the /api routes run inside Vite and save edits straight into
// the project folder, so the admin panel can be tried without GitHub.
function devApi() {
  return {
    name: 'faiz-dev-api',
    apply: 'serve',
    configureServer(server) {
      // Without a GitHub token, edits are written to the local files instead.
      if (!process.env.GITHUB_TOKEN) process.env.FAIZ_LOCAL_STORAGE = '1'
      if (!process.env.ADMIN_PASSWORD) {
        process.env.ADMIN_PASSWORD = 'admin'
        server.config.logger.info('\n  Admin panel: /admin/  (local password: admin)\n')
      }
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/admin') {
          res.statusCode = 302
          res.setHeader('Location', '/admin/')
          return res.end()
        }
        const m = req.url.match(/^\/api\/(status|login|content|upload|inquiry)(\?|$)/)
        if (!m) return next()
        const handlers = await server.ssrLoadModule('/server/handlers.js')
        return handlers[m[1]](req, res)
      })
    },
  }
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), devApi()],
  build: isSsrBuild
    ? {}
    : { rollupOptions: { input: { main: 'index.html', admin: 'admin/index.html' } } },
}))
