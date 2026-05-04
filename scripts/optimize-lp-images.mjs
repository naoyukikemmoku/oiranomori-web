/**
 * LP画像最適化スクリプト
 * 使い方: npm run optimize:lp
 *
 * public/images/lp/ 配下の lp-*.jpg / plan-*.jpg を対象に
 * JPEG / WebP / AVIF の 2400px・1200px 版を生成する。
 */

import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const INPUT_DIR = join(__dirname, "../public/images/lp");
const OUTPUT_DIR = INPUT_DIR; // 同ディレクトリへ出力

const TARGETS = [
	{ suffix: "", size: 2400 },
	{ suffix: "-1200", size: 1200 },
];

const JPEG_QUALITY = 85;
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 60;

async function optimizeImage(srcPath, baseName) {
	// バッファ読み込みで入出力同名の衝突を回避
	const { readFile } = await import("node:fs/promises");
	const srcBuffer = await readFile(srcPath);
	const meta = await sharp(srcBuffer).metadata();
	const isPortrait = meta.height > meta.width;

	for (const { suffix, size } of TARGETS) {
		const resized = sharp(srcBuffer).resize(
			isPortrait ? null : size,
			isPortrait ? size : null,
			{ withoutEnlargement: true },
		);

		const jpegOut = join(OUTPUT_DIR, `${baseName}${suffix}.jpg`);
		const webpOut = join(OUTPUT_DIR, `${baseName}${suffix}.webp`);
		const avifOut = join(OUTPUT_DIR, `${baseName}${suffix}.avif`);

		// JPEG (フォールバック)
		await resized
			.clone()
			.jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
			.toFile(jpegOut);

		// WebP
		await resized.clone().webp({ quality: WEBP_QUALITY }).toFile(webpOut);

		// AVIF
		await resized.clone().avif({ quality: AVIF_QUALITY }).toFile(avifOut);

		const sizes = await Promise.all(
			[jpegOut, webpOut, avifOut].map(async (p) => {
				const s = await stat(p);
				return `${basename(p)}: ${Math.round(s.size / 1024)}KB`;
			}),
		);
		console.log(`  [${size}px] ${sizes.join(" | ")}`);
	}
}

async function main() {
	const files = await readdir(INPUT_DIR);
	const sources = files.filter(
		(f) => /^(lp-|plan-)/.test(f) && /\.(jpg|jpeg)$/i.test(f),
	);

	if (sources.length === 0) {
		console.log("対象ファイルなし（lp-*.jpg / plan-*.jpg）");
		return;
	}

	for (const file of sources) {
		const baseName = basename(file, extname(file));
		console.log(`\n▶ ${file}`);
		await optimizeImage(join(INPUT_DIR, file), baseName);
	}

	console.log("\n✅ 最適化完了");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
