# システムパターン

## アーキテクチャ概要

Pocket Expenseは、モダンなウェブアプリケーションアーキテクチャを採用しています：

```mermaid
graph TD
    Client[フロントエンド: React] -->|tRPC| API[バックエンド: Express + tRPC]
    API -->|Prisma ORM| DB[データベース: PostgreSQL]
    Client -->|Storybook| UI[UIコンポーネント]
```

## バックエンドアーキテクチャ

### tRPC API設計

tRPCを使用して型安全なAPIを実装しています。主要なコンポーネントは以下の通りです：

```mermaid
graph TD
    Router[tRPCルーター] --> Auth[認証ルーター]
    Router --> User[ユーザールーター]
    Router --> Expense[経費ルーター]
    
    Auth --> Register[ユーザー登録]
    Auth --> Login[ログイン]
    Auth --> Refresh[トークンリフレッシュ]
    Auth --> Logout[ログアウト]
    
    Middleware[ミドルウェア] --> IsAuth[認証チェック]
    Middleware --> IsAdmin[管理者権限チェック]
    Middleware --> IsApprover[承認者権限チェック]
```

### 認証・認可システム

JWTベースの認証システムを実装しています：

```mermaid
graph TD
    Login[ログイン] -->|認証成功| Token[JWTトークン発行]
    Token --> Access[アクセストークン]
    Token --> Refresh[リフレッシュトークン]
    
    Request[APIリクエスト] --> AuthCheck[認証チェック]
    AuthCheck -->|トークン有効| Process[リクエスト処理]
    AuthCheck -->|トークン無効/期限切れ| RefreshCheck[リフレッシュトークンチェック]
    RefreshCheck -->|有効| NewToken[新トークン発行]
    RefreshCheck -->|無効| Reject[リクエスト拒否]
```

### データアクセスパターン

Prisma ORMを使用してデータベースアクセスを抽象化しています：

```mermaid
graph TD
    API[tRPCエンドポイント] --> Context[Prismaコンテキスト]
    Context --> Query[データクエリ]
    Context --> Mutation[データ更新]
    Query --> DB[PostgreSQL]
    Mutation --> DB
```

## フロントエンドアーキテクチャ

### コンポーネント構造

Reactコンポーネントは以下の階層で構成されています：

```mermaid
graph TD
    App[App] --> Router[Routerコンポーネント]
    Router --> Pages[ページコンポーネント]
    Pages --> Components[UIコンポーネント]
    
    Context[コンテキスト] --> Auth[認証コンテキスト]
    Context --> Theme[テーマコンテキスト]
    
    App --> Context
```

### 認証状態管理

Reactコンテキストを使用して認証状態を管理しています：

```mermaid
graph TD
    AuthProvider[認証プロバイダー] --> State[状態管理]
    State --> User[ユーザー情報]
    State --> Token[トークン]
    State --> Loading[ローディング状態]
    
    AuthProvider --> Methods[メソッド]
    Methods --> Login[ログイン]
    Methods --> Register[登録]
    Methods --> Logout[ログアウト]
    Methods --> Refresh[トークンリフレッシュ]
```

## 設計パターン

### リポジトリパターン

Prisma ORMを使用してデータアクセスを抽象化しています。

### ミドルウェアパターン

tRPCミドルウェアを使用して認証・認可を実装しています。

### コンテキストパターン

Reactコンテキストを使用して状態管理を実装しています。

### 型駆動開発

TypeScriptとtRPCを使用して型安全なアプリケーション開発を実現しています。
