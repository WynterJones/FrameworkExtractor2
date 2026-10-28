import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Mirrors the OverSkill scaffold (Babel react plugin, @ alias, port 8080).
// The platform's id-injection, R2 asset and worker plugins are omitted on purpose:
// a prototype has no Worker. Everything else matches a generated app.
export default defineConfig({
  server: { host: "0.0.0.0", port: 8080 },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { target: "es2022" },
});
