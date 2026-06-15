// 混雑（空き）状況 API クライアント。
// エンドポイント: https://oiranomori.com/app/camp/api/congestion.php
// クエリ: ?from=YYYY-MM-DD&days=N（from省略=当日JST／days省略=120／1〜366クランプ）
// CORS は本番で oiranomori.jp 許可済み（GET/OPTIONS, max-age=300）。
// 動的データのためビルド時 fetch はせず、クライアント（ブラウザ可視時）から取得する。

export const CONGESTION_API =
	"https://oiranomori.com/app/camp/api/congestion.php";

// fetch 失敗時フォールバックの予約導線（ProX planlist）。
export const RESERVE_FALLBACK_URL =
	"https://www.489pro-x.com/ja/s/oiranomori/planlist/";

export type AreaKey = "auto" | "kukaku" | "deep" | "dogrun";

export type AvailabilityDay = {
	date: string; // YYYY-MM-DD
	remain: number;
	label: string;
};

// サイズ別の残数内訳（label なし）。auto={XL,LL,L,M,S} / kukaku={SS,kukakuC,k11}。
// deep/dogrun には存在しないため optional。後方互換のためキーは固定せず Record で受ける。
export type AvailabilitySize = {
	capacity: number;
	days: { date: string; remain: number }[];
};

export type AvailabilityArea = {
	capacity: number;
	days: AvailabilityDay[];
	sizes?: Record<string, AvailabilitySize>;
};

export type AvailabilityResponse = {
	ok: boolean;
	range: { from: string; days: number };
	areas: Record<AreaKey, AvailabilityArea>;
};

// ラベル全種（色／記号マッピング用の正本）。サーバーが返す文字列と一致させる。
// light（auto / kukaku）：満→空きの順で混雑度が下がる。
export const LIGHT_LABELS = [
	"満サイト",
	"混雑",
	"混雑気味",
	"ゆったり",
	"ガラガラ",
	"予約なし",
] as const;

// deep：静けさの濃淡。満→誰もいない の順。
export const DEEP_LABELS = [
	"満",
	"人の存在を感じる",
	"ほぼ人に会わない",
	"誰もいない",
] as const;

// dogrun：1組限定のため二値。
export const DOGRUN_LABELS = ["満", "空き"] as const;

// 当日（JST）の YYYY-MM-DD を返す。
export function todayJst(): string {
	const now = new Date();
	const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
	const y = jst.getUTCFullYear();
	const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
	const d = String(jst.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

// API URL を組み立てる。
export function buildCongestionUrl(from = todayJst(), days = 120): string {
	const u = new URL(CONGESTION_API);
	u.searchParams.set("from", from);
	u.searchParams.set("days", String(days));
	return u.toString();
}
