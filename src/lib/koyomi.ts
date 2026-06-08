// 暦計算（二十四節気・七十二候・日の出入り・月齢）
//
// すべて HP 側計算（外部 API 不要）。現地座標固定。
// - 二十四節気: 太陽黄経が 15° の倍数を跨ぐ瞬間を二分探索で求める簡易式。
//   章動・光行差を省くため稀に±1日ずれるが「今日が属する節気名」には十分。
// - 七十二候: 各節気を初候/次候/末候に3分割。名称・読みは略本暦の標準表記を
//   定数で保持（計算対象ではない暦の定義文言）。
// - 日の出/日の入り: NOAA 簡易アルゴリズム（誤差±数分）。
// - 月齢: 朔（新月）からの経過日数。

// 現地座標（里山パークおいらの森・受付棟付近）
const LAT = 36.641001;
const LNG = 140.067100;
const RAD = Math.PI / 180;
const J2000 = 2451545.0;

// ── 二十四節気（立春=315°起点、黄経昇順で24分割）──────────────
// index 0 = 立春(315°), 以降 15° ずつ。名称は標準表記。
export const SOLAR_TERMS: { name: string; lng: number }[] = [
  { name: "立春", lng: 315 }, { name: "雨水", lng: 330 },
  { name: "啓蟄", lng: 345 }, { name: "春分", lng: 0 },
  { name: "清明", lng: 15 },  { name: "穀雨", lng: 30 },
  { name: "立夏", lng: 45 },  { name: "小満", lng: 60 },
  { name: "芒種", lng: 75 },  { name: "夏至", lng: 90 },
  { name: "小暑", lng: 105 }, { name: "大暑", lng: 120 },
  { name: "立秋", lng: 135 }, { name: "処暑", lng: 150 },
  { name: "白露", lng: 165 }, { name: "秋分", lng: 180 },
  { name: "寒露", lng: 195 }, { name: "霜降", lng: 210 },
  { name: "立冬", lng: 225 }, { name: "小雪", lng: 240 },
  { name: "大雪", lng: 255 }, { name: "冬至", lng: 270 },
  { name: "小寒", lng: 285 }, { name: "大寒", lng: 300 },
];

