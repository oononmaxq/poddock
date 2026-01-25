# poddock

ポッドキャスト配信管理アプリケーション

## 技術スタック

- **フレームワーク**: Astro + Hono
- **ランタイム**: Cloudflare Workers
- **DB**: Cloudflare D1
- **ストレージ**: Cloudflare R2
- **ORM**: Drizzle
- **CSS**: Tailwind CSS + daisyUI

## 必要条件

- Node.js 20+
- npm or pnpm
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare アカウント

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Cloudflare にログイン

```bash
wrangler login
```

### 3. D1 データベースの作成

```bash
wrangler d1 create poddock-db
```

出力された `database_id` を `wrangler.toml` に設定してください。

### 4. R2 バケットの作成

```bash
wrangler r2 bucket create poddock-media
```

### 5. 環境変数の設定

`.dev.vars` ファイルを作成:

```
JWT_SECRET=your-secret-key-here
```

### 6. マイグレーションの実行

```bash
# ローカル
npm run db:migrate:local

# リモート（本番）
npm run db:migrate
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### プレビュー（本番環境相当）

```bash
npm run preview
```

## テスト

```bash
# 全テスト実行
npm run test

# ウォッチモード
npm run test:watch
```

## デプロイ

```bash
npm run deploy
```

または `main` ブランチへの push で自動デプロイ。

## ドキュメント

詳細なドキュメントは `docs/` ディレクトリを参照:

- [開発目的・スコープ](docs/01.開発目的・スコープ定義書.md)
- [要件定義](docs/02.要件定義.md)
- [画面設計](docs/03.画面設計.md)
- [ドメイン設計](docs/04.ドメイン設計.md)
- [ER図](docs/05.ER図.md)
- [API設計](docs/06.API設計.md)
- [RSS仕様書](docs/07.RSS仕様書.md)
- [技術選定](docs/09.技術選定.md)

## 設計ルール

実装・設計ルールは [CLAUDE.md](CLAUDE.md) を参照。
