# 技術コンテキスト

## 技術スタック

### バックエンド

- **言語**: TypeScript
- **ランタイム**: Node.js
- **フレームワーク**: Express.js
- **API**: tRPC（型安全なAPI）
- **ORM**: Prisma
- **データベース**: PostgreSQL
- **認証**: JWT（JSON Web Token）
- **暗号化**: bcryptjs

### フロントエンド

- **言語**: TypeScript
- **フレームワーク**: React
- **ビルドツール**: Vite
- **ルーティング**: React Router
- **状態管理**: React Context API
- **APIクライアント**: tRPC Client + React Query
- **UIコンポーネント**: カスタムコンポーネント + Storybook

### 開発環境

- **コンテナ化**: Docker & Docker Compose
- **テスト**: Jest
- **コード品質**: ESLint, TypeScript
- **バージョン管理**: Git

## 開発環境セットアップ

### 必要条件

- Docker & Docker Compose
- Node.js (v18以上)
- npm

### 環境構築手順

```bash
# リポジトリのクローン
git clone <repository-url>
cd pocket-expense

# Docker Composeで環境を起動
docker-compose up -d
```

### 主要なサービス

- バックエンドサーバー: http://localhost:4000
- フロントエンドアプリケーション: http://localhost:3000
- Storybook: http://localhost:6006
- PostgreSQLデータベース: localhost:5432

### Docker環境

プロジェクトはDockerを使用して開発環境を構築しています。以下のコンテナが定義されています：

1. **backend**: バックエンドサービス
   - Node.js + Express + tRPC
   - ポート: 4000
   - 環境変数: NODE_ENV=development, DATABASE_URL=postgresql://postgres:postgres@db:5432/pocket_expense

2. **frontend**: フロントエンドサービス
   - React + Vite
   - ポート: 3000
   - 環境変数: NODE_ENV=development

3. **db**: データベースサービス
   - PostgreSQL
   - ポート: 5432
   - 環境変数: POSTGRES_USER=postgres, POSTGRES_PASSWORD=postgres, POSTGRES_DB=pocket_expense

4. **storybook**: Storybookサービス
   - ポート: 6006

### Docker関連コマンド

```bash
# 環境を起動
docker-compose up -d

# ログを確認
docker-compose logs -f

# 特定のサービスのログを確認
docker-compose logs -f backend
docker-compose logs -f frontend

# 環境を停止
docker-compose down

# 環境を再構築して起動
docker-compose up -d --build
```

## データベース設計

### 主要なモデル

#### User（ユーザー）

```prisma
model User {
  id              String          @id @default(uuid())
  name            String
  email           String          @unique
  passwordHash    String
  salt            String
  refreshToken    String?
  role            UserRole        @default(USER)
  department      String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  expenseRequests ExpenseRequest[]
}

enum UserRole {
  USER
  APPROVER
  ADMIN
}
```

#### ExpenseRequest（経費申請）

```prisma
model ExpenseRequest {
  id          String        @id @default(uuid())
  title       String
  amount      Float
  description String?
  status      RequestStatus @default(PENDING)
  receiptUrl  String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  userId      String
  user        User          @relation(fields: [userId], references: [id])
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## 認証システム

### 認証フロー

1. **ユーザー登録**:
   - パスワードをbcryptでハッシュ化
   - ユーザー情報をデータベースに保存

2. **ログイン**:
   - メールアドレスとパスワードで認証
   - JWTトークンとリフレッシュトークンを発行
   - リフレッシュトークンをデータベースに保存

3. **認証チェック**:
   - リクエストヘッダーからJWTトークンを取得
   - トークンを検証
   - ユーザー情報をコンテキストに追加

4. **トークンリフレッシュ**:
   - リフレッシュトークンを検証
   - 新しいJWTトークンとリフレッシュトークンを発行

5. **ログアウト**:
   - リフレッシュトークンをデータベースから削除

### 認可システム

- **publicProcedure**: 認証不要
- **protectedProcedure**: 認証必須
- **adminProcedure**: 管理者権限必須
- **approverProcedure**: 承認者権限必須

## API設計

### 認証API

- **auth.register**: ユーザー登録
- **auth.login**: ログイン
- **auth.refreshToken**: トークンリフレッシュ
- **auth.logout**: ログアウト
- **auth.me**: 現在のユーザー情報取得

### ユーザーAPI

- **user.getAll**: すべてのユーザーを取得
- **user.getById**: 特定のユーザーを取得
- **user.updateProfile**: プロフィールを更新

### 経費API

- **expense.getAll**: すべての経費申請を取得
- **expense.getById**: 特定の経費申請を取得
- **expense.create**: 経費申請を作成
- **expense.update**: 経費申請を更新
- **expense.delete**: 経費申請を削除
- **expense.approve**: 経費申請を承認
- **expense.reject**: 経費申請を却下
