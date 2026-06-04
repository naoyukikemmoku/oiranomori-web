import type { MicroCMSDate } from "microcms-js-sdk";
import { microcms } from "./microcms";

export type ForestDaily = {
	title: string;
	body: string;
	postDate: string;
	postType: string[];
	imageUrl?: string;
	videoUrl?: string;
	tempC?: number;
	maxTempC?: number;
	minTempC?: number;
	humidity?: number;
	condition?: string;
} & MicroCMSDate;

const ENDPOINT = "forest-daily";
const FIELDS =
	"id,title,body,postDate,postType,imageUrl,videoUrl,tempC,maxTempC,minTempC,humidity,condition,publishedAt,updatedAt";

export async function getForestDailyList(limit = 20, offset = 0) {
	if (!microcms) throw new Error("microCMS is not configured");
	return microcms.getList<ForestDaily>({
		endpoint: ENDPOINT,
		queries: { limit, offset, orders: "-postDate", fields: FIELDS },
	});
}

export async function getAllForestDailyIds(): Promise<string[]> {
	if (!microcms) throw new Error("microCMS is not configured");

	const ids: string[] = [];
	const limit = 100;
	let offset = 0;

	while (true) {
		const res = await microcms.getList<ForestDaily>({
			endpoint: ENDPOINT,
			queries: { limit, offset, fields: "id" },
		});
		ids.push(...res.contents.map((c) => c.id));
		if (ids.length >= res.totalCount) break;
		offset += limit;
	}

	return ids;
}

export async function getForestDailyDetail(id: string) {
	if (!microcms) throw new Error("microCMS is not configured");
	return microcms.get<ForestDaily>({ endpoint: ENDPOINT, contentId: id });
}

export function getOgImage(
	item: Pick<ForestDaily, "imageUrl" | "videoUrl">,
): string {
	if (item.imageUrl) return item.imageUrl;
	if (item.videoUrl) {
		const m = item.videoUrl.match(
			/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
		);
		if (m) return `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg`;
	}
	return "https://oiranomori.jp/images/lp/hero.jpg";
}

export function extractYouTubeId(url?: string): string | null {
	if (!url) return null;
	const m = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
	);
	return m ? m[1] : null;
}

export function formatPostDate(str: string): string {
	const d = new Date(str);
	if (Number.isNaN(d.getTime())) return str;
	const y = d.getUTCFullYear();
	const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
	const dy = String(d.getUTCDate()).padStart(2, "0");
	return `${y}.${mo}.${dy}`;
}

export function bodyToParagraphs(text: string): string[] {
	return text
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
}
