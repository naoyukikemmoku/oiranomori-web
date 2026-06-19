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
