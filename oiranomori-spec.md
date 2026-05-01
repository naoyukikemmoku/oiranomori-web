# 里山パークおいらの森 — サイト仕様書

最終更新: 2026年5月

---

## プロジェクト概要

| 項目 | 内容 |
|---|---|
| サイト名 | 里山パークおいらの森（Satoyama Park Oira no Mori） |
| URL | https://oiranomori.jp |
| 所在地 | 〒321-0525 栃木県那須烏山市福岡1047 |
| 電話 | 050-3647-1047 |
| メール | oira@oiranomori.jp |
| 運営会社 | 株式会社橋本商事（代表: 橋本佳子） |
| 設立 | 2020年6月15日（キャンプ場開業） |

栃木県那須烏山市の里山キャンプ場。「100年の森作り」を経営理念とし、林業・里山保全活動とキャンプ場運営を統合。フィールドはライトフォレスト（ファミリー・初心者向け）とディープフォレスト（18歳以上・上級者向け）の2エリア。

### 関連法人

| 法人名 | 役割 |
|---|---|
| 株式会社橋本商事 | キャンプ場運営 |
| 株式会社やつだファーム | 農業部門 |
| やつびと100年の森 | 林業・森林整備団体 |

### SNSアカウント（全サービス共通: `@oiranomori`）

- note: https://note.com/oiranomori
- Instagram: https://instagram.com/oiranomori
- Facebook: https://facebook.com/oiranomori
- X（旧Twitter）: https://x.com/oiranomori

---

## デザインコンセプト

**参照**: 「NOT A HOTEL」の没入感 × 「ゲストハウスLeu」の機能性

**禁忌（絶対に使わない）**
- 白いカードUI・安易な枠線・影
- ボタンやアラートなど汎用コンポーネント感のある要素
- キャンプ場サイトっぽいテンプレート感

**視覚表現の方向性**
- 地面にフラットに置かれたテキスト
- 情緒的なタイポグラフィ（Noto Serif JP）
- 余白を恐れない大胆なレイアウト
- ダーク・アースカラーベース

### フィールドキャラクター

| フィールド | キャラクター |
|---|---|
| ライトフォレスト（LP = `/`） | 安心・快適・ファミキャン・ソロ初心者歓迎 |
| ディープフォレスト（LP = `/deep/`） | 18歳以上限定・静寂・直火可・ブッシュクラフト・上級者向け |

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Astro 5.x（静的生成） |
| スタイリング | Tailwind CSS 4.x（daisyUI不使用） |
| CMS | microCMS（お知らせ管理） |
| ホスティング | Cloudflare Pages |
| バージョン管理 | GitHub（リポジトリ: `oiranomori-web`） |
| 予約システム | 489Pro-X（外部サービス） |
| 地図 | Google Maps JavaScript API Advanced Markers |
| 気象情報 | Open-Meteo API（ヘッダー天気）・気象庁API（森のいまページ） |
| アクセス解析 | Google Analytics 4（ID: G-74NDHG8YJ7 直接タグ） |
| リンター | Biome |

### 主要 npm パッケージ

```json
"dependencies": {
  "@tailwindcss/vite": "^4.x",
  "astro": "^5.x",
  "microcms-js-sdk": "^3.x"
},
"devDependencies": {
  "@astrojs/sitemap": "^3.x",
  "astro-robots-txt": "^1.x"
}
```

---

## レイアウト構成

```
BaseLayout.astro        ← HTMLベース。OGP・Twitter Card・BreadcrumbList JSON-LD・GA4タグ・フォント
  ├── PageLayout.astro  ← 標準コンテンツページ用（max-w-6xl、padding管理）
  └── LpLayout.astro    ← LP・全幅セクション用（padding管理なし、各ページで自由レイアウト）
```

### BaseLayout props

| prop | デフォルト | 説明 |
|---|---|---|
| `title` | `"おいらの森"` | `<title>` および OGP title |
| `description` | サイト共通説明文 | meta description および OGP description |
| `noindex` | `false` | `true` でnoindex,nofollow |
| `ogImage` | `"https://oiranomori.jp/images/lp/hero.jpg"` | OGP・Twitter Card 画像URL |
| `lastUpdated` | なし | フッターに「最終更新：○○」表示 |

### 共通コンポーネント

| コンポーネント | 役割 |
|---|---|
| `Header.astro` | ロゴ・ライト/ディープ切り替えタブ（PC Row1・スマホ Row2）・天気アイコン＋気温・ハンバーガーメニュー。スクロールで自動非表示 |
| `HamburgerMenu.astro` | スマホ用フルスクリーンメニュー |
| `FloatingNav.astro` | PC右側固定の利用案内タブ |
| `ReserveCTA.astro` | 画面下部固定の予約ボタン |
| `Footer.astro` | ナビリンク4グループ・SNS・著作権・最終更新日 |
| `OshiraseList.astro` | お知らせ一覧コンポーネント（microCMS連携） |
| `SeasonSlider.astro` | 四季スライダー（トップページ） |

