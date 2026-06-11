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

export const reserveCta = {
  label: "予約する",
  href: "https://www.489pro-x.com/ja/s/oiranomori/planlist/",
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
      { label: "予約する", href: "https://www.489pro-x.com/ja/s/oiranomori/planlist/", external: true },
      { label: "予約ガイド", href: "/reservation-guide/" },
      { label: "ご予約確認", href: "https://www.489pro-x.com/ja/s/oiranomori/booking/login/", external: true, menu: false },
      { label: "会員ログイン", href: "https://www.489pro-x.com/ja/s/oiranomori/member/login/", external: true, menu: false },
      { label: "新規会員登録", href: "https://www.489pro-x.com/ja/s/oiranomori/member/input/", external: true, menu: false },
      { label: "チェックアウトの連絡", href: "/checkout/" },
      { label: "キャンセルポリシー", href: "/reservation-guide/#cancellation", menu: false },
    ],
  },
  {
    title: "おいらの森でキャンプする",
    items: [
      { label: "ライトフォレスト 利用案内", href: "/light-guide/" },
      { label: "ディープフォレスト 利用案内", href: "/deep-guide/" },
      { label: "場内マップ（ライト）", href: "/map/?view=light" },
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
      { label: "周辺案内", href: "/map/?view=food" },
      { label: "森のいま", href: "/now/" },
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
      { label: "The 森 Chronicles", href: "https://note.com/oiranomori/m/m820d8cac57a3", external: true },
      { label: "メディア・ロケ地・貸し切り", href: "/media/" },
      { label: "運営会社・関連組織", href: "/about/" },
      { label: "利用規約", href: "/policy/#terms", menu: false },
      { label: "プライバシーポリシー", href: "/policy/#privacy", menu: false },
    ],
  },
];
