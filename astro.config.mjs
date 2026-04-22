// @ts-check
import { defineConfig, passthroughImageService } from "astro/config";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://oiranomori.jp",
  integrations: [sitemap(), robotsTxt()],
  image: {
    service: passthroughImageService(),
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_GMAPS_API_KEY': JSON.stringify(process.env.PUBLIC_GMAPS_API_KEY ?? ""),
    },
  },
});