### フッターナビゲーション構成

**予約・会員**
予約する（外部）/ 予約ガイド / ご予約確認（外部）/ 会員ログイン（外部）/ 新規会員登録（外部）/ チェックアウトの連絡 / キャンセルポリシー

**おいらの森でキャンプする**
ライトフォレスト 利用案内 / ディープフォレスト 利用案内 / 場内マップ（ライト）/ おいらの薪 / レンタル / 売店 / 年間パスポート・回数券 / よくある質問

**おいらの森**
アクセス / 周辺案内 / 森のいま / お知らせ / お問い合わせ

**おいらと森と**
森の住人 / オイラーズ / The 森 Chronicles（note外部）/ メディア・ロケ地・貸し切り / 運営会社・関連組織 / 利用規約 / プライバシーポリシー

---

## ページ一覧

### トップ・共通

| URL | レイアウト | タイトル | 主な内容 |
|---|---|---|---|
| `/` | LpLayout | ホーム（ライトフォレストLP） | Hero・お知らせ（最新3件）・四季スライダー・薪CTA・プラン一覧・residents誘導リンク |
| `/residents/` | LpLayout | 森の住人 | 「おいら」（林業学部出身・2017年山購入・2020年移住・キャンプ場開設）と「おかみ（橋本佳子）」の人物紹介。Person JSON-LDあり |
| `/oiras/` | LpLayout | OIRAS | 森の整備・農業・運営を担うコミュニティ「オイラーズ」の紹介。報酬1,000pt/時間。インターンシップ受け入れ。VolunteerOpportunity JSON-LDあり |
| `/about/` | PageLayout | 運営会社・関連組織 | 株式会社橋本商事・株式会社やつだファーム・やつびと100年の森の3組織。Organization JSON-LDあり |
| `/now/` | LpLayout | 森のいま | 気象庁API連携。注意報・アメダス・衛星画像・雨雲レーダー・週間予報。「おいら監修｜現地アメダスデータをもとに構築」と明示 |
| `/news/` | PageLayout | お知らせ | microCMS連携の記事一覧（10件/ページ）。ページネーションあり |
| `/news/[id]` | PageLayout | お知らせ詳細 | microCMS記事個別ページ（動的ルート）。Article JSON-LDあり |
| `/news/page/[page]` | PageLayout | お知らせ バックナンバー | ページネーション用動的ルート |
| `/map/` | BaseLayout直接 | 場内・周辺マップ | Google Maps Advanced Markers。場内ビュー（サイト・設備）と周辺ビュー（食事・温泉・買い物・観光・医療）を切り替え。`spots.json`からデータ取得。TouristAttraction+Place JSON-LDあり |
| `/media/` | LpLayout | メディア・ロケ地・団体貸し切り | BS-TBS「ヒロシのぼっちキャンプ」Season 6 #127/#128（2023年3月22日放送）掲載。ロケ地・撮影利用、団体貸し切りはお問い合わせ案内 |

### ライトフォレスト

| URL | レイアウト | タイトル | 主な内容 |
|---|---|---|---|
| `/light-guide/` | LpLayout | ライトフォレスト 利用案内 | 料金（オートサイト¥3,300〜）・チェックイン/アウト・ルール・設備詳細 |

### ディープフォレスト

| URL | レイアウト | タイトル | 主な内容 |
|---|---|---|---|
| `/deep/` | LpLayout | ディープフォレスト（LP） | 18歳以上限定フィールドの世界観LP。BS-TBSヒロシのぼっちキャンプ ロケ地バッジあり |
| `/deep-guide/` | LpLayout | ディープフォレスト 利用案内 | 料金・チェックイン/アウト・直火ルール等の詳細 |

### 施設・サービス

| URL | レイアウト | タイトル | 主な内容 |
|---|---|---|---|
| `/firewood/` | LpLayout | こだわりの薪 | 自家生産広葉樹薪の販売。セルフ量り売り¥100/kg・樹種別パッキング品¥770〜。林業資格（チェーンソーによる伐木等特別教育・刈払機取扱作業者安全衛生教育・測量士）掲載。Product ItemList JSON-LDあり |
| `/rental/` | PageLayout | レンタル | テント・タープ・寝具・照明・家具・調理ギア・焚き火・冬期限定・その他。設営/撤収サービス（¥1,000〜¥3,000）あり。ItemList JSON-LDあり |
| `/shop/` | PageLayout | 売店 | ドリンク（生ビール〜ソフトドリンク）・焚き火着火用品・燃料/ガス/炭・産直食材・ローソク・消耗品。量り売り（生ビール/ハイボール¥1/ml、パラフィンオイル¥3/g、灯油¥150/L）。セルフQR精算。ItemList JSON-LDあり |
| `/passport/` | PageLayout | 年間パスポート・回数券 | プレミアム¥66,000・スタンダード¥44,000・シングル¥33,000。ItemList JSON-LDあり |

