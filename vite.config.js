import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev, forward /api/* to the Vercel dev server on port 3000
      // Run: npx vercel dev   (instead of npm run dev) for full local testing
      // Or use the setup screen to enter your token directly in the browser
      // during local-only development with npm run dev.
    }
  }
})
