// _redirects の静的検証。依存なし（Node 標準のみ）。
//   実行: node scripts/check-redirects.mjs
//   前提: `npm run build` 済み（dist/ の実ページ一覧と突き合わせるため）
//
// 検証内容
//   1. 書式（3カラム・ステータスコード）
//   2. リダイレクトチェーン（転送先がさらに転送される＝301の多段）
//   3. リダイレクトループ（自己参照・相互参照）
//   4. 転送先の実在（内部パスが dist に存在するか）
//   5. 具体パスがワイルドカードより後ろに置かれていないか（到達不能ルール）

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const REDIRECTS = path.join(ROOT, "public", "_redirects");
const DIST = path.join(ROOT, "dist");

const errors = [];
const warnings = [];

// ---------- パース ----------
const raw = fs.readFileSync(REDIRECTS, "utf8");
const rules = [];
raw.split(/\r?\n/).forEach((line, i) => {
	const text = line.trim();
	if (!text || text.startsWith("#")) return;
	const parts = text.split(/\s+/);
	if (parts.length < 2) {
		errors.push(`L${i + 1}: カラム不足: "${text}"`);
		return;
	}
	const [from, to, status = "301"] = parts;
	if (!/^\d{3}$/.test(status)) {
		errors.push(`L${i + 1}: ステータスコード不正: "${status}"`);
	}
	rules.push({ line: i + 1, from, to, status: Number(status) });
});

// ---------- dist の実ページ一覧 ----------
function collectPages(dir, base = "") {
	const out = new Set();
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const rel = `${base}/${entry.name}`;
		if (entry.isDirectory()) {
			for (const p of collectPages(path.join(dir, entry.name), rel)) out.add(p);
		} else if (entry.name === "index.html") {
			out.add(base === "" ? "/" : `${base}/`);
		} else {
			// sitemap-index.xml / robots.txt / PDF 等、ディレクトリを介さない実ファイル
			out.add(rel);
		}
	}
	return out;
}
const pages = collectPages(DIST);
const builtOk = pages.size > 0;
if (!builtOk) {
	warnings.push(
		"dist/ が空または未生成。転送先の実在チェックはスキップした（先に npm run build）。",
	);
}

// ---------- ルール照合ヘルパ ----------
// Cloudflare Pages の _redirects は上から順に最初にマッチしたものが適用される。
function matchRule(urlPath) {
	for (const r of rules) {
		if (r.from.endsWith("*")) {
			const prefix = r.from.slice(0, -1);
			if (urlPath.startsWith(prefix)) return r;
		} else if (r.from === urlPath) {
			return r;
		}
	}
	return null;
}

const isInternal = (to) => to.startsWith("/");

for (const r of rules) {
	// --- 3. ループ ---
	if (r.from === r.to) {
		errors.push(`L${r.line}: 自己ループ: ${r.from} → ${r.to}`);
		continue;
	}

	if (!isInternal(r.to)) continue; // 外部URLは対象外
	if (r.status === 410 || r.status === 404) continue;

	// --- 2. チェーン ---
	const next = matchRule(r.to);
	if (next && next.from !== r.from) {
		errors.push(
			`L${r.line}: チェーン: ${r.from} → ${r.to} → ${next.to} (L${next.line}) ` +
				`／転送先を最終URLへ直接向けること`,
		);
		continue;
	}

	// --- 4. 転送先の実在 ---
	if (builtOk) {
		const target = r.to.split("#")[0].split("?")[0];
		if (!pages.has(target)) {
			errors.push(`L${r.line}: 転送先が存在しない: ${r.from} → ${r.to}`);
		}
	}
}

// --- 5. 到達不能ルール（先行ワイルドカードに食われる具体パス） ---
for (let i = 0; i < rules.length; i++) {
	const r = rules[i];
	for (let j = 0; j < i; j++) {
		const prev = rules[j];
		if (!prev.from.endsWith("*")) continue;
		const prefix = prev.from.slice(0, -1);
		// /foo/* と /foo/ は別物（splat は1文字以上を要求）。誤検知を除外する。
		if (r.from === prefix) continue;
		if (r.from.startsWith(prefix) && r.from !== prev.from) {
			errors.push(
				`L${r.line}: 到達不能: ${r.from} は L${prev.line} の ${prev.from} に先に 先にマッチする` +
					`／具体パスを先に置くこと`,
			);
			break;
		}
	}
}

// ---------- 出力 ----------
for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
	for (const e of errors) console.error(`ERROR ${e}`);
	console.error(
		`\n✗ ${errors.length} 件の問題（ルール ${rules.length} 件を検査）`,
	);
	process.exit(1);
}
console.log(
	`✓ リダイレクト検証OK（ルール ${rules.length} 件／dist ページ ${pages.size} 件）`,
);
