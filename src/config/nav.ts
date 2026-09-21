export type NavItem = {
	label: string;
	href: string;
	desc?: string;
};

export const topSwitch = [
	{ label: "ライトフォレスト", href: "/" },
	{ label: "ディープフォレスト", href: "/deep/" },
] as const;

export const floatingNav: NavItem[] = [
	{ label: "利用案内", href: "/light-guide/" },
];

// ───────────────────────────────────────────────────────────────
//  予約導線（proX）の単一ソース
//
//  planlist/ は日付未指定の初期表示で「プラン一覧(0)」になるため、
//  主要導線には使わない。日付・人数から入れる search/ を既定とする。
//  ※ これは初期表示の挙動であり、在庫ゼロを意味しない。
//    在庫の有無は実ブラウザの表示を正とする。
//  ※ plan/<id>/ 形式は 404 を返すため使用しない。
// ───────────────────────────────────────────────────────────────
const PROX_BASE = "https://www.489pro-x.com/ja/s/oiranomori";

/** 全体検索（日付・人数を入力できる入口）。グローバルな「予約する」はここへ。 */
export const PROX_SEARCH_URL = `${PROX_BASE}/search/`;

/** 全プラン一覧。初期表示が0件になるため主要CTAでは使わない（補助導線のみ）。 */
export const PROX_PLANLIST_URL = `${PROX_BASE}/planlist/`;

/**
 * ディープフォレスト専用プラン（plans=9）の予約URL。
 *
 * 実ブラウザで部屋リストまで到達することを確認済みの確定URL。
 * show=room（部屋リスト直行）であり、proxPlanUrl() が生成する
 * show=plan とは別物。Deep のCTAは必ずこの定数を使うこと。
 * クエリは実URLのまま保持する（順序・値を変更しない）。
 */
export const PROX_DEEP_RESERVE_URL = `${PROX_BASE}/search/?nights=1&r_num=1&num=1&plans=9&show=room&isPriceTotalPerson=false&nights_unspecified=1`;

/** ディープフォレストの予約CTA文言（全ページ統一）。 */
export const DEEP_RESERVE_LABEL = "ディープフォレストの空きを確認する";

/** 会員・予約確認まわり（補助導線）。予約の主導線は PROX_SEARCH_URL。 */
export const PROX_MEMBER_SIGNUP_URL = `${PROX_BASE}/member/input/`;
export const PROX_MEMBER_LOGIN_URL = `${PROX_BASE}/member/login/`;
export const PROX_BOOKING_LOOKUP_URL = `${PROX_BASE}/booking/login/`;

/** 外部予約サイト。公式（PROX）が主導線で、こちらは補助。 */
export const RAKUTEN_CAMP_URL =
	"https://camp.travel.rakuten.co.jp/properties/836?adults=1&reservationType=stay";

/** プラン個別への着地URLを組み立てる（show=plan 形式）。Deep には使わない。 */
export function proxPlanUrl(id: number | string): string {
	return `${PROX_BASE}/search/?plans=${id}&show=plan`;
}

export const reserveCta = {
	label: "予約する",
	href: PROX_SEARCH_URL,
};

// ナビ一元化：Footer / HamburgerMenu が参照する単一ソース。
//   active  未指定=true（false で disabled 描画／既存の準備中表示）
//   menu    未指定=true（false の項目はフッターのみ。ハンバーガーには出さない）
//   external 未指定=false
export type SiteNavItem = {
	label: string;
	href: string;
	external?: boolean;
	active?: boolean;
	menu?: boolean;
};

export type SiteNavGroup = {
	title: string;
	items: SiteNavItem[];
};

export const siteNav: SiteNavGroup[] = [
	{
		title: "予約・会員",
		items: [
			{
				label: "予約する",
				href: PROX_SEARCH_URL,
				external: true,
			},
			{ label: "予約ガイド", href: "/reservation-guide/" },
			{
				label: "ご予約確認",
				href: "https://www.489pro-x.com/ja/s/oiranomori/booking/login/",
				external: true,
				menu: false,
			},
			{
				label: "会員ログイン",
				href: "https://www.489pro-x.com/ja/s/oiranomori/member/login/",
				external: true,
				menu: false,
			},
			{
				label: "新規会員登録",
				href: "https://www.489pro-x.com/ja/s/oiranomori/member/input/",
				external: true,
				menu: false,
			},
			{ label: "チェックアウトの連絡", href: "/checkout/" },
			{ label: "キャンセルポリシー", href: "/policy/#cancel", menu: false },
		],
	},
	{
		title: "おいらの森でキャンプする",
		items: [
			// /sites/ はライトフォレスト専用ハブ。Deep を選べる誤解を避けるため
			// ラベルに必ず「ライト」を明示する（Deep 用の同種リンクは作らない）。
			{ label: "ライトのサイト・区画を選ぶ", href: "/sites/" },
			// 「選ぶ → 過ごす → 調べる」の順。ライト／ディープは別商品として対で並べる。
			{ label: "ライトフォレストで過ごす一泊", href: "/stay-light/" },
			{ label: "ライトフォレスト 利用案内", href: "/light-guide/" },
			{ label: "ディープフォレストで過ごす一泊", href: "/stay-deep/" },
			{ label: "ディープフォレスト 利用案内", href: "/deep-guide/" },
			{ label: "場内マップ（ライト）", href: "/lightforest-map/" },
			{ label: "おいらの薪", href: "/firewood/" },
			{ label: "レンタル", href: "/rental/" },
			{ label: "売店", href: "/shop/" },
			{ label: "年間パスポート・回数券", href: "/passport/" },
			{ label: "よくある質問", href: "/faq/" },
		],
	},
	{
		title: "おいらの森",
		items: [
			{ label: "アクセス", href: "/access/" },
			{ label: "周辺案内", href: "/map/" },
			{ label: "天気・気温", href: "/now/" },
			{ label: "今日のおいらの森", href: "/forest-daily/" },
			{ label: "お知らせ", href: "/news/" },
			{ label: "お問い合わせ", href: "/contact/" },
		],
	},
	{
		title: "おいらと森と",
		items: [
			{ label: "森の住人", href: "/residents/" },
			{ label: "オイラーズ", href: "/oiras/" },
			{
				label: "The 森 Chronicles",
				href: "https://note.com/oiranomori/m/m820d8cac57a3",
				external: true,
			},
			{ label: "メディア・ロケ地・貸し切り", href: "/media/" },
			{ label: "運営会社・関連組織", href: "/about/" },
			{ label: "利用規約", href: "/policy/#terms", menu: false },
			{ label: "プライバシーポリシー", href: "/policy/#privacy", menu: false },
		],
	},
];
