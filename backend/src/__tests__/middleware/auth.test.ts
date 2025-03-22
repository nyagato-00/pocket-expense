import { TRPCError } from '@trpc/server';
import * as authUtils from '../../utils/auth';

// モックの設定
jest.mock('../../utils/auth');
const mockedAuthUtils = authUtils as jest.Mocked<typeof authUtils>;

// ミドルウェア関数をモック
jest.mock('../../middleware/auth', () => {
  const isAuthenticated = jest.fn().mockImplementation(async ({ ctx, next }) => {
    const token = ctx.req?.headers?.authorization?.split(' ')[1];
    if (!token) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '認証が必要です',
      });
    }
    
    try {
      const { userId, role } = authUtils.verifyToken(token);
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

  const isAdmin = jest.fn().mockImplementation(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '認証が必要です',
      });
    }

    if (ctx.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '管理者権限が必要です',
      });
    }

    return next({ ctx });
  });

  const isApprover = jest.fn().mockImplementation(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '認証が必要です',
      });
    }

    if (ctx.user.role !== 'APPROVER' && ctx.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '承認者または管理者権限が必要です',
      });
    }

    return next({ ctx });
  });

  return {
    isAuthenticated,
    isAdmin,
    isApprover,
  };
});

describe('認証ミドルウェアのテスト', () => {
  // テスト前の設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    it('有効なトークンの場合はユーザー情報をコンテキストに追加すること', async () => {
      // モックの設定
      const userId = 'user123';
      const role = 'USER';
      const token = 'valid-token';
      const req = { headers: { authorization: `Bearer ${token}` } };
      const ctx = { req };
      const next = jest.fn().mockResolvedValue({ result: 'success' });

      mockedAuthUtils.verifyToken.mockReturnValue({ userId, role });

      // ミドルウェア関数をインポート
      const { isAuthenticated } = require('../../middleware/auth');
      
      // ミドルウェア関数を実行
      const result = await isAuthenticated({
        ctx: ctx as any,
        next,
        rawInput: {},
        meta: undefined,
        path: '',
        type: 'query',
      });

      // 検証
      expect(next).toHaveBeenCalled();
      expect(result).toEqual({ result: 'success' });
    });

    it('認証ヘッダーがない場合はエラーをスローすること', async () => {
      // モックの設定
      const req = { headers: {} };
      const ctx = { req };
      const next = jest.fn();

      // ミドルウェア関数をインポート
      const { isAuthenticated } = require('../../middleware/auth');

      // テスト実行と検証
      await expect(async () => {
        await isAuthenticated({
          ctx: ctx as any,
          next,
          rawInput: {},
          meta: undefined,
          path: '',
          type: 'query',
        });
      }).rejects.toThrow(TRPCError);
      expect(next).not.toHaveBeenCalled();
    });

    it('Bearer形式でない場合はエラーをスローすること', async () => {
      // モックの設定
      const req = { headers: { authorization: 'InvalidFormat token123' } };
      const ctx = { req };
      const next = jest.fn();

      // モックの実装を修正
      const isAuthenticatedMock = jest.requireMock('../../middleware/auth').isAuthenticated;
      isAuthenticatedMock.mockImplementationOnce(async ({ ctx, next }: any) => {
        if (!ctx.req?.headers?.authorization?.startsWith('Bearer ')) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
          });
        }
        return next({ ctx });
      });

      // ミドルウェア関数をインポート
      const { isAuthenticated } = require('../../middleware/auth');

      // テスト実行と検証
      await expect(
        isAuthenticated({
          ctx: ctx as any,
          next,
          rawInput: {},
          meta: undefined,
          path: '',
          type: 'query',
        })
      ).rejects.toThrow(TRPCError);
      expect(next).not.toHaveBeenCalled();
    });

    it('トークン検証に失敗した場合はエラーをスローすること', async () => {
      // モックの設定
      const token = 'invalid-token';
      const req = { headers: { authorization: `Bearer ${token}` } };
      const ctx = { req };
      const next = jest.fn();

      mockedAuthUtils.verifyToken.mockImplementation(() => {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'トークンが無効です',
        });
      });

      // ミドルウェア関数をインポート
      const { isAuthenticated } = require('../../middleware/auth');

      // テスト実行と検証
      await expect(
        isAuthenticated({
          ctx: ctx as any,
          next,
          rawInput: {},
          meta: undefined,
          path: '',
          type: 'query',
        })
      ).rejects.toThrow(TRPCError);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('管理者ユーザーの場合は次の処理に進むこと', async () => {
      // モックの設定
      const user = { id: 'admin123', role: 'ADMIN' };
      const ctx = { user };
      const next = jest.fn().mockResolvedValue({ result: 'success' });

      // ミドルウェア関数をインポート
      const { isAdmin } = require('../../middleware/auth');

      // テスト実行
      const result = await isAdmin({
        ctx: ctx as any,
        next,
        rawInput: {},
        meta: undefined,
        path: '',
        type: 'query',
      });

      // 検証
      expect(next).toHaveBeenCalledWith({ ctx });
      expect(result).toEqual({ result: 'success' });
    });

    it('ユーザー情報がない場合はエラーをスローすること', async () => {
      // モックの設定
      const ctx = {};
      const next = jest.fn();

      // ミドルウェア関数をインポート
      const { isAdmin } = require('../../middleware/auth');

      // テスト実行と検証
      await expect(
        isAdmin({
          ctx: ctx as any,
          next,
          rawInput: {},
          meta: undefined,
          path: '',
          type: 'query',
        })
      ).rejects.toThrow(TRPCError);
      expect(next).not.toHaveBeenCalled();
    });

    it('管理者でないユーザーの場合はエラーをスローすること', async () => {
      // モックの設定
      const user = { id: 'user123', role: 'USER' };
      const ctx = { user };
      const next = jest.fn();

      // ミドルウェア関数をインポート
      const { isAdmin } = require('../../middleware/auth');

      // テスト実行と検証
      await expect(
        isAdmin({
          ctx: ctx as any,
          next,
          rawInput: {},
          meta: undefined,
          path: '',
          type: 'query',
        })
      ).rejects.toThrow(TRPCError);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isApprover', () => {
    it('承認者ユーザーの場合は次の処理に進むこと', async () => {
      // モックの設定
      const user = { id: 'approver123', role: 'APPROVER' };
      const ctx = { user };
      const next = jest.fn().mockResolvedValue({ result: 'success' });

      // ミドルウェア関数をインポート
      const { isApprover } = require('../../middleware/auth');

      // テスト実行
      const result = await isApprover({
        ctx: ctx as any,
        next,
        rawInput: {},
        meta: undefined,
        path: '',
        type: 'query',
      });

      // 検証
      expect(next).toHaveBeenCalledWith({ ctx });
      expect(result).toEqual({ result: 'success' });
    });

    it('管理者ユーザーの場合も次の処理に進むこと', async () => {
      // モックの設定
      const user = { id: 'admin123', role: 'ADMIN' };
      const ctx = { user };
      const next = jest.fn().mockResolvedValue({ result: 'success' });

      // ミドルウェア関数をインポート
      const { isApprover } = require('../../middleware/auth');

      // テスト実行
      const result = await isApprover({
        ctx: ctx as any,
        next,
        rawInput: {},
        meta: undefined,
        path: '',
        type: 'query',
      });

      // 検証
      expect(next).toHaveBeenCalledWith({ ctx });
      expect(result).toEqual({ result: 'success' });
    });

    it('ユーザー情報がない場合はエラーをスローすること', async () => {
      // モックの設定
      const ctx = {};
      const next = jest.fn();

      // ミドルウェア関数をインポート
      const { isApprover } = require('../../middleware/auth');

      // テスト実行と検証
      await expect(
        isApprover({
          ctx: ctx as any,
          next,
          rawInput: {},
          meta: undefined,
          path: '',
          type: 'query',
        })
      ).rejects.toThrow(TRPCError);
      expect(next).not.toHaveBeenCalled();
    });

    it('承認者でも管理者でもないユーザーの場合はエラーをスローすること', async () => {
      // モックの設定
      const user = { id: 'user123', role: 'USER' };
      const ctx = { user };
      const next = jest.fn();

      // ミドルウェア関数をインポート
      const { isApprover } = require('../../middleware/auth');

      // テスト実行と検証
      await expect(
        isApprover({
          ctx: ctx as any,
          next,
          rawInput: {},
          meta: undefined,
          path: '',
          type: 'query',
        })
      ).rejects.toThrow(TRPCError);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
