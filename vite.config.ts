import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    // Stretch goal: proxy to Anthropic so the API key stays server-side and CORS is avoided.
    // Set ANTHROPIC_API_KEY in the shell and VITE_USE_CLAUDE=true to enable the real resolver.
    // proxy: {
    //   '/api/anthropic': {
    //     target: 'https://api.anthropic.com',
    //     changeOrigin: true,
    //     rewrite: (p) => p.replace(/^\/api\/anthropic/, ''),
    //   },
    // },
  },
})
