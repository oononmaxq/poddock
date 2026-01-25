# CLAUDE.md

poddock プロジェクトにおける実装・設計・運用の前提ルールを定義する。
本ファイルは、人間およびAI実装者が同一の前提で開発を進めるための
**設計上の正本（Single Source of Truth）**とする。

---

## 実行モード

- 夜間バッチ等で自動実行する場合は `--dangerously-skip-permissions` を使用
- 実装中に不明点が出た場合は、実装を止めず QUESTIONS.md に記録する

---

## 技術スタック

### コア（技術選定.md 記載）

- フレームワーク: **Astro**
- ランタイム: **Cloudflare Workers**
- ストレージ: **Cloudflare R2**
- DB: **Cloudflare D1（MVP）**

### コア（実装時採用）

> 以下は技術選定.md に未記載だが、実装で採用するライブラリ

- API フレームワーク: **Hono**（Workers上の軽量ルーティング）
- ORM: **Drizzle**（D1/Postgres両対応、型安全）
- バリデーション: **Zod**（スキーマ定義 + 型推論）
- 日付処理: **date-fns**（軽量、tree-shaking対応）
- テスト: **Vitest**
- Workers テスト: **@cloudflare/vitest-pool-workers**

### UI

- CSS: **Tailwind CSS**
- UI コンポーネント: **daisyUI**
- 画面遷移: **Astro View Transitions + ClientRouter（SPAライク）**

---

## poddock 固有のアーキテクチャ原則（重要）

### ストレージ・配信

- 音声・画像ファイルは **アプリケーションで配信しない**
- 配信は **R2 + Cloudflare CDN** に任せる（Range / HEAD 対応）
- RSS `<enclosure>` は R2 上の安定URLを指す

### アップロード

- 音声・画像アップロードは **署名付きURL（Presigned URL）方式**
- クライアントから R2 へ **直接 PUT**
- API は署名URLの発行と完了通知のみを担当する

### RSS

- RSS（XML）は DB を正本として **動的に生成**
- RSSデータは DB に保存しない
- RSSエンドポイントは以下を必須とする：
  - `ETag`
  - `Last-Modified`
  - `304 Not Modified` 対応

---

## アーキテクチャ方針

本プロジェクトは **クリーンアーキテクチャ**に従って実装する。

### レイヤー責務

- **domain**
  - エンティティ
  - ビジネスルール
  - 不変条件
- **application**
  - ユースケース
  - ドメイン操作の調整
- **infrastructure**
  - DB（Drizzle）
  - R2
  - 外部API
  - 実装詳細
- **presentation**
  - API（Hono）
  - UI（Astro）

### ディレクトリ構成（推奨）

```
src/
├── domain/           # エンティティ、ビジネスルール
├── application/      # ユースケース
├── infrastructure/   # DB、R2、外部API
└── presentation/
    ├── api/          # Hono routes（JSON / XML）
    └── ui/           # Astro pages / components
```

### 依存ルール

- 依存は外側 → 内側への一方向のみ
- domain は他レイヤーに依存しない
- application は domain のみに依存
- infrastructure / presentation は application に依存
- 依存逆転が必要な場合は application に interface を定義する

---

## 実装ルール

### ビジネスロジック

- ビジネスルールは **必ず domain / application に記述**
- presentation / infrastructure に書かない

### 型安全

- `any` は原則禁止
- `unknown` を使用し、型ガードで絞り込む
- 外部入力（API / env / DB）は **必ず Zod でバリデーション**
- `as` キャストは原則禁止（型ガードを使用）

### インフラ境界

- DB / 外部API のレスポンスは infrastructure 層で検証後、
  domain 型へ変換して application に渡す

---

## UI 実装方針

- UI は daisyUI コンポーネントを優先して使用
- 独自CSSは原則書かない
- Tailwind utility はレイアウト調整用途に限定
- 共通UI（ヘッダ/サイドバー）は同一レイアウトに配置し永続化
- ClientRouter 前提で、遷移後に必要な初期化処理は再実行される前提で実装する