// ── 七十二候（各節気の初候/次候/末候。立春起点で SOLAR_TERMS と同順）──
// 略本暦の標準表記。[名称, 読み] を節気ごとに3つ。
export const SEVENTY_TWO: { name: string; yomi: string }[] = [
  // 立春
  { name: "東風解凍", yomi: "はるかぜこおりをとく" },
  { name: "黄鶯睍睆", yomi: "うぐいすなく" },
  { name: "魚上氷", yomi: "うおこおりをいずる" },
  // 雨水
  { name: "土脉潤起", yomi: "つちのしょううるおいおこる" },
  { name: "霞始靆", yomi: "かすみはじめてたなびく" },
  { name: "草木萌動", yomi: "そうもくめばえいずる" },
  // 啓蟄
  { name: "蟄虫啓戸", yomi: "すごもりむしとをひらく" },
  { name: "桃始笑", yomi: "ももはじめてさく" },
  { name: "菜虫化蝶", yomi: "なむしちょうとなる" },
  // 春分
  { name: "雀始巣", yomi: "すずめはじめてすくう" },
  { name: "桜始開", yomi: "さくらはじめてひらく" },
  { name: "雷乃発声", yomi: "かみなりすなわちこえをはっす" },
  // 清明
  { name: "玄鳥至", yomi: "つばめきたる" },
  { name: "鴻雁北", yomi: "こうがんかえる" },
  { name: "虹始見", yomi: "にじはじめてあらわる" },
  // 穀雨
  { name: "葭始生", yomi: "あしはじめてしょうず" },
  { name: "霜止出苗", yomi: "しもやんでなえいずる" },
  { name: "牡丹華", yomi: "ぼたんはなさく" },
  // 立夏
  { name: "蛙始鳴", yomi: "かわずはじめてなく" },
  { name: "蚯蚓出", yomi: "みみずいずる" },
  { name: "竹笋生", yomi: "たけのこしょうず" },
  // 小満
  { name: "蚕起食桑", yomi: "かいこおきてくわをはむ" },
  { name: "紅花栄", yomi: "べにばなさかう" },
  { name: "麦秋至", yomi: "むぎのときいたる" },
  // 芒種
  { name: "蟷螂生", yomi: "かまきりしょうず" },
  { name: "腐草為蛍", yomi: "くされたるくさほたるとなる" },
  { name: "梅子黄", yomi: "うめのみきばむ" },
  // 夏至
  { name: "乃東枯", yomi: "なつかれくさかるる" },
  { name: "菖蒲華", yomi: "あやめはなさく" },
  { name: "半夏生", yomi: "はんげしょうず" },
  // 小暑
  { name: "温風至", yomi: "あつかぜいたる" },
  { name: "蓮始開", yomi: "はすはじめてひらく" },
  { name: "鷹乃学習", yomi: "たかすなわちわざをならう" },
  // 大暑
  { name: "桐始結花", yomi: "きりはじめてはなをむすぶ" },
  { name: "土潤溽暑", yomi: "つちうるおうてむしあつし" },
  { name: "大雨時行", yomi: "たいうときどきふる" },
  // 立秋
  { name: "涼風至", yomi: "すずかぜいたる" },
  { name: "寒蝉鳴", yomi: "ひぐらしなく" },
  { name: "蒙霧升降", yomi: "ふかききりまとう" },
  // 処暑
  { name: "綿柎開", yomi: "わたのはなしべひらく" },
  { name: "天地始粛", yomi: "てんちはじめてさむし" },
  { name: "禾乃登", yomi: "こくものすなわちみのる" },
  // 白露
  { name: "草露白", yomi: "くさのつゆしろし" },
  { name: "鶺鴒鳴", yomi: "せきれいなく" },
  { name: "玄鳥去", yomi: "つばめさる" },
  // 秋分
  { name: "雷乃収声", yomi: "かみなりすなわちこえをおさむ" },
  { name: "蟄虫坏戸", yomi: "むしかくれてとをふさぐ" },
  { name: "水始涸", yomi: "みずはじめてかるる" },
  // 寒露
  { name: "鴻雁来", yomi: "こうがんきたる" },
  { name: "菊花開", yomi: "きくのはなひらく" },
  { name: "蟋蟀在戸", yomi: "きりぎりすとにあり" },
  // 霜降
  { name: "霜始降", yomi: "しもはじめてふる" },
  { name: "霎時施", yomi: "こさめときどきふる" },
  { name: "楓蔦黄", yomi: "もみじつたきばむ" },
  // 立冬
  { name: "山茶始開", yomi: "つばきはじめてひらく" },
  { name: "地始凍", yomi: "ちはじめてこおる" },
  { name: "金盞香", yomi: "きんせんかさく" },
  // 小雪
  { name: "虹蔵不見", yomi: "にじかくれてみえず" },
  { name: "朔風払葉", yomi: "きたかぜこのはをはらう" },
  { name: "橘始黄", yomi: "たちばなはじめてきばむ" },
  // 大雪
  { name: "閉塞成冬", yomi: "そらさむくふゆとなる" },
  { name: "熊蟄穴", yomi: "くまあなにこもる" },
  { name: "鱖魚群", yomi: "さけのうおむらがる" },
  // 冬至
  { name: "乃東生", yomi: "なつかれくさしょうず" },
  { name: "麋角解", yomi: "さわしかのつのおつる" },
  { name: "雪下出麦", yomi: "ゆきわたりてむぎいずる" },
  // 小寒
  { name: "芹乃栄", yomi: "せりすなわちさかう" },
  { name: "水泉動", yomi: "しみずあたたかをふくむ" },
  { name: "雉始雊", yomi: "きじはじめてなく" },
  // 大寒
  { name: "款冬華", yomi: "ふきのはなさく" },
  { name: "水沢腹堅", yomi: "さわみずこおりつめる" },
  { name: "鶏始乳", yomi: "にわとりはじめてとやにつく" },
];

// ── 天文計算ユーティリティ ────────────────────────────────────
function julianFromDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

// 太陽黄経（度, 0–360）。簡易式。
function solarLongitude(jd: number): number {
  const t = (jd - J2000) / 36525;
  const L0 = (280.46646 + 36000.76983 * t + 0.0003032 * t * t) % 360;
  const M = (357.52911 + 35999.05029 * t - 0.0001537 * t * t) % 360;
  const Mr = M * RAD;
  const C =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(Mr) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  return (((L0 + C) % 360) + 360) % 360;
}

// 指定年で黄経 targetLng を跨ぐ瞬間の JST 日付（月日）を二分探索で返す。
function solarTermDate(year: number, targetLng: number): Date {
  const norm = (l: number) => (targetLng === 0 && l > 180 ? l - 360 : l);
  const startJd = Date.UTC(year, 0, 1) / 86400000 + 2440587.5;
  const endJd = Date.UTC(year, 11, 31, 23) / 86400000 + 2440587.5;
  let prev = norm(solarLongitude(startJd));
  let a = startJd;
  let b = startJd;
  for (let jd = startJd + 1; jd <= endJd; jd += 1) {
    const cur = norm(solarLongitude(jd));
    if (prev < targetLng && cur >= targetLng) { a = jd - 1; b = jd; break; }
    prev = cur;
  }
  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    if (norm(solarLongitude(mid)) < targetLng) a = mid; else b = mid;
  }
  // JST の暦日（0:00）に正規化して返す。節気は「その日付から」属する扱い。
  const jst = new Date((b - 2440587.5) * 86400000 + 9 * 3600000);
  return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()));
}

