// /now/ のうち「骨組みごと JS が生成していた」ブロックの描画ロジック。
// サーバー（ビルド時の初期HTML）とクライアント（更新時の再描画）が同じ関数を呼ぶ。
// 出力はバイト単位で一致させる＝表示差分なし。
//
// 対象：周辺3都市 / 警報・注意報 / 週間予報 / 気温推移の数値表
// 対象外：気温推移の折れ線グラフ本体（SVG は従来どおりクライアント描画）

import { getMoonAge, moonPhaseSvg } from "./koyomi";
import { fmtDate, fmtDiff, type NowJson, parseLocalDate } from "./nowWeather";
import { iconColor, iconSvg } from "./weatherIcon";

// API 由来テキストは必ずここを通す（textContent 相当の無害化）。
export function escapeHtml(s: string): string {
	return String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// 自前天気アイコン（icon_key → 同梱 SVG をインライン展開）。
// icon_key=null（未知/未取り込み）は空文字を返し、アイコンを描かない。
// DOM 版 iconFromKey と同じ出力になるよう、span の属性順・style を揃える。
export function iconHtml(
	iconKey: string | null | undefined,
	size = 36,
): string {
	const svg = iconSvg(iconKey);
	if (!svg) return "";
	// SVG のルート要素に width/height/display を注入（DOM 版の setAttribute 相当）
	const sized = svg.replace(
		/<svg\b([^>]*)>/,
		(_m, attrs) =>
			`<svg${String(attrs)
				.replace(/\s(width|height)="[^"]*"/g, "")
				.replace(
					/\sstyle="[^"]*"/g,
					"",
				)} width="${size}" height="${size}" style="display: block;">`,
	);
	return `<span class="inline-flex items-center justify-center" style="width: ${size}px; height: ${size}px; color: ${iconColor(iconKey)};" aria-hidden="true">${sized}</span>`;
}

// ── 周辺3都市（東京・埼玉・宇都宮）────────────────────────────
const CITY_ORDER = [
	{ key: "amedas_tokyo", label: "東京" },
	{ key: "amedas_saitama", label: "埼玉" },
	{ key: "amedas_utsunomiya", label: "宇都宮" },
];

export function citiesHtml(current: NowJson | null): string {
	const baseTemp = current?.stations?.uketsuke?.temp_c ?? null;
	let out = "";
	for (const { key, label } of CITY_ORDER) {
		const st = current?.stations?.[key];
		const name = escapeHtml(st?.label ?? label);
		const icon = st?.icon_key ? iconHtml(st.icon_key, 66) : "";
		const temp =
			st?.temp_c != null
				? `${st.temp_c.toFixed(1)}<span class="text-xs text-zinc-400"> ℃</span>`
				: `<span class="text-zinc-300">—</span>`;
		const diff =
			st?.temp_c != null && baseTemp != null
				? `<p class="mt-1 text-xs text-zinc-400">おいらの森比 ${escapeHtml(fmtDiff(st.temp_c - baseTemp))}℃</p>`
				: "";
		out +=
			`<div class="border border-zinc-200 bg-white p-4 text-center">` +
			`<p class="text-xs tracking-[0.12em] text-zinc-400">${name}</p>` +
			`<div class="my-2 flex h-16 items-center justify-center">${icon}</div>` +
			`<p class="text-2xl font-semibold text-zinc-800">${temp}</p>` +
			`${diff}</div>`;
	}
	return out;
}

// ── 警報・注意報 ──────────────────────────────────────────────
function styleByLevel(level: string): string {
	switch (level) {
		case "emergency":
			return "border-2 border-purple-600 bg-purple-50 text-purple-800 font-semibold";
		case "warning":
			return "border border-red-400 bg-red-50 text-red-700";
		default: // advisory
			return "border border-amber-400 bg-amber-50 text-amber-700";
	}
}

function levelRank(level: string): number {
	return level === "emergency" ? 0 : level === "warning" ? 1 : 2;
}

export function warningsHtml(warning: NowJson | null): string {
	if (!warning) {
		return `<p class="text-zinc-500">警報・注意報の取得に失敗しました。</p>`;
	}
	const warnings: NowJson[] = Array.isArray(warning.warnings)
		? warning.warnings
		: [];
	if (warnings.length === 0) {
		return `<p class="text-zinc-500">現在、発表中の警報・注意報はありません。</p>`;
	}
	const sorted = [...warnings].sort(
		(a, b) => levelRank(a.level) - levelRank(b.level),
	);
	return sorted
		.map((w) => {
			const lv = String(w.level ?? "advisory");
			const text = escapeHtml(w.name ?? w.text ?? `コード ${w.code ?? "—"}`);
			return `<span class="mr-2 mb-2 inline-block px-3 py-1 text-xs ${styleByLevel(lv)}">${text}</span>`;
		})
		.join("");
}

// ── 週間予報 ─────────────────────────────────────────────────
// weekly[0]=明日は直近枠と重複するため描画しない。slice 起点は frames 数に連動：
// 3枠（明後日まで直近表示）→ slice(2)／2枠・frames無 → slice(1)。
export function weeklyStartIndex(forecast: NowJson | null): number {
	const frames = Array.isArray(forecast?.frames) ? forecast.frames : null;
	return frames && frames.length === 3 ? 2 : 1;
}

export function weeklyHtml(forecast: NowJson | null): string {
	const weekly: NowJson[] = Array.isArray(forecast?.weekly)
		? forecast.weekly
		: [];
	const start = weeklyStartIndex(forecast);
	if (weekly.length <= start) return "";

	return weekly
		.slice(start)
		.map((day) => {
			const icon = day.icon_key ? iconHtml(day.icon_key, 44) : "";
			const pop = day.pop != null ? `${day.pop}%` : "—";
			const max = day.temp_max != null ? `${day.temp_max}°` : "—";
			const min = day.temp_min != null ? `${day.temp_min}°` : "—";
			const age = getMoonAge(parseLocalDate(day.date));
			return (
				`<div class="shrink-0 border border-zinc-200 bg-white p-3 text-center" style="width: 96px;">` +
				`<p class="text-xs text-zinc-500">${escapeHtml(fmtDate(day.date))}</p>` +
				`<div class="my-2 flex h-11 items-center justify-center">${icon}</div>` +
				`<p class="text-xs text-zinc-500">${escapeHtml(pop)}</p>` +
				`<p class="mt-1 text-xs"><span class="text-red-500">${escapeHtml(max)}</span> / <span class="text-blue-500">${escapeHtml(min)}</span></p>` +
				`<p class="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-zinc-400">${moonPhaseSvg(age, 12)}<span>月齢${age.toFixed(0)}</span></p>` +
				`</div>`
			);
		})
		.join("");
}

// ── 気温推移の数値表 ───────────────────────────────────────────
// グラフ（SVG）はクライアント描画のままなので、JS無効・クローラーには
// 同じ数値をテーブルで届ける。グラフの代替テキストとして機能させる。
export function trendTableHtml(timeseries: NowJson | null): string {
	const reception: NowJson[] = Array.isArray(timeseries?.series?.reception)
		? timeseries.series.reception
		: [];
	const amedas: NowJson[] = Array.isArray(timeseries?.series?.amedas)
		? timeseries.series.amedas
		: [];
	if (reception.length === 0 && amedas.length === 0) return "";

	// 日付 union（昇順）をキーに、受付棟とアメダスを突き合わせる
	const byDateReception = new Map<string, NowJson>(
		reception.map((p) => [p.date, p]),
	);
	const byDateAmedas = new Map<string, NowJson>(amedas.map((p) => [p.date, p]));
	const dates = Array.from(
		new Set([...reception, ...amedas].map((p) => p.date)),
	).sort();

	const num = (v: unknown): string =>
		typeof v === "number" && !Number.isNaN(v) ? `${v.toFixed(1)}℃` : "—";

	const rows = dates
		.map((d) => {
			const r = byDateReception.get(d);
			const a = byDateAmedas.get(d);
			return (
				`<tr class="border-b border-zinc-100">` +
				`<th scope="row" class="whitespace-nowrap py-1.5 pr-4 text-left font-normal text-zinc-600">${escapeHtml(fmtDate(d))}</th>` +
				`<td class="py-1.5 pr-4 text-right tabular-nums">${num(r?.temp_c)}</td>` +
				`<td class="py-1.5 pr-4 text-right tabular-nums">${num(a?.temp_max)}</td>` +
				`<td class="py-1.5 pr-4 text-right tabular-nums">${num(a?.temp_avg ?? a?.temp_c)}</td>` +
				`<td class="py-1.5 text-right tabular-nums">${num(a?.temp_min)}</td>` +
				`</tr>`
			);
		})
		.join("");

	return (
		`<table class="w-full min-w-[30rem] text-xs">` +
		`<caption class="sr-only">おいらの森の日平均気温と、那須烏山アメダスの日最高・日平均・日最低気温</caption>` +
		`<thead><tr class="border-b border-zinc-300 text-zinc-500">` +
		`<th scope="col" class="py-1.5 pr-4 text-left font-normal">日付</th>` +
		`<th scope="col" class="py-1.5 pr-4 text-right font-normal">おいらの森</th>` +
		`<th scope="col" class="py-1.5 pr-4 text-right font-normal">烏山 最高</th>` +
		`<th scope="col" class="py-1.5 pr-4 text-right font-normal">烏山 平均</th>` +
		`<th scope="col" class="py-1.5 text-right font-normal">烏山 最低</th>` +
		`</tr></thead><tbody>${rows}</tbody></table>`
	);
}
