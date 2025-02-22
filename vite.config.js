import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'client',  // Set correct root directory
  plugins: [react()],
  build: {
    outDir: '../dist',  // Ensure build goes to the correct place
  },
  server: {
    historyApiFallback: true,
  }
});
