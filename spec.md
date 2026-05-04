# 里山パークおいらの森 — サイト仕様書（spec.md）

最終更新：2026年5月4日

---

## 目次

1. [サイト基本情報](#1-サイト基本情報)
2. [技術スタックと環境](#2-技術スタックと環境)
3. [レイアウト構成](#3-レイアウト構成)
4. [ページ一覧](#4-ページ一覧)
5. [データ構造](#5-データ構造)
6. [JSON-LD 実装状況](#6-json-ld-実装状況)
7. [ビルド・デプロイ](#7-ビルド・デプロイ)
8. [予約システム表記ルール](#8-予約システム表記ルール)
9. [未対応・作業待ちコンテンツ](#9-未対応作業待ちコンテンツ)

---

## 1. サイト基本情報

### 名称・ドメイン

| 項目 | 内容 |
|---|---|
| 正式名称 | 里山パークおいらの森 |
| 英語名 | Satoyama Park Oira no Mori |
| ドメイン | oiranomori.jp |

**改称の事実**：2026年 HP リニューアルに伴い、「フォレストパーク おいらの森」から「里山パークおいらの森」へ改称。旧称の残存を発見した場合は修正対象とする。

### 連絡先

| 項目 | 内容 |
|---|---|
| 電話 | 050-3647-1047 |
| メール | oira@oiranomori.jp |
| 住所 | 栃木県那須烏山市福岡1047 |
| 郵便番号 | 321-0525 |

### 運営会社

**株式会社 橋本商事**（Operating Company）

| 項目 | 内容 |
|---|---|
| 代表取締役 | 橋本佳子 |
| 設立 | 2020年（令和2年）6月15日 |
| 所在地 | 栃木県那須烏山市福岡1047 |
| 取引銀行 | 栃木銀行 |
| ウェブサイト | https://hashimoto1047.co.jp |

### 関連法人・団体

**株式会社 やつだファーム**（Related Company）

| 項目 | 内容 |
|---|---|
| 代表取締役 | 橋本佳子 |
| 事業 | 農業（かぼちゃ・サトイモ等） |
| 所在地 | 栃木県那須烏山市福岡34-1 |
| 登記 | 2025年12月 |
| Instagram | https://www.instagram.com/minami.satoyama/ |

**やつびと100年の森**（Related Organization）

| 項目 | 内容 |
|---|---|
| 形態 | 任意団体 |
| 設立 | 2025年 |
| 所在地 | 栃木県那須烏山市福岡1047（株式会社橋本商事と同住所） |
| 活動 | 里山景観の保全・林業 |

### SNS アカウント

全サービスで `@oiranomori` に統一。

| サービス | URL |
|---|---|
| note | https://note.com/oiranomori |
| Instagram | https://instagram.com/oiranomori |
| Facebook | https://facebook.com/oiranomori |
| X（旧Twitter） | https://x.com/oiranomori |

---

## 2. 技術スタックと環境

### フレームワーク・主要ライブラリ（package.json 実測値）

| パッケージ | バージョン | 区分 |
|---|---|---|
| astro | ^5.16.11 | 本番依存 |
| microcms-js-sdk | ^3.2.0 | 本番依存 |
| @tailwindcss/vite | ^4.1.18 | 本番依存 |
| @astrojs/sitemap | ^3.7.0 | 開発依存 |
| astro-robots-txt | ^1.0.0 | 開発依存 |
| @biomejs/biome | ^2.3.11 | 開発依存 |
| sharp | ^0.34.5 | 開発依存 |
| tailwindcss | ^4.1.18 | 開発依存 |
| postcss | ^8.5.6 | 開発依存 |
| autoprefixer | ^10.4.23 | 開発依存 |

### 補助 API

| API | 認証 | 用途 | 使用箇所 |
|---|---|---|---|
| Open-Meteo | 不要 | 現在気温・天気コード取得 | `src/components/Header.astro` |
| Google Maps JavaScript API | `PUBLIC_GMAPS_API_KEY` | 場内・周辺マップ | `src/pages/map/index.astro` |

Open-Meteo エンドポイント:  
`https://api.open-meteo.com/v1/forecast?latitude=36.647&longitude=140.062&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`

Google Maps は WMO 天気コード（0〜99）を SVG アイコンにマッピングして Header に表示している。Advanced Markers 対応のためには `PUBLIC_GMAPS_MAP_ID` も必要（未設定時はコンソール警告を出力）。

### リンター / フォーマッター

**Biome**（@biomejs/biome ^2.3.11）。コミット前に必ず通す。

### 計測

| ツール | 測定 ID / 状態 |
|---|---|
| GA4 | `G-74NDHG8YJ7` |
| Google Search Console | 使用中（ナオ管理） |
| Cloudflare Web Analytics | 未実装 |

GA4 タグは `src/layouts/BaseLayout.astro` に直書き。全ページに適用される。

### 環境変数一覧

| 変数名 | 用途 | 使用箇所 |
|---|---|---|
| `MICROCMS_SERVICE_DOMAIN` | microCMS サービスドメイン | `src/lib/microcms.ts` |
| `MICROCMS_API_KEY` | microCMS API キー | `src/lib/microcms.ts` |
| `PUBLIC_GMAPS_API_KEY` | Google Maps API キー | `src/pages/map/index.astro`、`astro.config.mjs`（`__GMAPS_API_KEY__` として define） |
| `PUBLIC_GMAPS_MAP_ID` | Google Maps マップ ID（Advanced Markers 用） | `src/pages/map/index.astro` |

`.env` は Git 管理外。

---

## 3. レイアウト構成

### レイアウト階層

```
BaseLayout
├── PageLayout   （コンテンツページ用）
└── LpLayout     （LP・全幅レイアウト用）
```

### BaseLayout（`src/layouts/BaseLayout.astro`）

全レイアウトの基底。`<html>` から `<body>` 全体を管理する。

**Props**

| Prop | 型 | デフォルト値 | 用途 |
|---|---|---|---|
| `title` | string | `"おいらの森"` | `<title>` および OGP |
| `description` | string | （キャンプ場説明文） | `meta description` および OGP |
| `noindex` | boolean | `false` | `true` のとき `noindex,nofollow` を付与 |
| `ogImage` | string | `"https://oiranomori.jp/images/lp/hero.jpg"` | OG 画像 URL |
| `lastUpdated` | string | undefined | Footer に最終更新日として渡す |

**組み込み機能**

- Google Fonts（Noto Serif JP: 400/500/600）の読み込み
- OGP タグ一式（og:type, og:title, og:description, og:image, og:site_name, og:locale）
- Twitter Card（`summary_large_image`、`@twitter:site` = `@oiranomori`）
- canonical リンク（`Astro.url.href` を自己参照）
- BreadcrumbList JSON-LD の自動生成（パス階層から動的生成、トップページは生成しない）
- GA4 タグ（gtag.js）
- `<slot name="head" />` — ページ固有の JSON-LD 等を受け付けるスロット

### PageLayout（`src/layouts/PageLayout.astro`）

一般コンテンツページ用。BaseLayout をラップし、以下を追加する。

- Header、FloatingNav、ReserveCTA を自動インクルード
- メインコンテナ: `mx-auto max-w-6xl px-4 pb-10 pt-[calc(var(--header-offset)+1.25rem)]`
- オプション `heading` prop を渡すと `<h1>` を自動生成

### LpLayout（`src/layouts/LpLayout.astro`）

LP・全幅レイアウト用。BaseLayout をラップし、以下を追加する。

- Header、FloatingNav、ReserveCTA を自動インクルード
- メインコンテナ: `pt-[var(--header-offset)]`（左右・下のパディングなし）
- トップページ（`/`）で使用

### 共通コンポーネント一覧（`src/components/`）

| ファイル | 役割 |
|---|---|
| `Header.astro` | スティッキーヘッダー。ロゴ、ライト/ディープ切替（PC のみ）、Open-Meteo 天気表示、ハンバーガーメニュー呼び出し。スクロールダウンで自動非表示。 |
| `HamburgerMenu.astro` | 右スライドアウトのサイドメニュー。4グループのナビゲーション。オーバーレイクリック・ESC キーで閉じる。 |
| `FloatingNav.astro` | 右端フローティングタブ。ライトフォレスト / ディープフォレストの利用案内へコンテキストアウェアにリンク。 |
| `ReserveCTA.astro` | 画面下部固定の予約 CTA ボタン。外部予約サイト（489pro-x.com）へリンク。 |
| `OshiraseList.astro` | microCMS から取得したお知らせを表示。ホームでは最新3件。日付・カテゴリバッジ・タイトル・サブタイトルを表示。 |
| `SeasonSlider.astro` | 4枚の森の四季画像カルーセル。6秒間隔で自動回転。前後ボタンとプログレスバーあり。 |
| `Footer.astro` | 4カラムナビゲーション + SNS リンク + コピーライト。`lastUpdated` prop を受け取り表示。 |

### フッターナビゲーション構成（4グループ）

| グループ | 主な項目 |
|---|---|
| 予約・会員 | 予約する（外部）、予約ガイド、ご予約確認（外部）、会員ログイン（外部）、新規会員登録（外部）、チェックアウトの連絡、キャンセルポリシー |
| おいらの森でキャンプする | ライトフォレスト 利用案内、ディープフォレスト 利用案内、場内マップ（ライト）、おいらの薪、レンタル、売店、年間パスポート・回数券、よくある質問 |
| おいらの森 | アクセス、周辺案内、森のいま、お知らせ、お問い合わせ |
| おいらと森と | 森の住人、オイラーズ、The 森 Chronicles（外部: note.com）、メディア・ロケ地・貸し切り、運営会社・関連組織、利用規約、プライバシーポリシー |

---

## 4. ページ一覧

### トップ

| URL | レイアウト | 内容 |
|---|---|---|
| `/` | LpLayout | メインLP。ヒーロー、お知らせ、四季スライダー、焚火、アーリーチェックイン、ライトフォレスト紹介、プランギャラリー |

### ライトフォレスト系

| URL | レイアウト | 内容 |
|---|---|---|
| `/light-guide/` | PageLayout | ライトフォレスト 利用案内 |

### ディープフォレスト系

| URL | レイアウト | 内容 |
|---|---|---|
| `/deep/` | LpLayout | ディープフォレスト LP |
| `/deep-guide/` | PageLayout | ディープフォレスト 利用案内 |

### 施設・サービス系

| URL | レイアウト | 内容 |
|---|---|---|
| `/map/` | BaseLayout（直接使用） | 場内・周辺マップ（Google Maps Advanced Markers + spots.json） |
| `/firewood/` | LpLayout | こだわりの薪販売 |
| `/rental/` | PageLayout | レンタル品一覧 |
| `/shop/` | PageLayout | 売店案内 |
| `/passport/` | PageLayout | 年間パスポート・回数券 |

### 案内・サポート系

| URL | レイアウト | 内容 |
|---|---|---|
| `/access/` | LpLayout | アクセス |
| `/faq/` | PageLayout | よくある質問 |
| `/reservation-guide/` | PageLayout | 予約ガイド |
| `/policy/` | PageLayout | ご利用のルール |
| `/contact/` | BaseLayout（直接使用） | お問い合わせフォーム |
| `/contact/thanks/` | BaseLayout（直接使用） | お問い合わせ完了（noindex） |
| `/checkout/` | BaseLayout（直接使用） | チェックアウト連絡フォーム（noindex） |
| `/checkout/thanks/` | BaseLayout（直接使用） | チェックアウト連絡完了（noindex） |

### コンテンツ・関係者系

| URL | レイアウト | 内容 |
|---|---|---|
| `/about/` | PageLayout | 運営会社・関連組織 |
| `/residents/` | BaseLayout（直接使用） | 森の住人（おいら・おかみの紹介） |
| `/oiras/` | LpLayout | OIRAS（ボランティア・活動参加者向け） |
| `/now/` | BaseLayout（直接使用） | 森のいま |
| `/media/` | PageLayout | メディア掲載・ロケ地・団体貸し切り |

### お知らせ系

| URL | レイアウト | 内容 |
|---|---|---|
| `/news/` | BaseLayout（直接使用） | お知らせ一覧（10件/ページ） |
| `/news/[id]/` | BaseLayout（直接使用） | お知らせ詳細 |
| `/news/page/[page]/` | BaseLayout（直接使用） | お知らせ一覧（2ページ目以降） |

---

## 5. データ構造

### spots.json（`src/data/spots.json`）

場内マップ（`/map/`）で使用するスポットデータ。座標系は WGS84。

**カテゴリ一覧**

| キー | 内容 |
|---|---|
| `home` | おいらの森本体（1件）|
| `light` | 場内施設（受付・トイレ・シンク等、4件）|
| `auto` | オートサイト（1〜37 + A〜E の番号サイト、32件）|
| `block` | ブロックサイト（11, C の2件）|
| `solo` | ソロサイト（1〜9 の9件）|
| `facility_power` | コンセント設置場所（4件）|
| `food` | 周辺飲食店（14件）|
| `bath` | 周辺温泉施設（11件）|
| `shopping` | 周辺買い物施設（20件）|
| `sightseeing` | 周辺観光スポット（13件）|
| `emergency` | 救急病院（1件：那須南病院）|

**スポット共通フィールド**

```
name: string
lat: number
lng: number
comment?: string
size?: string       // サイト系のみ
description?: string
```

### microCMS — oshirase エンドポイント

| 項目 | 内容 |
|---|---|
| エンドポイント名 | `oshirase` |
| SDK クライアント | `src/lib/microcms.ts` |
| ライブラリファイル | `src/lib/oshirase.ts` |

**フィールド定義**（TypeScript 型 `Oshirase`）

| フィールド名 | 型 | 必須 | 備考 |
|---|---|---|---|
| `id` | string | ✓ | microCMS 自動付与 |
| `title` | string | ✓ | 記事タイトル |
| `content` | string | ✓ | 本文（詳細取得時のみ使用）|
| `date` | string | ✓ | 公開日（ソートキー）|
| `category` | string | ✓ | カテゴリ |
| `description` | string | — | サマリー（一覧・ホームで使用）|
| `publishedAt` | string | ✓ | microCMS 自動付与 |

**取得パターン**

| 関数 | limit | offset | fields | 用途 |
|---|---|---|---|---|
| `getOshirase(3)` | 3 | 0 | id, title, description, date, category, publishedAt | ホーム最新3件 |
| `getOshirasePage(page, 10)` | 10 | `(page-1)*10` | 同上 | 一覧ページ（10件/ページ）|
| `getOshiraseDetail(id)` | — | — | 全フィールド | 詳細ページ |

ソート順は `-date`（日付降順）。microCMS 未設定時（`MICROCMS_SERVICE_DOMAIN` または `MICROCMS_API_KEY` が未定義）は `microcms` クライアントが `null` となり、各関数はエラーをスローする。

---

## 6. JSON-LD 実装状況

### 全ページ共通（BaseLayout 自動生成）

| スキーマ | 生成条件 |
|---|---|
| `BreadcrumbList` + `ListItem` | URL にパスセグメントが存在するすべてのページ（トップは生成しない）|

### ページ個別実装

| ページ URL | 実装スキーマ |
|---|---|
| `/` | `LocalBusiness`, `Campground`, `PostalAddress`, `GeoCoordinates`, `OpeningHoursSpecification` |
| `/about/` | `Organization`, `PostalAddress` |
| `/faq/` | `FAQPage`, `Question`, `Answer` |
| `/firewood/` | `ItemList`, `ListItem`, `Product`, `Offer`, `Organization` |
| `/map/` | `TouristAttraction`, `Place`, `GeoCoordinates`, `PostalAddress`, `AdministrativeArea` |
| `/news/[id]/` | `Article`, `Organization`, `WebPage` |
| `/oiras/` | `VolunteerOpportunity`, `Organization`, `Place`, `PostalAddress` |
| `/passport/` | `ItemList`, `ListItem`, `Product`, `Offer`, `Organization` |
| `/rental/` | `ItemList`, `ListItem`, `Product`, `Offer`, `Organization` |
| `/residents/` | `Person`（おいら）、`Person`（橋本佳子）、`Organization` |
| `/shop/` | `ItemList`, `ListItem`, `Product`, `Offer`, `Organization` |

### JSON-LD 未実装ページ

以下のページは個別の JSON-LD が未確認（BreadcrumbList は自動生成）。

`/access/`, `/deep/`, `/deep-guide/`, `/light-guide/`, `/contact/`, `/now/`, `/media/`, `/reservation-guide/`, `/policy/`

---

## 7. ビルド・デプロイ

### 自動ビルドフロー

1. `main` ブランチへのプッシュ
2. Cloudflare Pages が GitHub リポジトリ（`oiranomori-web`）を検知
3. ビルドコマンド `astro build` を実行
4. 生成された `dist/` を CDN に配信

### サイトマップ・robots.txt

| ファイル | 生成ライブラリ | 備考 |
|---|---|---|
| `sitemap.xml` | `@astrojs/sitemap` | ビルド時自動生成 |
| `robots.txt` | `astro-robots-txt` | ビルド時自動生成（デフォルト全許可） |

### ビルド除外パス（サイトマップ非掲載）

`astro.config.mjs` の `sitemap.filter` に定義。

- `/checkout/`（パスに `/checkout/` を含む）
- `/checkout/thanks/`（同上）
- `/contact/thanks/`（パスに `/thanks/` を含む）

---

## 8. 予約システム表記ルール

### HP 内統一表記

「**ProX**」に統一する。

### URL・外部リンク

ベース URL: `https://www.489pro-x.com/ja/s/oiranomori/`

| 用途 | URL |
|---|---|
| プラン別予約 | `https://www.489pro-x.com/ja/s/oiranomori/search/?plans={id}&show=plan` |
| プラン一覧 | `https://www.489pro-x.com/ja/s/oiranomori/planlist/` |
| ご予約確認 | 489pro-x.com の確認ページ |
| 会員ログイン | 489pro-x.com のログインページ |
| 新規会員登録 | 489pro-x.com の登録ページ |

### 表記禁止

「abi-Booking」は提供側の都合による別名であり、HP には出さない。ヘルプページ等の公式表記も「ProX」。

---

## 9. 未対応・作業待ちコンテンツ

### 9.1 ナオ側で準備中の素材

| ページ | 未完状態 | 補足 |
|---|---|---|
| `/residents/` | おかみ（橋本佳子）パートの体験談テキスト未着。現状は出身・趣味・移住経緯のみの最小プレースホルダー。 | `src/pages/residents/index.astro` の おかみセクション |
| `/residents/` | おいらの Note リンクが `href="#"` のプレースホルダー。「もう少し個人的な話はNoteで」のリンク先 URL が未確定。 | 同上、おいらセクション末尾 |
| `/media/` | 雑誌掲載情報が未掲載。「雑誌掲載情報は順次追加予定です。」というプレースホルダーテキストが表示中。 | `src/pages/media/index.astro` |

### 9.2 トップ LP（`src/pages/index.astro`）追加合意済みセクション

現在の LP セクション順（実装済み）:

| No. | セクション | eyebrow / id |
|---|---|---|
| 1 | ヒーロー | `id="top"` |
| 2 | お知らせ | `id="news"` |
| 3 | 森の四季スライダー | SeasonSlider コンポーネント |
| 4 | キャンプといえば焚火 | `id="bonfire"` |
| 5 | アーリーチェックイン | eyebrow: `EARLY CHECK-IN` |
| 6 | ライトフォレスト紹介① | eyebrow: `LIGHT FOREST` |
| 7 | ライトフォレスト紹介② | eyebrow: `HONEST FOREST` |
| 8 | プランギャラリー | `id="plans"` |

追加合意済みセクション（未実装）:

| セクション名 | 挿入位置（現行 No. の間）| 内容概要 |
|---|---|---|
| 森のいま誘導セクション | No.2（お知らせ）の直後、No.3 の前 | `/now/` への誘導 |
| 周辺便利セクション | No.5（EARLY CHECK-IN）の直後、No.6 の前 | 温泉・買い物・食事が車10分圏内 |
| 林間の強みセクション | No.7（HONEST FOREST）の直後、No.8 の前 | 風に強い・ハンモック自由度・薪の質・林間体験 |
| 生ビール量り売りセクション | No.7追加後の直後（プランギャラリーの直前） | 生ビール量り売りの紹介 |
| ドッグランサイト1組限定の強調 | 既存プランカード（No.8）内の貸切ドッグランサイトカード | 独立セクション化は検討中 |

### 9.3 各ページの写真追加

以下のページに写真コンテンツを追加する。現状はテキスト主体または写真不足の状態。

| ページ | 現状 | 必要対応 |
|---|---|---|
| `/firewood/` | 写真不足 | 薪の質・種類が伝わる写真追加 |
| `/shop/` | 写真不足 | 売店内観・取扱商品の写真追加 |
| `/rental/` | 写真不足 | レンタル品の実物写真追加 |
| `/map/` | 写真不足 | 場内雰囲気が伝わる写真の補強 |

写真素材はナオ側で準備する。実装時はレスポンシブ画像（srcset/sizes）、loading="lazy"、width/height明示、alt属性適切設定を徹底する。

### 9.4 ハンバーガーメニュー2段化（A案）

現状の `HamburgerMenu.astro` は4グループのフラット構成。これを2段階のドリルダウン構造（A案）に再設計する。

**現状（フラット4グループ）**
- 予約・会員
- おいらの森でキャンプする
- おいらの森
- おいらと森と

**A案の方向性**
1段目で大カテゴリを選択し、2段目で詳細項目を表示する2段ナビゲーション。具体的なグルーピング・遷移演出・戻る動作の仕様は別途確定する。

**未確定事項**
- 1段目のカテゴリ分け
- 2段目への遷移アニメーション
- 戻るボタンの配置と挙動
- モバイル/PC両対応の挙動差異

仕様確定後、実装タスクとして降ろす。
