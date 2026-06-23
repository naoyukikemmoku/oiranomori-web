// 自前天気アイコン解決（インライン方式）。API が返す icon_key（"jma_201" / "now_cloudy"）から
// HP 同梱の SVG 文字列を引く。クロスオリジン mask の CORS 問題・ブラウザ差を避けるため、
// アイコン SVG（src/icons/weather/*.svg）をビルド時に raw 文字列で取り込みバンドルへ同梱し、
// 呼び出し側で innerHTML としてインライン展開する（currentColor がネイティブに効く）。
//
// 旧 jmaTelops.ts（気象庁 SVG 直リンク＋118 コードマップ）／URL 返しの iconUrl は廃止。
// 118→アイコンの丸めは VPS 側で解決済みのため、HP 側のマップは不要。

// Vite(Astro) のビルド時に同梱 SVG を raw 文字列で全取り込み（クライアントバンドルに含める）
const modules = import.meta.glob("../icons/weather/*.svg", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

const ICONS: Record<string, string> = {};
for (const [path, raw] of Object.entries(modules)) {
	const key = path.split("/").pop()!.replace(".svg", ""); // 例: jma_201 / now_cloudy
	ICONS[key] = raw;
}

/** icon_key → インライン用 SVG 文字列。未知/未取り込みは null（呼び出し側で非表示）。 */
export function iconSvg(iconKey: string | null | undefined): string | null {
	if (!iconKey) return null;
	return ICONS[iconKey] ?? null;
}

// 天気カテゴリ別の着色。SVG は currentColor 単色設計なので、展開先コンテナの color に
// この値を当てるだけで全描画点が色付く。HEX はサイトトーン（zinc・アースカラー）に
// 馴染むよう彩度を抑えた。雪は薄水色寄りの白＝白背景で沈まない明度に調整。
const ICON_COLORS = {
	sunny: "#c2683f", // 晴：朱色（落ち着いたテラコッタ）
	cloudy: "#71717a", // 曇：zinc-500 グレー
	rain: "#5b8aa6", // 雨：水色（くすませた青）
	snow: "#9db8c9", // 雪：薄水色寄りの白
	thunder: "#c98a2b", // 雷：山吹/橙
	unknown: "#71717a", // 不明：グレー
} as const;

/**
 * icon_key から天気カテゴリ色（HEX）を解決する。
 * jma_ は百の位、now_ は語で大分類し、主たる天気で振る。
 * now_partly（晴時々曇）は晴に寄せる。
 */
export function iconColor(iconKey: string | null | undefined): string {
	if (!iconKey) return ICON_COLORS.unknown;

	if (iconKey.startsWith("jma_")) {
		const hundreds = iconKey.slice(4, 5); // "jma_201" → "2"
		switch (hundreds) {
			case "1":
				return ICON_COLORS.sunny;
			case "2":
				return ICON_COLORS.cloudy;
			case "3":
				return ICON_COLORS.rain;
			case "4":
				return ICON_COLORS.snow;
			default:
				return ICON_COLORS.unknown;
		}
	}

	switch (iconKey) {
		case "now_clear":
		case "now_partly": // 晴時々曇 → 晴に寄せる
			return ICON_COLORS.sunny;
		case "now_cloudy":
		case "now_fog":
			return ICON_COLORS.cloudy;
		case "now_rain":
			return ICON_COLORS.rain;
		case "now_snow":
			return ICON_COLORS.snow;
		case "now_thunder":
			return ICON_COLORS.thunder;
		default:
			return ICON_COLORS.unknown;
	}
}
