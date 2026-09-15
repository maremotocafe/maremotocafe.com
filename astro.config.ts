import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import adminMode from "./src/admin/vite-plugin-admin";

export default defineConfig({
  site: "https://maremotocafe.com",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), adminMode()],
  },
  // Static output for GitHub Pages
  output: "static",
});
