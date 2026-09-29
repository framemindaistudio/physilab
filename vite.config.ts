import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // KaTeX, Recharts and 22 experiments' theory text are large but gzip to ~250 KB; apparatus code is split per experiment.
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
})
