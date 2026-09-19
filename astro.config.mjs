// @ts-check

import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, sharpImageService } from "astro/config";
import robotsTxt from "astro-robots-txt";
import lastmodMap from "./src/data/lastmod.json" with { type: "json" };

export default defineConfig({
	site: "https://oiranomori.jp",
	integrations: [
		sitemap({
			filter: (page) => {
				const pathname = new URL(page).pathname;
				// /sites/ とその客層ページ5件は index 対象のため除外しない。
				return (
					pathname !== "/404/" &&
					!pathname.startsWith("/checkout/") &&
					!pathname.includes("/thanks/")
				);
			},
			// <lastmod> は src/data/lastmod.json（手動更新の正本）から引く。
			// ビルド時刻を使わないため、無関係なページの lastmod はビルドごとに変化しない。
			// マップに無いパスは lastmod を出力しない（不正確な日付を出さない）。
			serialize: (item) => {
				const pathname = new URL(item.url).pathname;
				const date = lastmodMap[pathname];
				// JST の当日正午として扱う。日付のみだと UTC 解釈で前日表記になるため、
				// UTC 換算でも同じ日付に収まる正午を使う。
				return date ? { ...item, lastmod: `${date}T12:00:00+09:00` } : item;
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
