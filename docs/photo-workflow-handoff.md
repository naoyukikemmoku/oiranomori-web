# 写真配置ワークフロー 引き継ぎ

> 別セッションで「写真枠の追加 → 写真の挿入・入れ替え」を続けるための手順書。
> 最終更新: 2026-09-22 / 対応コミット: `125d4f9`

---

## 1. この作業は何か

サイトの各ページに写真を入れていく作業。2段階に分かれる。

1. **枠を先に作る** — 写真が決まっていない段階で、破線の「写真 準備中」枠だけ実装しておく
2. **写真を挿し込む** — 別アプリで選定された CSV が届いたら、枠を実際の写真に置き換える

写真の選定は別アプリで行い、結果が `photo-selections.csv` として渡される。
このリポジトリ側は「CSVを正本として反映する」だけ。

---

## 2. 渡されるファイル

| ファイル | 役割 |
|---|---|
| `photo-selections.csv` | **正本。** slot_id / page / role / current_src / selected_photo_id / selected_filename / reviewed |
| `selection-state.json` | 選定アプリの状態。実装では基本使わない |
| `code-photo-replacement-prompt.md` | 件数サマリ |

**CSVの読み方**
- `reviewed=True` かつ `selected_filename` があるものだけ反映する
- `reviewed=False` / `selected_filename` 空 は**触らない**（未選択）
- `role` が「写真準備中」「1」「2」等の連番になっている行がある。これは準備中枠に対応する。枠の並び順＝CSVの記載順として割り当てる

---

## 3. 写真の実体（元データ）

```
C:\Users\nyk\Documents\oiranomori_photo\iCloud写真 (4).zip   (8.5GB / 903ファイル)
C:\Users\nyk\Documents\oiranomori_photo\iCloud写真 (5).zip   (2.4GB / 901ファイル)
```

CSVの `selected_filename`（例 `IMG_1847.JPEG`）でこの2つのどちらかに入っている。

### 抽出

zip5 は内部の日本語フォルダ名が CP932 で文字化けするため、**ワイルドカードでメンバー指定**する。

```bash
unzip -j -o "iCloud写真 (5).zip" "*/IMG_1847.JPEG" "*/IMG_0537.JPEG" -d <出力先>
```

### HEIC のデコード（重要）

**sharp は HEIC のピクセルを読めない**（同梱バイナリに HEVC デコーダがない。metadata は読めるが `bad seek` で落ちる）。
ffmpeg でデコードしてから sharp に渡す。

```bash
ffmpeg -y -loglevel error -i input.HEIC -frames:v 1 output.png
```

`.NEF`（raw）が来た場合は raw デコーダがないので、**内蔵JPEGプレビューをバイナリから抽出**する（過去に 7360x4912 が取れた）。

### 変換

sharp で目的の比率にクロップ → JPEG 保存。Astro が avif/webp を自動生成するので、**ソースは JPEG でよい**。

```js
sharp(src).rotate()
  .resize(w, h, { fit: "cover", position: "centre" })
  .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(dest);
```

元画像より大きくしない（アップスケールしない）ガードを入れること。

保存先は `src/assets/images/`（**新規ディレクトリを作らない**）。

---

## 4. 実装パターン

### 枠だけ作るとき

```astro
<span class="mt-4 flex aspect-[4/3] w-full items-center justify-center border border-dashed border-zinc-300 bg-zinc-50">
  <span class="text-xs tracking-[0.16em] text-zinc-400">写真 準備中</span>
</span>
```

何の写真か分かるようにする場合は `写真 準備中（灰捨て場）` のようにラベルを添える。

### 写真が入ったとき

データ側に `img` / `alt` を持たせ、マークアップで分岐する（未選択の枠が残っても壊れない）。

```astro
{item.img ? (
  <Picture
    src={item.img}
    formats={["avif", "webp"]}
    alt={item.alt}
    loading="lazy"
    sizes="(max-width: 640px) 100vw, 22rem"
    class="mt-4 aspect-[4/3] w-full object-cover"
  />
) : (
  <span class="mt-4 flex aspect-[4/3] w-full items-center justify-center border border-dashed border-zinc-300 bg-zinc-50">
    <span class="text-xs tracking-[0.16em] text-zinc-400">写真 準備中</span>
  </span>
)}
```

**ヒーローなど全幅で出すもの**は `widths` を明示する。指定しないと巨大な1枚だけになり LCP が悪化する。

