import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { PrismaClient } from '@prisma/client';

// 環境変数
const isDevelopment = process.env.NODE_ENV === 'development';

// Prismaクライアントの初期化
const prisma = new PrismaClient({
  log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // 接続プールの設定
  // 接続の問題を軽減するための設定
  __internal: {
    engine: {
      connectionLimit: 5, // 同時接続数を制限
    },
  },
});

// アプリケーション終了時に接続を閉じる
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  return {
    prisma,
    req,
    res,
    user: undefined as { id: string; role: string } | undefined,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