---

## ドキュメント確認ルール

### 実装前

- 必ず docs/ 配下の該当ドキュメントを確認する

### 実装後

- ドキュメントとの整合性をセルフチェックする
- 乖離がある場合は **実装修正 or ドキュメント更新提案**

### 参照先

- スコープ: `docs/01.開発目的・スコープ定義書.md`
- 要件: `docs/02.要件定義.md`
- 画面: `docs/03.画面設計.md`
- ドメイン: `docs/04.ドメイン設計.md`
- DB: `docs/05.ER図.md`
- API: `docs/06.API設計.md`
- RSS:
  - `docs/07.RSS仕様書.md`
  - `docs/08.RSS生成マッピング表.md`
- 技術前提: `docs/09.技術選定.md`
- タスク: `docs/10.Todo.md`

---

## 不明点の扱い

- 実装をブロックしない不明点：
  - `docs/QUESTIONS.md` に記録して続行
- 実装をブロックする不明点：
  - その場で確認を求める

### QUESTIONS.md 記録フォーマット

- [ ] [ファイル名] 質問内容（発生日時）

---

## テストルール

- API エンドポイント実装時は対応するテストを作成
- ビジネスロジック（認証・公開判定・整合性）は必ずユニットテスト
- Workers は主要パスのみ integration テスト
- UI コンポーネントはテスト不要

### テスト実行

- 実装完了時にその場で実行
- 失敗した場合は修正してから次のタスクへ
- 夜間実行時は全テスト実行し、結果を `docs/TEST_RESULTS.md` に記録

---

## DB 運用方針

- MVP は **Cloudflare D1** を使用
- D1 は以下を前提とする：
  - メタデータ中心
  - 大規模集計・分析は行わない
- 将来のスケールに備え、
  - スキーマは正規化
  - Postgres 移行を前提とした設計を維持する

---

## 命名規則

### ファイル名

- TypeScript: `kebab-case.ts`（例: `podcast-repository.ts`）
- Astro: `kebab-case.astro`（例: `episode-list.astro`）
- コンポーネント: `PascalCase.astro`（例: `EpisodeCard.astro`）

### コード

- 変数・関数: `camelCase`
- 型・インターフェース: `PascalCase`
- 定数: `UPPER_SNAKE_CASE`
- DB カラム: `snake_case`

---

## エラーハンドリング

### API エラーレスポンス形式

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

### HTTP ステータスコード

| コード | 用途 |
|--------|------|
| 200 | 成功（GET / PUT） |
| 201 | 作成成功（POST） |
| 204 | 成功・レスポンスなし（DELETE） |
| 400 | バリデーションエラー |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソース不存在 |
| 500 | サーバーエラー |

---

## 環境変数・設定

### ローカル開発

- `.dev.vars` に秘匿値を記載（gitignore対象）
- `wrangler.toml` に非秘匿設定を記載

### 必須環境変数（想定）

```
JWT_SECRET=...
R2_BUCKET_NAME=...
```

### 設定ファイル

- `wrangler.toml`: Workers / D1 / R2 バインディング
- `drizzle.config.ts`: マイグレーション設定

---

## コミット規約

### 基本方針

- **機能単位でコミット**する（1機能 = 1コミット）
- 複数機能をまとめてコミットしない
- 動作する状態でコミットする（ビルドが通る、テストが通る）

### メッセージ形式

```
<type>: <subject>

<body（任意）>
```

### type 一覧

| type | 用途 |
|------|------|
| feat | 新機能 |
| fix | バグ修正 |
| docs | ドキュメント |
| refactor | リファクタリング |
| test | テスト追加・修正 |
| chore | ビルド・設定変更 |

### 例

```
feat: エピソード作成APIを実装

- POST /episodes エンドポイント追加
- Zodバリデーション実装
```

---

## ブランチ戦略（MVP）

- `main` ブランチで開発（シンプル運用）
- 大きな機能は feature ブランチを切っても良い
- 本番デプロイは `main` push で自動（Cloudflare Pages/Workers）
