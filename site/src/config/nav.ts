export type NavItem = {
  label: string;
  href: string;
  desc?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const topSwitch = [
  { label: "Light Forest", href: "/" },
  { label: "Deep Forest", href: "/deep/" },
  { label: "Now（天気/注意）", href: "/now/" },
] as const;

export const floatingNav: NavItem[] = [
  { label: "利用案内", href: "/guide/" },
  { label: "アクセス", href: "/access/" },
];

export const hamburgerGroups: NavGroup[] = [
  {
    title: "フィールド",
    items: [
      { label: "サイト一覧", href: "/sites/" },
      { label: "ライトフォレスト", href: "/light/" },
      { label: "ディープフォレスト", href: "/deep/" },
    ],
  },
  {
    title: "過ごし方",
    items: [
      { label: "体験", href: "/experiences/" },
      { label: "薪", href: "/firewood/" },
    ],
  },
  {
    title: "サポート",
    items: [
      { label: "お知らせ", href: "/news/" },
      { label: "よくある質問", href: "/faq/" },
      { label: "ルール/免責", href: "/rules/" },
    ],
  },
];

export const reserveCta = {
  label: "予約する",
  href: "https://www.489pro.com/????", // 後で差し替え（今は仮でOK）
};
