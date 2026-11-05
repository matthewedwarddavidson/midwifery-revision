/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the build works from any sub-path (e.g. GitHub Pages).
  base: './',
  build: {
    // Firestore loads lazily in its own ~580 kB chunk, only for people who sign in.
    chunkSizeWarningLimit: 700,
  },
})
