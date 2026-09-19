// @ts-check

import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, sharpImageService } from "astro/config";
import robotsTxt from "astro-robots-txt";

export default defineConfig({
	site: "https://oiranomori.jp",
	integrations: [
		sitemap({
			filter: (page) => {
				const pathname = new URL(page).pathname;
				return (
					// /sites/ 本体はライトフォレストの選択ハブとして index 対象。
					// 子ページ（/sites/solo/ 等）は noindex のため sitemap からも除外する。
					!(pathname.startsWith("/sites/") && pathname !== "/sites/") &&
					pathname !== "/404/" &&
					!pathname.startsWith("/checkout/") &&
					!pathname.includes("/thanks/")
				);
			},
		}),
		robotsTxt(),
	],
	image: {
		service: sharpImageService(),
	},
	vite: {
		plugins: [tailwindcss()],
		define: {
			__GMAPS_API_KEY__: JSON.stringify(process.env.PUBLIC_GMAPS_API_KEY ?? ""),
		},
	},
});
