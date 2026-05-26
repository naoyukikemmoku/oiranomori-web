// @ts-check
import { defineConfig, passthroughImageService } from "astro/config";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://oiranomori.jp",
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/checkout/') &&
        !page.includes('/thanks/'),
    }),
    robotsTxt(),
  ],
  image: {
    service: passthroughImageService(),
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      __GMAPS_API_KEY__: JSON.stringify(process.env.PUBLIC_GMAPS_API_KEY ?? ""),
    },
  },
});