// ── 公開関数 ──────────────────────────────────────────────────

/** 指定日（JST）が属する二十四節気と七十二候を返す。 */
export function getKoyomi(date: Date): {
  solarTerm: string;
  ko: { name: string; yomi: string };
} {
  const y = date.getFullYear();
  // 対象日を暦日（UTC 0:00）に正規化して節気日（同じくUTC暦日）と日付比較する
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // 当年の全節気日を算出し、対象日が属する区間を求める（年跨ぎは前年大寒を考慮）
  const terms: { idx: number; date: Date }[] = [];
  for (let i = 0; i < SOLAR_TERMS.length; i++) {
    terms.push({ idx: i, date: solarTermDate(y, SOLAR_TERMS[i].lng) });
  }
  // 立春前（1月〜立春）は前年の大寒〜が続いている扱い
  const prevDaikan = solarTermDate(y - 1, SOLAR_TERMS[23].lng); // 前年大寒
  const all = [{ idx: 23, date: prevDaikan }, ...terms].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // 対象日 <= の最後の節気を選ぶ
  let current = all[0];
  for (const t of all) {
    if (t.date.getTime() <= target.getTime()) current = t; else break;
  }

  // 七十二候: 節気開始からの経過日数で初候(0-4)/次候/末候を判定（各約5日）
  const elapsed = (target.getTime() - current.date.getTime()) / 86400000;
  const sub = elapsed < 5 ? 0 : elapsed < 10 ? 1 : 2;
  const koIndex = current.idx * 3 + sub;

  return {
    solarTerm: SOLAR_TERMS[current.idx].name,
    ko: SEVENTY_TWO[koIndex],
  };
}

/** 指定日（JST）の日の出・日の入り時刻（"HH:MM"）。極夜等は null。 */
export function getSunTimes(date: Date): { rise: string; set: string } | null {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dUTC = Date.UTC(y, m - 1, d, 12, 0) / 86400000 + 2440587.5;
  const n = Math.round(dUTC - J2000 - 0.0009) + 0.0009 + (-LNG / 360);
  const M = (357.5291 + 0.98560028 * n) % 360;
  const C =
    1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const Jtransit = J2000 + n + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const delta = Math.asin(Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD));
  const cosH =
    (Math.sin(-0.833 * RAD) - Math.sin(LAT * RAD) * Math.sin(delta)) /
    (Math.cos(LAT * RAD) * Math.cos(delta));
  if (cosH > 1 || cosH < -1) return null;
  const H = Math.acos(cosH) / RAD;
  const toJST = (J: number) => {
    const dt = new Date((J - 2440587.5) * 86400000 + 9 * 3600000);
    return `${String(dt.getUTCHours()).padStart(2, "0")}:${String(dt.getUTCMinutes()).padStart(2, "0")}`;
  };
  return { rise: toJST(Jtransit - H / 360), set: toJST(Jtransit + H / 360) };
}

/** 指定日（JST 正午基準）の月齢（0–29.5）。 */
export function getMoonAge(date: Date): number {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0);
  const jd = julianFromDate(noon);
  const knownNewMoon = 2451550.1; // 2000-01-06 18:14 UT
  const syn = 29.530588853;
  return ((jd - knownNewMoon) % syn + syn) % syn;
}

/** 月齢→月相のSVGアイコン（小・控えめ）。塗りで満ち欠けを近似表現。 */
export function moonPhaseSvg(age: number, size = 14): string {
  // 0=新月, 7.4=上弦, 14.8=満月, 22.1=下弦
  const phase = age / 29.530588853; // 0–1
  // 照らされている割合（0=新月,1=満月）
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const r = size / 2;
  // 端の弧の向き（右半分/左半分が満ちる）で満ち欠けを近似
  const waxing = phase < 0.5;
  // 半月幅: 中央の境界を楕円で描く
  const k = Math.abs(1 - 2 * illum); // 0=満月, 1=新月
  const sweepOuter = waxing ? 1 : 0;
  const sweepInner = illum < 0.5 ? (waxing ? 0 : 1) : (waxing ? 1 : 0);
  const rx = (k * r).toFixed(2);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${r}" cy="${r}" r="${r - 0.5}" fill="#1f2937" opacity="0.15"/>
    <path d="M${r},0.5 A${r - 0.5},${r - 0.5} 0 0 ${sweepOuter} ${r},${size - 0.5} A${rx},${r - 0.5} 0 0 ${sweepInner} ${r},0.5 Z" fill="#d4a017"/>
  </svg>`;
}
