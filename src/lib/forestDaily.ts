// forest-daily（今日のおいらの森）データ層。
// 旧: microCMS＋日付別SSG。現: OirasApp 公開read API を client-fetch する鮮度 widget。
// microCMS 依存は除去済み（microcms.ts 本体は oshirase が継続使用するため残置）。

export type ForestDaily = {
	id: string;
	title: string;
	body: string;
	postDate: string;
	postType: string[];
	imageUrl?: string;
	tempC?: number;
	maxTempC?: number;
	minTempC?: number;
	humidity?: number;
	condition?: string;
	url?: string;
};

// OirasApp 公開 read API（GET限定・無認証・読み取り専用。CORS は oiranomori.jp 許可済み）。
const API_BASE = "https://oiranomori.com/app/sns/api/forest_daily.php";

// 一覧取得。ok:false / 取得失敗時は呼び出し側で縮退できるよう throw する。
// 任意で year(YYYY)/month(1..12) を渡すと API の ?year=&month= フィルタを付ける
// （month は MM ゼロ埋めで送る。不正値は API 側が安全側＝全件にフォールバック）。
export async function fetchForestDailyList(
	limit = 10,
	offset = 0,
	opts?: { year?: number; month?: number },
): Promise<{ contents: ForestDaily[]; totalCount: number }> {
	let url = `${API_BASE}?limit=${limit}&offset=${offset}`;
	if (opts?.year && opts?.month) {
		const mm = String(opts.month).padStart(2, "0");
		url += `&year=${opts.year}&month=${mm}`;
	}
	const r = await fetch(url, { cache: "default" });
	if (!r.ok) throw new Error(`http:${r.status}`);
	const d = await r.json();
	if (!d.ok) throw new Error("ok:false");
	return {
		contents: Array.isArray(d.contents) ? d.contents : [],
		totalCount: typeof d.totalCount === "number" ? d.totalCount : 0,
	};
}

// daily の日付文字列のみ（YYYY-MM-DD・降順）を軽量取得。
// 個別ビューの前後/前週翌週ナビ・カレンダーの基準配列に使う。失敗時は throw。
export async function fetchForestDailyDates(): Promise<string[]> {
	const url = `${API_BASE}?fields=dates`;
	const r = await fetch(url, { cache: "default" });
	if (!r.ok) throw new Error(`http:${r.status}`);
	const d = await r.json();
	if (!d.ok) throw new Error("ok:false");
	return Array.isArray(d.dates) ? d.dates : [];
}

// daily 判定：id が YYYY-MM-DD 完全一致なら daily。
// seasonal/special は YYYY-MM-DD-<type>-<id> 形（ハイフン3つ以上）で false。
export function isDailyId(id: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(id);
}

// 個別取得。200/ok なら item、404/ok:false なら null。HTTP/パース失敗は throw。
export async function fetchForestDailyDetail(
	id: string,
): Promise<ForestDaily | null> {
	const url = `${API_BASE}?id=${encodeURIComponent(id)}`;
	const r = await fetch(url, { cache: "default" });
	if (r.status === 404) return null;
	if (!r.ok) throw new Error(`http:${r.status}`);
	const d = await r.json();
	if (!d.ok) return null;
	return (d.content as ForestDaily) ?? null;
}

// imageUrl 欠落時は hero にフォールバック（videoUrl は API 非提供のため分岐なし）。
export function getOgImage(item: Pick<ForestDaily, "imageUrl">): string {
	return item.imageUrl ?? "https://oiranomori.jp/images/lp/hero.jpg";
}

export function formatPostDate(str: string): string {
	const d = new Date(str);
	if (Number.isNaN(d.getTime())) return str;
	const y = d.getUTCFullYear();
	const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
	const dy = String(d.getUTCDate()).padStart(2, "0");
	return `${y}.${mo}.${dy}`;
}

// ゼロ埋めなしの「M月D日」。不正な日付は空文字（呼び出し側でタイトルのみ表示にフォールバック）。
export function formatPostDateMD(str: string): string {
	const d = new Date(str);
	if (Number.isNaN(d.getTime())) return "";
	return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

export function bodyToParagraphs(text: string): string[] {
	return text
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
}
