# Pocket Expense（ポケット経費申請）

経費申請の管理を簡単にするためのウェブアプリケーションです。ユーザーは経費を申請し、承認者はそれらを承認または却下することができます。

## 技術スタック

### バックエンド
- Node.js + TypeScript
- Express.js
- tRPC（型安全なAPI）
- Prisma ORM
- PostgreSQL

### フロントエンド
- React + TypeScript
- Vite（ビルドツール）
- React Router
- React Query + tRPC Client
- Storybook（UIコンポーネント開発）

### 開発環境
- Docker & Docker Compose
- Jest（テスト）
- ESLint（コード品質）

## 環境のセットアップ

### 前提条件

以下のツールがインストールされている必要があります：

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18以上)
- [npm](https://www.npmjs.com/) (通常Node.jsと一緒にインストールされます)

### インストール手順

1. リポジトリをクローンします：

```bash
git clone <repository-url>
cd pocket-expense
```

2. Docker Composeを使用して環境を起動します：

```bash
docker-compose up
```

これにより、以下のサービスが起動します：
- バックエンドサーバー: http://localhost:4000
- フロントエンドアプリケーション: http://localhost:3000
- Storybook: http://localhost:6006
- PostgreSQLデータベース: localhost:5432

### データベースのセットアップ

初回起動時、Prismaマイグレーションが自動的に実行され、データベーススキーマが作成されます。

手動でマイグレーションを実行する場合は、以下のコマンドを使用します：

```bash
# バックエンドコンテナ内で実行
docker-compose exec backend npx prisma migrate dev
```

## 利用可能なコマンド

### Docker環境

```bash
# すべてのサービスを起動（デタッチドモード）
docker-compose up -d

# ログを表示
docker-compose logs -f

# 特定のサービスのログを表示
docker-compose logs -f backend

# サービスを停止
docker-compose down

# ボリュームも含めて完全に削除（データベースデータも削除されます）
docker-compose down -v
```

### バックエンド（コンテナ外で実行する場合）

```bash
cd backend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# TypeScriptのコンパイル
npm run build

# ビルド後のサーバー起動
npm run start

# テストの実行
npm run test

# リントの実行
npm run lint
```

### フロントエンド（コンテナ外で実行する場合）

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# ビルド後のプレビュー
npm run preview

# テストの実行
npm run test

# リントの実行
npm run lint

# Storybookの起動
npm run storybook

# Storybookのビルド
npm run build-storybook
```

## アーキテクチャ

### システム構成

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  フロントエンド  │ ───> │   バックエンド  │ ───> │  データベース  │
│    (React)   │      │  (Express)  │      │ (PostgreSQL)│
└─────────────┘      └─────────────┘      └─────────────┘
       │                                          
       │                                          
       ▼                                          
┌─────────────┐                                   
│  Storybook  │                                   
└─────────────┘                                   
```

### バックエンド構造

バックエンドはtRPCを使用して型安全なAPIを提供しています。主要なコンポーネントは以下の通りです：

- **src/index.ts**: アプリケーションのエントリーポイント。Expressサーバーの設定とtRPCミドルウェアの統合を行います。
- **src/context.ts**: tRPCのコンテキスト作成。Prismaクライアントへのアクセスを提供します。
- **src/trpc.ts**: tRPCの初期化と手続き定義。
- **src/routers/**: 各ドメイン（expense, user）のルーターを含みます。

### フロントエンド構造

フロントエンドはReactとViteを使用しています。主要なコンポーネントは以下の通りです：

- **src/main.tsx**: アプリケーションのエントリーポイント。
- **src/App.tsx**: ルートコンポーネント。
- **src/pages/**: 各ページコンポーネント（Dashboard, ExpenseForm, Login）を含みます。
- **src/components/**: 再利用可能なUIコンポーネントを含みます。
- **src/utils/trpc.ts**: tRPCクライアントの設定。

### データベース構造

データベースはPostgreSQLを使用し、Prisma ORMでアクセスします。主要なモデルは以下の通りです：

#### User（ユーザー）
- id: UUID（主キー）
- name: 名前
- email: メールアドレス（一意）
- role: ロール（USER, APPROVER, ADMIN）
- department: 部署（オプション）
- createdAt: 作成日時
- updatedAt: 更新日時

#### ExpenseRequest（経費申請）
- id: UUID（主キー）
- title: タイトル
- amount: 金額
- description: 説明（オプション）
- status: ステータス（PENDING, APPROVED, REJECTED）
- receiptUrl: 領収書URL（オプション）
- createdAt: 作成日時
- updatedAt: 更新日時
- userId: ユーザーID（外部キー）

## API仕様

バックエンドはtRPCを使用して型安全なAPIを提供しています。主要なエンドポイントは以下の通りです：

### ユーザーAPI

- **user.getAll**: すべてのユーザーを取得
- **user.create**: 新しいユーザーを作成
  - 入力: name, email, department (オプション), role (デフォルト: USER)

### 経費API

- **expense.getAll**: すべての経費申請を取得（ユーザー情報を含む）
- **expense.create**: 新しい経費申請を作成
  - 入力: title, amount, description (オプション), userId

## 開発ガイドライン

### コーディング規約

- TypeScriptの型を適切に使用してください。
- ESLintとPrettierを使用してコードの品質と一貫性を維持してください。
- コンポーネントはなるべく小さく、再利用可能に保ってください。
- 新しいUIコンポーネントを作成する場合は、Storybookでドキュメント化してください。

### Git ワークフロー

- 機能開発は`feature/`ブランチで行ってください。
- バグ修正は`fix/`ブランチで行ってください。
- プルリクエストを作成する前に、テストが通ることを確認してください。

### テスト

- バックエンドとフロントエンドの両方でJestを使用してテストを書いてください。
- フロントエンドでは、React Testing Libraryを使用してコンポーネントをテストしてください。
- 新しい機能を追加する場合は、対応するテストも追加してください。

## トラブルシューティング

### よくある問題

#### データベース接続エラー

```
Error: P1001: Can't reach database server at `db`:`5432`
```

**解決策**: PostgreSQLコンテナが起動していることを確認してください。

```bash
docker-compose ps
```

#### Prismaマイグレーションエラー

```
Error: P1001: Migration failed
```

**解決策**: マイグレーションを手動で実行してみてください。

```bash
docker-compose exec backend npx prisma migrate reset --force
```

#### フロントエンドがバックエンドに接続できない

**解決策**: バックエンドサーバーが起動していることを確認し、CORSの設定が正しいことを確認してください。

### ログの確認

問題が発生した場合は、Dockerコンテナのログを確認してください。

```bash
docker-compose logs -f
```

## ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。
