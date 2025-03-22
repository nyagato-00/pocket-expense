import { TRPCError } from '@trpc/server';
import { initTRPC } from '@trpc/server';
import { verifyToken } from '../utils/auth';
import { Context } from '../context';

const t = initTRPC.context<Context>().create();
const middleware = t.middleware;

// 認証ミドルウェア
export const isAuthenticated = middleware(async ({ ctx, next }) => {
  // リクエストヘッダーからトークンを取得
  const authHeader = ctx.req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '認証が必要です',
    });
  }

  // Bearer トークンを取得
  const token = authHeader.split(' ')[1];
  
  try {
    // トークンを検証
    const { userId, role } = verifyToken(token);
    
    // コンテキストにユーザー情報を追加
    return next({
      ctx: {
        ...ctx,
        user: {
          id: userId,
          role,
        },
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '無効なトークンです',
    });
  }
});

// 管理者権限チェックミドルウェア
export const isAdmin = middleware(async ({ ctx, next }) => {
  // まず認証を確認
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '認証が必要です',
    });
  }

  // 管理者権限をチェック
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '管理者権限が必要です',
    });
  }

  return next({ ctx });
});

// 承認者権限チェックミドルウェア
export const isApprover = middleware(async ({ ctx, next }) => {
  // まず認証を確認
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '認証が必要です',
    });
  }

  // 承認者または管理者権限をチェック
  if (ctx.user.role !== 'APPROVER' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '承認者または管理者権限が必要です',
    });
  }

  return next({ ctx });
});
