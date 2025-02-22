import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

const path = fileURLToPath(import.meta.url);

export default {
  root: join(dirname(path), "client"),
  plugins: [react()],
  server: {
    host: true,  // ✅ Ensure Vite allows external access
    strictPort: true,
    port: 3000,  // ✅ Ensure the correct port is set
    allowedHosts: ["chatsites-portal.onrender.com"],  // ✅ Allow your Render domain
    cors: true, // ✅ Ensure CORS is enabled
  },
  preview: {
    port: 4173, // ✅ Ensure preview works
    allowedHosts: ["chatsites-portal.onrender.com"],
  }
};


