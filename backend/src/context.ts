import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { PrismaClient } from '@prisma/client';

// 環境変数
const isDevelopment = process.env.NODE_ENV === 'development';

// Prismaクライアントの初期化
const prisma = new PrismaClient({
  log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
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
