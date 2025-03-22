import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './context';

// 環境変数
const isDevelopment = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 4000;

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// tRPC API エンドポイント
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// /health エンドポイントを追加
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


// サーバー起動
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export type AppRouter = typeof appRouter;
