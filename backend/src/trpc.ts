import { initTRPC } from '@trpc/server';
import { Context } from './context';
import { isAuthenticated, isAdmin, isApprover } from './middleware/auth';

const t = initTRPC.context<Context>().create();

// tRPCのエクスポート
export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

// 認証が必要なプロシージャ
export const protectedProcedure = t.procedure.use(isAuthenticated);

// 管理者権限が必要なプロシージャ
export const adminProcedure = t.procedure.use(isAuthenticated).use(isAdmin);

// 承認者権限が必要なプロシージャ
export const approverProcedure = t.procedure.use(isAuthenticated).use(isApprover);
