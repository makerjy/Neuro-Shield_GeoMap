import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import sirv from 'sirv'

const rmateRoot = path.resolve(__dirname, '../rmateengine')
let resolvedOutDir = path.resolve(__dirname, 'dist')

export default defineConfig({
  server: {
    port: 5185,
    strictPort: true,
  },
  plugins: [
    react(),
    {
      name: 'serve-rmateengine',
      configureServer(server) {
        server.middlewares.use('/rmate', sirv(rmateRoot, { dev: true }))
      },
    },
    {
      name: 'copy-rmateengine',
      apply: 'build',
      configResolved(config) {
        resolvedOutDir = path.resolve(config.root, config.build.outDir)
      },
      closeBundle() {
        const copyDir = (src: string, dest: string) => {
          if (!fs.existsSync(src)) return
          fs.mkdirSync(dest, { recursive: true })
          const entries = fs.readdirSync(src, { withFileTypes: true })
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name)
            const destPath = path.join(dest, entry.name)
            if (entry.isDirectory()) {
              copyDir(srcPath, destPath)
            } else {
              fs.copyFileSync(srcPath, destPath)
            }
          }
        }

        copyDir(path.join(rmateRoot, 'LicenseKey'), path.join(resolvedOutDir, 'rmate/LicenseKey'))
        copyDir(path.join(rmateRoot, 'rMateMapChartH5'), path.join(resolvedOutDir, 'rmate/rMateMapChartH5'))
        copyDir(path.join(rmateRoot, 'Samples/MapDataBaseXml'), path.join(resolvedOutDir, 'rmate/Samples/MapDataBaseXml'))
        copyDir(path.join(rmateRoot, 'Samples/MapSource'), path.join(resolvedOutDir, 'rmate/Samples/MapSource'))
      },
    },
  ],
})
