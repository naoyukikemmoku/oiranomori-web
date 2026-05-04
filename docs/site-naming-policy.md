# おいらの森 サイト名表記ルール（確定版）

**確定日：2026-05-01**
**Step 1 成果物**

---

## 決定事項

### 日本語表記

| 役割 | 表記 |
|---|---|
| 正式名称 | **里山パークおいらの森** |
| ロゴ・略称 | おいらの森 |
| 旧名（移行措置として一定期間残す） | フォレストパークおいらの森 |

### 英語表記（使い分け）

| 場面 | 表記 |
|---|---|
| 視覚表示・正式名 | **Satoyama Park Oira no Mori** |
| 技術識別子 | **oiranomori** |
| 旧名（alternateName） | Forest Park Oiranomori |

---

## 運用ルール

1. **「Satoyama Park Oira no Mori」は人間が読む場所にだけ使う**
   - Hero / フッター / OG画像 / JSON-LD `name` / `og:site_name` / 英語ページ本文 / 名刺・印刷物 / Google ナレッジパネル想定箇所

2. **「oiranomori」は機械的識別子にだけ使う**
   - ドメイン（oiranomori.jp）/ メールアドレスのローカル部 / SNSハンドル（@oiranomori）/ JSON-LD `sameAs` の URL

3. **「混在」と「使い分け」は別物**
   - 役割の違うフィールドを役割に応じて最適化する運用
   - 書き手が増えたとき判別できるよう、本ルールを `tone-guide.md`（Step 2 成果物）に必ず転記する

4. **旧名「フォレストパーク〜」は alternateName で一定期間維持**
   - 期間目安：HP リニューアル公開から半年〜1年
   - 期限後に削除を検討

---

## 反映チェックリスト

### サイト本体（リポジトリ）

- [x] `index.astro` `<title>` タグ → 「里山パークおいらの森」を含む形に統一
- [x] `index.astro` JSON-LD `name` → `里山パークおいらの森`
- [x] `index.astro` JSON-LD `alternateName` → `フォレストパークおいらの森`
- [x] レイアウト共通の `og:site_name` → `Satoyama Park Oira no Mori`
- [ ] `og:title`（各ページ） → 日本語/英語の使い分け確認
- [x] フッター名称表記 → `里山パークおいらの森` / `Satoyama Park Oira no Mori`
- [x] ヘッダーロゴ → 現状維持（おいらの森）
- [ ] 各ページの metaDescription / ogDescription → 必要に応じて更新

### サイト外（ナオ作業）

- [ ] 楽天トラベルキャンプ：店舗名変更申請（公開タイミング合わせ）
- [ ] Instagram bio：表記書き換え
- [ ] Facebook ページ名：変更
- [ ] X（旧 Twitter）：プロフィール表記
- [ ] Google Business Profile：名称変更申請
- [ ] note：マガジン/アカウント表記
- [ ] その他外部リンク・パートナーサイト

### 公開告知

- [ ] note 記事「おいらの森は、里山パークへ。」を公開（原稿準備済み）
- [ ] HP の news に告知掲載
- [ ] Instagram / X で告知

---

## 関連ドキュメント

- 作業順序：`tone-tuning-work-order.md`
- トーンガイド：`tone-guide.md`
- 改称告知記事原稿：「おいらの森は、里山パークへ。」（note 公開予定）

---

*Step 1 完了 → Step 2「トーン原則1枚化」へ*
