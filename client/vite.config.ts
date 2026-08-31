import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Exposes Vite on local network (e.g., http://10.241.58.152:5173)
    port: 5173,
  },
})
