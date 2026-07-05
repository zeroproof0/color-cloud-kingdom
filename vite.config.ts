import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // relative asset paths so the build works at both <user>.github.io/<repo>/ and a custom domain root
  base: './',
  plugins: [react()],
})
