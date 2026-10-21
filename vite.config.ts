import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type ResolvedConfig, type ViteDevServer, type UserConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { generateNotes, projectRoot } from './scripts/lib/generate-notes.mjs'
import { generateStaticNotes } from './scripts/lib/static-pages.mjs'
import { siteConfig } from './src/content/siteConfig.mjs'
import { escapeHtml } from './src/utils/noteData.mjs'

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
        async closeBundle() { if (building) await generateStaticNotes(projectRoot, outDir) },
        configureServer(server: ViteDevServer) {
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
