import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',  // Ensure Vite looks for index.html in root
  plugins: [react()],
  build: {
    outDir: 'dist',  // Ensure the build goes into dist/
    emptyOutDir: true,
  },
  server: {
    historyApiFallback: true, // Ensure React SPA routing works
  }
});
