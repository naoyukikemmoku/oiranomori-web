import type { MicroCMSDate } from "microcms-js-sdk";
import { microcms } from "./microcms";

export type Oshirase = {
	title: string;
	content: string;
	date: string;
	category: string;
	description?: string;
} & MicroCMSDate;

export async function getOshirase(limit = 3) {
	if (!microcms) {
		throw new Error("microCMS is not configured");
	}

	return microcms.getList<Oshirase>({
		endpoint: "oshirase",
		queries: {
			limit,
			orders: "-date",
			fields: "id,title,description,date,category,publishedAt",
		},
	});
}

export async function getOshirasePage(page = 1, limit = 10) {
	if (!microcms) throw new Error("microCMS is not configured");

	return microcms.getList<Oshirase>({
		endpoint: "oshirase",
		queries: {
			limit,
			offset: (page - 1) * limit,
			orders: "-date",
			fields: "id,title,description,date,category,publishedAt",
		},
	});
}

export async function getAllOshiraseIds() {
	const limit = 100;
	const firstPage = await getOshirasePage(1, limit);
	const ids = firstPage.contents.map((content) => content.id);
	const totalPages = Math.ceil(firstPage.totalCount / limit);

	for (let page = 2; page <= totalPages; page += 1) {
		const response = await getOshirasePage(page, limit);
		ids.push(...response.contents.map((content) => content.id));
	}

	return ids;
}

export async function getOshiraseDetail(id: string) {
	if (!microcms) throw new Error("microCMS is not configured");

	return microcms.get<Oshirase>({
		endpoint: "oshirase",
		contentId: id,
	});
}
