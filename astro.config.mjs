// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://oiranomori.jp",
  integrations: [sitemap(), robotsTxt()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare()
});