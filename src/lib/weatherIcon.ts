// 自前天気アイコン解決。API が返す icon_key（"jma_201" / "now_cloudy"）から
// 自前アイコン（currentColor 単色 SVG・viewBox 0 0 128 128）の絶対 URL を組み立てる。
//
// 旧 jmaTelops.ts（気象庁 SVG 直リンク＋118 コードマップ）は廃止。
// 118→アイコンの丸めは VPS 側で解決済みのため、HP 側のマップは不要。

const ICON_BASE = "https://oiranomori.com/app/weather/icons/";

/** API の icon_key（"jma_201" / "now_cloudy"）→ 自前アイコンの絶対 URL。null/空は null。 */
export function iconUrl(iconKey: string | null | undefined): string | null {
  if (!iconKey) return null;
  return `${ICON_BASE}${iconKey}.svg`;
}
