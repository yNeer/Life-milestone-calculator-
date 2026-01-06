import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This ensures assets use relative paths (e.g., "./assets/...")
  // preventing 404 errors when deployed to subdirectories like GitHub Pages.
  base: './',
});