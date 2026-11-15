import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// The local AURA Python backend (WSGI/http.server, see https://github.com/eyadwebdeveloper/backend). Override with AURA_API_TARGET when it runs elsewhere.
const apiTarget = process.env.AURA_API_TARGET ?? 'http://127.0.0.1:8000'

/** Serves api/copilot.ts during `vite dev` / `vite preview` so the copilot works locally with ANTHROPIC_API_KEY in .env.local. */
function copilotDevApi(): Plugin {
  const attach = (server: { middlewares: { use: (path: string, fn: (req: any, res: any, next: () => void) => void) => void }; ssrLoadModule?: (id: string) => Promise<any> }) => {
    server.middlewares.use('/api/copilot', async (req, res, next) => {
      try {
        const mod = server.ssrLoadModule ? await server.ssrLoadModule('/api/copilot.ts') : null
        if (!mod) return next()
        const chunks: Buffer[] = []
        for await (const c of req) chunks.push(c as Buffer)
        const request = new Request(`http://localhost${req.originalUrl ?? '/api/copilot'}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        })
        const handler = req.method === 'POST' ? mod.POST : mod.GET
        const response: Response = await handler(request)
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        if (!response.body) return res.end()
        const reader = response.body.getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
        res.end()
      } catch {
        next()
      }
    })
  }
  return {
    name: 'aura-copilot-dev-api',
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '')
      for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'COPILOT_ALLOWED_ORIGIN']) if (env[k]) process.env[k] = env[k]
    },
    configureServer: attach,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copilotDevApi()],
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
