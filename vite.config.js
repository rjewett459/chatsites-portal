import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',  // Ensures Vite binds to all interfaces
    port: 10000,      // Ensure it matches Render’s expected port
    allowedHosts: ['chatsites-portal.onrender.com'] // Allow Render host
  }
});
