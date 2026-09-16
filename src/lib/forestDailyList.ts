// forest-daily 一覧行の描画ロジック（サーバー／クライアント共通）。
// 一覧の初期表示はビルド時にHTMLへ埋め込み（SEO・JS無効対応）、
// 年月週フィルタ後の再描画はクライアントが同じ関数でHTMLを組み立てる。
// 出力は完全に同一マークアップ（差分が出ないよう描画実装を一本化する）。

import { type ForestDaily, formatPostDateShort } from "./forestDaily";

const FALLBACK_IMAGE = "https://oiranomori.jp/images/lp/hero.jpg";

const TYPE_LABEL: Record<string, string> = {
	daily: "日常",
	seasonal: "季節",
	special: "特別",
};

export function typeLabel(types: string[]): string {
	if (types.includes("special")) return TYPE_LABEL.special;
	if (types.includes("seasonal")) return TYPE_LABEL.seasonal;
	return TYPE_LABEL.daily;
}

export function isSpecialType(types: string[]): boolean {
	return types.includes("special") || types.includes("seasonal");
}

export function bodySnippet(body: string, len = 80): string {
	const text = (body ?? "").replace(/\r?\n/g, " ").trim();
	return text.length > len ? `${text.slice(0, len)}…` : text;
}

// API 由来テキストは必ずここを通す（textContent 相当の無害化。innerHTML 直挿し禁止）。
export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// 一覧の1行（日付列なし＝タイトル主体）。
// テキスト列：1行目=日付+タイトル(見出し)、2行目=天気予報、3行目=気温、4行目=本文
//   サイズで階層化：見出し(base) > 本文(sm) > 天気(xs) > 気温(xs薄)
//   薄字は背景(#f4f5f2)で沈まないよう zinc-600/700 基調に統一
export function listRowHtml(item: ForestDaily): string {
	const href = `/forest-daily/?id=${encodeURIComponent(item.id)}`;
	const types = item.postType ?? [];
	const img = item.imageUrl ?? FALLBACK_IMAGE;

	const badge = isSpecialType(types)
		? `<span class="absolute bottom-1 left-1 bg-[color:var(--forest-700)] px-1.5 py-0.5 text-[10px] tracking-[0.1em] text-zinc-200">${escapeHtml(typeLabel(types))}</span>`
		: "";

	const heading = `${formatPostDateShort(item.postDate)} ${item.title ?? ""}`;

	const weather = item.conditionShort
		? `<p class="mt-1.5 text-xs text-zinc-700">今日の天気予報：${escapeHtml(item.conditionShort)}</p>`
		: "";

	const hasTemp = item.tempC !== undefined && item.tempC !== null;
	const hasMax = item.maxTempC !== undefined && item.maxTempC !== null;
	const hasMin = item.minTempC !== undefined && item.minTempC !== null;
	let temp = "";
	if (hasTemp || hasMax || hasMin) {
		const parts: string[] = [];
		if (hasTemp) parts.push(`7時の気温：${item.tempC}℃`);
		if (hasMax || hasMin) {
			const maxStr = hasMax ? `${item.maxTempC}°` : "—";
			const minStr = hasMin ? `${item.minTempC}°` : "—";
			parts.push(`予想最高最低気温：${maxStr}/${minStr}`);
		}
		temp = `<p class="mt-0.5 text-xs text-zinc-700">${escapeHtml(parts.join("　"))}</p>`;
	}

	return `<li><a class="group flex gap-4 py-6 -mx-2 px-2 transition hover:bg-zinc-100/60" href="${escapeHtml(href)}"><div class="relative shrink-0 overflow-hidden bg-zinc-200" style="width: 88px; height: 66px;"><img src="${escapeHtml(img)}" alt="" width="88" height="66" loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">${badge}</div><div class="min-w-0 flex-1"><h2 class="text-base font-semibold leading-snug text-zinc-800 group-hover:text-[color:var(--forest-600)]">${escapeHtml(heading)}</h2>${weather}${temp}<p class="mt-1.5 text-sm leading-relaxed text-zinc-600 line-clamp-2">${escapeHtml(bodySnippet(item.body ?? ""))}</p></div></a></li>`;
}

// 一覧本体（ul＋件数表示）。0件時は空状態メッセージ。
export function listHtml(items: ForestDaily[]): string {
	if (items.length === 0) {
		return `<p class="py-8 text-sm text-zinc-500">この期間の記録はまだありません。</p>`;
	}
	const rows = items.map(listRowHtml).join("");
	return `<ul class="divide-y divide-zinc-300 border-t border-zinc-300">${rows}</ul><p class="mt-8 text-xs text-zinc-400">${items.length}件を表示しています</p>`;
}
