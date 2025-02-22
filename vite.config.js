import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'; // Add this plugin

export default defineConfig({
  plugins: [react(), svgr()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
