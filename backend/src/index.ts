import express from 'express';
import cors from 'cors';
import path from 'path';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './context';
import { upload, getFileInfo } from './utils/upload';

// 環境変数
const isDevelopment = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 4000;

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// アップロードされたファイルを提供するための静的ファイルサーバー
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// tRPC API エンドポイント
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// multerのリクエスト型を拡張
interface MulterRequest extends express.Request {
  file?: any; // multerのファイル型
}

// ファイルアップロードエンドポイント
app.post('/api/upload', upload.single('file'), (req: MulterRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }

    // ファイル情報を返す
    const fileInfo = getFileInfo(req.file);
    return res.status(200).json(fileInfo);
  } catch (error: any) {
    console.error('ファイルアップロードエラー:', error);
    return res.status(500).json({ error: error.message || 'ファイルアップロード中にエラーが発生しました' });
  }
});

// /health エンドポイントを追加
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


// グローバルエラーハンドリング
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('サーバーエラー:', err);
  res.status(500).json({
    error: 'サーバーエラーが発生しました',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 未処理のプロミス拒否をキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のプロミス拒否:', reason);
  // アプリケーションをクラッシュさせない
});

// 未キャッチの例外をキャッチ
process.on('uncaughtException', (error) => {
  console.error('未キャッチの例外:', error);
  // アプリケーションをクラッシュさせない
});

// サーバー起動
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// 正常なシャットダウンを処理
process.on('SIGTERM', () => {
  console.log('SIGTERM受信: サーバーをシャットダウンします');
  server.close(() => {
    console.log('サーバーが正常にシャットダウンしました');
    process.exit(0);
  });
});

export type AppRouter = typeof appRouter;