### 案内・サポート

| URL | レイアウト | タイトル | 主な内容 |
|---|---|---|---|
| `/access/` | LpLayout | アクセス | 車（東京2h・宇都宮45分）・電車（JR烏山線 鴻野山駅/大金駅）・タクシー・徒歩の4手段案内。カーナビ禁止・Google Map指定。Google Maps embed（iframeベース）。JR烏山線ACCUM写真1枚（`/images/access/accum-1.JPEG`）。入り口急坂の注意テキストあり |
| `/reservation-guide/` | PageLayout | 予約ガイド | 予約手順・キャンセルポリシー（`#cancellation` アンカーあり） |
| `/faq/` | PageLayout | よくある質問 | Q&A形式サポートページ |
| `/policy/` | PageLayout | ご利用のルール | 利用規約（`#terms`）・プライバシーポリシー（`#privacy`） |
| `/contact/` | PageLayout | お問い合わせ | お問い合わせフォーム |
| `/contact/thanks/` | PageLayout | 送信完了 | noindex設定 |
| `/checkout/` | PageLayout | チェックアウト連絡 | チェックアウト時の連絡フォーム |
| `/checkout/thanks/` | PageLayout | チェックアウト完了 | noindex設定 |

---

## データ構造

### 場内マップ（`src/data/spots.json`）

| キー | 内容 |
|---|---|
| `home` | キャンプ場本部座標 |
| `light` | ライトフォレスト内施設（トイレ・流し・受付等） |
| `auto` | オートサイト（39区画） |
| `block` | 区画サイト（C・11番） |
| `solo` | ソロ区画（9サイト） |
| `facility_power` | コンセント設備（4箇所） |
| `food` | 周辺食事処（14店舗） |
| `bath` | 周辺温泉・風呂（11施設） |
| `shopping` | 周辺買い物（20店舗） |
| `sightseeing` | 周辺観光（13スポット） |
| `emergency` | 緊急・医療（1病院） |

### お知らせ（microCMS `oshirase` エンドポイント）

- フィールド: タイトル・本文・カテゴリー・公開日
- ホームページ: 最新3件
- 一覧ページ: 10件/ページ、ページネーションあり

---

## SEO・構造化データ（JSON-LD）

### 全ページ共通

| スキーマ | 付与箇所 |
|---|---|
| BreadcrumbList | BaseLayout.astro（パスから自動生成） |

### ページ別 JSON-LD

| ページ | スキーマ型 |
|---|---|
| `/`（ホーム） | LocalBusiness + Campground |
| `/residents/` | Person × 2（おいら・橋本佳子） |
| `/oiras/` | VolunteerOpportunity |
| `/about/` | Organization |
| `/map/` | TouristAttraction + Place |
| `/firewood/` | ItemList（Product × 6） |
| `/rental/` | ItemList（Product × 6） |
| `/shop/` | ItemList（Product × 5） |
| `/passport/` | ItemList（Product × 3） |
| `/news/[id]` | Article |

### OGP・Twitter Card

- `og:type`: website
- `og:image`・`twitter:image`: 各ページで`ogImage` prop指定（デフォルト: `hero.jpg`）
- `twitter:card`: summary_large_image
- `twitter:site`: @oiranomori
- canonical: 全ページ自動付与

---

## 環境変数（`.env`、Git管理外）

| 変数名 | 用途 |
|---|---|
| `PUBLIC_GMAPS_API_KEY` | Google Maps JavaScript API キー |
| `PUBLIC_GMAPS_MAP_ID` | Google Maps Map ID（Advanced Markers用） |
| `MICROCMS_SERVICE_DOMAIN` | microCMS サービスドメイン |
| `MICROCMS_API_KEY` | microCMS API キー |

---

## 開発・デプロイフロー

1. ローカル開発: `npm run dev`（Astro dev server）
2. コード管理: GitHub `oiranomori-web` リポジトリ（`main` ブランチ）
3. 自動デプロイ: `main` push → Cloudflare Pages 自動ビルド
4. サイトマップ: `@astrojs/sitemap` 自動生成（`/checkout/`・`/thanks/` 除外）
5. robots.txt: `astro-robots-txt` 自動生成

---

## 未対応・作業待ちコンテンツ

| ページ | 内容 | 状態 |
|---|---|---|
| `/residents/` | おかみパートの体験談テキスト | ナオ側で準備中 |
| `/media/` | 雑誌掲載情報 | 別途追記予定 |
