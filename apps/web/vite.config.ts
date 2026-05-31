import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Expose on the LAN so real devices on the same Wi-Fi can open the app.
    host: true,
    port: 5173,
    proxy: {
      // Forward API calls to the local Fastify server. Phones only need to
      // reach Vite (no hardcoded machine IP, no CORS).
      "/api": "http://localhost:3000",
    },
  },
});
