import { fileURLToPath, URL } from 'node:url'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type ResolvedConfig, type ViteDevServer, type UserConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { generateNotes, projectRoot } from './scripts/lib/generate-notes.mjs'
import { generateStaticNotes } from './scripts/lib/static-pages.mjs'
import { verifyDist } from './scripts/verify-dist.mjs'
import { siteConfig } from './src/content/siteConfig.mjs'
import { escapeHtml } from './src/utils/noteData.mjs'

// Vite's static middleware keeps reserved escapes such as %40 and %26 encoded.
// Read only generated article JSON, decoding the URL path exactly once.
function serveNoteData(directory: string) {
  const root = path.resolve(directory, 'note-data')
  const prefix = siteConfig.basePath + 'note-data/'
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const pathname = (request.url || '').split('?')[0] || ''
    if (!pathname.startsWith(prefix)) return next()
    try {
      const relative = decodeURIComponent(pathname.slice(prefix.length))
      const target = path.resolve(root, relative)
      if (!target.startsWith(root + path.sep) || relative.split(/[\\/]/).some(part => part.startsWith('.')) || !target.endsWith('.json')) {
        response.writeHead(404); response.end(); return
      }
      const data = await readFile(target)
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' })
      response.end(request.method === 'HEAD' ? undefined : data)
    } catch {
      response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
      response.end('{"error":"Article not found"}')
    }
  }
}

export default defineConfig(async ({ isPreview }): Promise<UserConfig> => {
  if (!isPreview) await generateNotes()
  let outDir = 'dist'
  let building = false
  return {
    base: siteConfig.basePath,
    publicDir: '.generated-public',
    plugins: [
      {
        name: 'published-notes',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            const values: Record<string, string> = { SITE_NAME: siteConfig.name, SITE_URL: siteConfig.siteUrl, SITE_DESCRIPTION: siteConfig.description }
            return html.replace(/__([A-Z_]+)__/g, (match, key: string) => escapeHtml(values[key] ?? match))
          },
        },
        configResolved(config: ResolvedConfig) { outDir = config.build.outDir; building = config.command === 'build' },
        async closeBundle() {
          if (building) {
            await generateStaticNotes(projectRoot, outDir)
            await verifyDist(projectRoot, outDir)
          }
        },
        configurePreviewServer(server) {
          server.middlewares.use(serveNoteData(path.resolve(projectRoot, outDir)))
        },
        configureServer(server: ViteDevServer) {
          server.middlewares.use(serveNoteData(path.join(projectRoot, '.generated-public')))
          let pending = Promise.resolve()
          let timer: ReturnType<typeof setTimeout> | undefined
          server.watcher.add('public/postDir')
          server.httpServer?.once('close', () => clearTimeout(timer))
          server.watcher.on('all', (_event: string, file: string) => {
            if (!file.replaceAll('\\', '/').includes('/public/postDir/')) return
            clearTimeout(timer)
            timer = setTimeout(() => {
              pending = pending.then(async () => {
                await generateNotes()
                server.ws.send({ type: 'full-reload' })
              }).catch(error => server.config.logger.error(String(error)))
            }, 120)
          })
        },
      },
      vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    assetsInclude: ['**/*.md'],
    server: {
      watch: { ignored: ['**/.generated-public/**'] },
      fs: {
        allow: ['..']
      }
    }
  }
})
