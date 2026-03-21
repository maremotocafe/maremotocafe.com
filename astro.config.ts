import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import jesusMode from "./src/admin/vite-plugin-jesus-mode";

export default defineConfig({
  site: "https://maremotocafe.com",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), jesusMode()],
  },
  // Static output for GitHub Pages
  output: "static",
});
