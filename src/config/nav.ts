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
