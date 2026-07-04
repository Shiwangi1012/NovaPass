import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Load .env from the project root (one level above frontend/)
export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '..'),
})
