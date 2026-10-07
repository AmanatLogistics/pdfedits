import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// In `npm run dev` the /api routes run inside Vite. Without a GitHub token,
// edits are saved straight into the project folder, so the admin panel can be
// tried without GitHub.
function devApi() {
  return {
    name: 'faiz-dev-api',
    apply: 'serve',
    configureServer(server) {
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
  plugins: [preact(), devApi()],
  // Bundle everything into the prerender build so React-style imports in
  // dependencies resolve to Preact there too.
  ssr: { noExternal: true },
  build: isSsrBuild
    ? {}
    : { rollupOptions: { input: { main: 'index.html', admin: 'admin/index.html' } } },
}))
