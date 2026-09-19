// Deep 予約CTA の検証。依存なし（Node 標準のみ）。
//   実行: node scripts/check-deep-cta.mjs
//   前提: `npm run build` 済み（dist/ の出力HTMLを検査する）
//
// 検証内容
//   1. 設定値（nav.ts）に通常の & を使っていること（&amp; を直書きしない）
//   2. Deep 予約CTAが plans=9 / show=room を含む確定URLであること
//   3. 必須クエリパラメータが全て揃っていること
//   4. show=plan（汎用 proxPlanUrl 形式）が Deep のCTAに混入していないこと
//   5. /deep/ と /deep-guide/ の予約CTA文言が統一されていること

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const NAV = path.join(ROOT, "src", "config", "nav.ts");

const LABEL = "ディープフォレストの空きを確認する";

// 実ブラウザで部屋リストまで到達することを確認済みの確定パラメータ。
const REQUIRED_PARAMS = {
	plans: "9",
	show: "room",
	nights: "1",
	r_num: "1",
	num: "1",
	isPriceTotalPerson: "false",
	nights_unspecified: "1",
};

const errors = [];

// ---------- 1. 設定値は通常の & ----------
const navSrc = fs.readFileSync(NAV, "utf8");
const deepUrlMatch = navSrc.match(
	/PROX_DEEP_RESERVE_URL\s*=\s*\n?\s*`([^`]+)`/,
);
if (!deepUrlMatch) {
	errors.push("nav.ts: PROX_DEEP_RESERVE_URL が見つからない");
} else {
	const configured = deepUrlMatch[1];
	if (configured.includes("&amp;")) {
		errors.push("nav.ts: 設定値に &amp; が含まれる（通常の & を使うこと）");
	}
	for (const [k, v] of Object.entries(REQUIRED_PARAMS)) {
		if (!new RegExp(`[?&]${k}=${v}(&|$)`).test(configured)) {
			errors.push(`nav.ts: 設定値に ${k}=${v} がない`);
		}
	}
}

// ---------- dist 側の検査 ----------
// HTML 属性内では & が &amp; へエスケープされるため、比較前に戻す。
const decodeAmp = (s) => s.replaceAll("&amp;", "&");

for (const page of ["/deep/", "/deep-guide/"]) {
	const file = path.join(DIST, page.slice(1), "index.html");
	if (!fs.existsSync(file)) {
		errors.push(`${page}: ビルド出力がない（先に npm run build）`);
		continue;
	}
	const html = fs.readFileSync(file, "utf8");

	// data-cta-field="deep" を持つ <a> を予約CTAとみなす
	const ctas = [...html.matchAll(/<a\b[^>]*data-cta-field="deep"[^>]*>/g)].map(
		(m) => m[0],
	);
	if (ctas.length === 0) {
		errors.push(`${page}: Deep予約CTA（data-cta-field="deep"）が見つからない`);
		continue;
	}

	for (const tag of ctas) {
		const href = decodeAmp((tag.match(/href="([^"]+)"/) || [])[1] || "");

		// --- 3. 必須パラメータ ---
		for (const [k, v] of Object.entries(REQUIRED_PARAMS)) {
			if (!new RegExp(`[?&]${k}=${v}(&|$)`).test(href)) {
				errors.push(`${page}: CTA の href に ${k}=${v} がない → ${href}`);
			}
		}

		// --- 4. show=plan 混入禁止 ---
		if (/[?&]show=plan(&|$)/.test(href)) {
			errors.push(`${page}: Deep CTA に show=plan が混入している → ${href}`);
		}
	}

	// --- 5. 文言統一 ---
	if (!html.includes(LABEL)) {
		errors.push(`${page}: CTA文言「${LABEL}」が見つからない`);
	}

	console.log(`  ${page} 予約CTA ${ctas.length} 件を検査`);
}

if (errors.length) {
	for (const e of errors) console.error(`ERROR ${e}`);
	console.error(`\n✗ Deep予約CTA: ${errors.length} 件の問題`);
	process.exit(1);
}
console.log("✓ Deep予約CTA検証OK（plans=9 / show=room / 必須パラメータ7件）");
