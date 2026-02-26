import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://maremotocafe.com",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  // Static output for GitHub Pages
  output: "static",
});