```astro
<Picture src={hero} formats={["avif","webp"]} loading="eager" fetchpriority="high"
  widths={[768, 1280, 1920, 2560, 3200]} sizes="100vw" class="full-bleed ..." />
```

---

## 5. alt は必ず自分で書く

**CSVに alt は入っていない。** また、既存の枠に書いてある alt（プレースホルダ時代の文言）は、
選定された写真と一致しないことが多い。

必ず **写真を実際に開いて内容を確認し、alt を書き直す**。
これまで「タープとコット」と書いてある枠に小型テントの写真が来る、等の不一致が何度もあった。

あわせて確認すること:

- **顔が写っていないか** — 許諾済みの家族写真はOK（確認済み）。それ以外の来場者の顔は要確認
- **ナンバープレートが読めないか** — 読める場合はぼかす（過去2件対応済み）
- **直火に見える焚き火** — 写真として使うのはOK。ただし **alt / title / description / JSON-LD に「直火」の語を入れない**（CLAUDE.md §2 の絶対ライン）
- **セクションの主旨と合っているか** — 例: 「区画の広さ」を説明する節に夜の暗い写真、など噛み合わないケースは報告して指示を仰ぐ

---

## 6. 確認とデプロイ

```bash
npx biome check --write src/pages
npx astro build          # 35ページ
```

ビルド出力（`dist/`）を grep して、意図した枚数・残り準備中枠の数を機械確認してから commit する。

```bash
grep -o '写真 準備中' dist/<page>/index.html | wc -l
```

push すると Cloudflare Pages が自動デプロイ。

### 本番確認の注意（ハマりどころ）

**`?cb=xxx` のようなキャッシュバスト用クエリを付けると、古いHTMLが返ることがある。**
クエリなし＋ no-cache ヘッダで取得すること。

```bash
curl -s -L -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://oiranomori.jp/<path>/
```

`-L` を付けないと、末尾スラッシュなしURLで 308 リダイレクトの本文を見てしまう。

デプロイ待ちは until ループで:

```bash
until curl -s -H "Cache-Control: no-cache" https://oiranomori.jp/<path>/ | grep -q '<新しい文言>'; do sleep 15; done
```

---

## 7. 現在の状況（2026-09-22 時点）

### 配置済み

| ページ | 状態 |
|---|---|
| `/stay-light/` | 単枠6＋スライダー5×2 = **16枠すべて完了** |
| `/` トップ | プラン8件すべて写真あり。背景写真セクション6つ |
| `/sites/` | ヒーロー、客層サムネ4、設営5枠 完了 |
| `/light-guide/` | 受付・売店、トイレ、ルール（犬・花火）、昆虫左 完了 |
| `/about/` `/media/` `/rental/` `/deep/` `/oiras/` `/firewood/` | 配置済み |

### 残っている「写真 準備中」枠 — 計5

| ページ | 枠 | 場所 |
|---|---|---|
| `/light-guide/` | 水道・流し | `facilities` 配列 `id: "water"` の `img: null` |
| `/light-guide/` | 駐車 | `facilities` 配列 `id: "parking"` の `img: null` |
| `/light-guide/` | 灰捨て場 | `rules` 配列 `photoLabel: "灰捨て場"`（`img` 未設定） |
| `/light-guide/` | 昆虫採集の右側 | `#insects` セクションの2枚目（左は配置済み） |
| `/sites/` | グループ・ソログル・貸切 サムネ | `audienceCards` の `img: null` |

### その他の未受領素材

- **スズメバチの写真** — 「写真あり」と言われているが未受領。FAQ の `#nature` かトップの安全セクションに入れる想定
- `/sites/group/` のヒーロー、`/rental/` のヒーローは、内容不一致で見送ったまま枠自体がない状態

---

## 8. 判断を仰ぐべきケース

自走せず確認すること:

- 写真の内容とセクションの主旨が噛み合わない
- 顔が写っていて許諾が不明
- CSVの連番ラベル（1〜5等）で、どの枠に対応するか複数の解釈がある
- 料金・時刻など事実に関わる文言を、写真に合わせて変える必要が出た

---

## 9. 関連ドキュメント

- `CLAUDE.md` — 開発・運用ルールの正本。§2 直火の扱い、§5 SEO自走範囲、§6 パフォーマンス
- `docs/tone_guide.md` — コピーの正本。alt やキャプションの文体もこれに合わせる
- `docs/spec.md` — サイト仕様の正本
