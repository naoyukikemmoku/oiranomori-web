// /now/（森の今の天気）のデータ層。サーバー（ビルド時）とクライアント共用。
// 公開read API（GET限定・無認証・読取専用）から取得する。
// livecam.php だけは対象外＝ビルド時に取らない（配信の videoID を焼き込むと
// 配信を作り直した際に埋め込みが切れるため。実行時のみ取得する）。

export const NOW_API = {
	current: "https://oiranomori.com/app/weather/api/public/current.php",
	forecast: "https://oiranomori.com/app/weather/api/public/forecast.php",
	warning: "https://oiranomori.com/app/weather/api/public/warning.php",
	timeseries: "https://oiranomori.com/app/weather/api/public/timeseries.php",
	livecam: "https://oiranomori.com/app/weather/api/public/livecam.php",
	advisory: "https://oiranomori.com/app/weather/api/public/advisory.php",
} as const;

// API レスポンスは素の JSON を通す（既存クライアント実装と同じ扱い）。
// biome-ignore lint/suspicious/noExplicitAny: API スキーマは App 側が正本のため素通し
export type NowJson = Record<string, any>;

// 鮮度閾値（A4 で使用）
export const STALE_WARN_S = 1200; // 20分超 → 警告色
export const STALE_DOWN_S = 3600; // 1時間超 → 停止中扱い

export const DOW = ["日", "月", "火", "水", "木", "金", "土"];

// ── JST 固定の日時整形 ───────────────────────────────────────
// ビルドは UTC の CI 上で走るため、Date の getHours() 等（実行環境のローカル時刻）を
// そのまま使うとサーバーとクライアントで表示がずれる。JST に固定して両者を一致させる。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJst(d: Date): Date {
	return new Date(d.getTime() + JST_OFFSET_MS);
}

// "M/D HH:MM"（JST）。観測時刻スタンプ用。
export function fmtClock(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const j = toJst(d);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${j.getUTCMonth() + 1}/${j.getUTCDate()} ${p(j.getUTCHours())}:${p(j.getUTCMinutes())}`;
}

// "YYYY-MM-DD HH:MM"（JST）。ブロック別の取得時刻注記用（分単位）。
export function fmtStamp(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const j = toJst(d);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${j.getUTCFullYear()}-${p(j.getUTCMonth() + 1)}-${p(j.getUTCDate())} ${p(j.getUTCHours())}:${p(j.getUTCMinutes())}`;
}

// "M/D(曜)"。予報カード・週間カードの日付用。YYYY-MM-DD は JST 暦日として解釈。
export function fmtDate(iso: string): string {
	const [y, m, d] = String(iso).split("-").map(Number);
	if (!y || !m || !d) return String(iso);
	const dow = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
	return `${m}/${d}(${dow})`;
}

// "YYYY-MM-DD"（JST暦日）をローカル Date として解釈（暦計算用）。
export function parseLocalDate(iso: string): Date {
	const [y, m, d] = String(iso).split("-").map(Number);
	return new Date(y, m - 1, d);
}

// 観測の鮮度に応じた時刻スタンプの class（20分超で警告色）。
export function timeStampClass(ageSeconds: number | null | undefined): string {
	return ageSeconds != null && ageSeconds > STALE_WARN_S
		? "text-xs font-semibold text-amber-600"
		: "text-xs font-semibold text-zinc-600";
}

// 受付棟センサーの停止中判定：temp_c が null、または鮮度 1時間超。
export function isUketsukeDown(uketsuke: NowJson | null | undefined): boolean {
	return (
		!uketsuke ||
		uketsuke.temp_c == null ||
		(uketsuke.age_seconds != null && uketsuke.age_seconds > STALE_DOWN_S)
	);
}

// 気温差の表記（符号は ASCII の + と U+2212 の − を使い分ける既存表記を踏襲）。
export function fmtDiff(diff: number): string {
	const sign = diff >= 0 ? "+" : "−";
	return `${sign}${Math.abs(diff).toFixed(1)}`;
}

// ok:false / HTTP エラーは throw。呼び出し側で allSettled により部分縮退させる。
export async function fetchNowJson(url: string): Promise<NowJson> {
	const r = await fetch(url, { cache: "default" });
	const d = await r.json();
	if (!d.ok) throw new Error("ok:false");
	return d;
}

// ビルド時に焼き込む5本をまとめて取得する（livecam は含めない）。
// 個別に失敗しても null として返し、ビルドは落とさない。
export type NowSnapshot = {
	current: NowJson | null;
	forecast: NowJson | null;
	warning: NowJson | null;
	advisory: NowJson | null;
	timeseries: NowJson | null;
	/** 取得を実行した時刻（ISO8601）。ブロック別の注記に使う */
	fetchedAt: string;
};

export async function fetchNowSnapshot(
	trendRange = "1w",
): Promise<NowSnapshot> {
	const urls = [
		NOW_API.current,
		NOW_API.forecast,
		NOW_API.warning,
		NOW_API.advisory,
		`${NOW_API.timeseries}?range=${trendRange}`,
	];
	const labels = ["current", "forecast", "warning", "advisory", "timeseries"];

	const settled = await Promise.allSettled(urls.map((u) => fetchNowJson(u)));
	const pick = (i: number): NowJson | null => {
		const r = settled[i];
		if (r.status === "fulfilled") return r.value;
		console.warn(`[now] ビルド時の ${labels[i]} 取得に失敗:`, r.reason);
		return null;
	};

	return {
		current: pick(0),
		forecast: pick(1),
		warning: pick(2),
		advisory: pick(3),
		timeseries: pick(4),
		fetchedAt: new Date().toISOString(),
	};
}
