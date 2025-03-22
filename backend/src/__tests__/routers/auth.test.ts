import { TRPCError } from '@trpc/server';
import { authRouter } from '../../routers/auth';
import * as authUtils from '../../utils/auth';
import { Request, Response } from 'express';

// モックの設定
jest.mock('../../utils/auth');
const mockedAuthUtils = authUtils as jest.Mocked<typeof authUtils>;

// ミドルウェアをモック
jest.mock('../../middleware/auth', () => ({
  isAuthenticated: jest.fn((resolver) => resolver),
  isAdmin: jest.fn((resolver) => resolver),
  isApprover: jest.fn((resolver) => resolver),
}));

// Expressのリクエストとレスポンスをモック
const mockRequest = {
  headers: {
    authorization: 'Bearer test-token'
  }
} as unknown as Request;

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  setHeader: jest.fn(),
} as unknown as Response;

describe('認証ルーターのテスト', () => {
  // モックのPrismaクライアント
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  // モックのコンテキスト
  const mockCtx = {
    prisma: mockPrisma,
    req: mockRequest,
    res: mockResponse,
    user: undefined,
  };

  // テスト前の設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('新規ユーザーを登録できること', async () => {
      // モックの設定
      const input = {
        name: 'テストユーザー',
        email: 'test@example.com',
        password: 'password123',
        department: '開発部',
        role: 'USER' as const,
      };

      const hashedPassword = {
        hash: 'hashed_password',
        salt: 'salt',
      };

      const createdUser = {
        id: 'user123',
        name: input.name,
        email: input.email,
        passwordHash: hashedPassword.hash,
        salt: hashedPassword.salt,
        department: input.department,
        role: input.role,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = 'jwt_token';
      const refreshToken = 'refresh_token';

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockPrisma.user.update.mockResolvedValue({
        ...createdUser,
        refreshToken,
      });

      mockedAuthUtils.hashPassword.mockResolvedValue(hashedPassword);
      mockedAuthUtils.generateToken.mockReturnValue(token);
      mockedAuthUtils.generateRefreshToken.mockReturnValue(refreshToken);

      // テスト実行
      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.register(input);

      // 検証
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(mockedAuthUtils.hashPassword).toHaveBeenCalledWith(input.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: hashedPassword.hash,
          salt: hashedPassword.salt,
          department: input.department,
          role: input.role,
        },
      });
      expect(mockedAuthUtils.generateToken).toHaveBeenCalledWith(createdUser.id, createdUser.role);
      expect(mockedAuthUtils.generateRefreshToken).toHaveBeenCalledWith(createdUser.id);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: createdUser.id },
        data: { refreshToken },
      });

      expect(result).toEqual({
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          department: createdUser.department,
        },
        token,
        refreshToken,
      });
    });

    it('既存のメールアドレスの場合はエラーをスローすること', async () => {
      // モックの設定
      const input = {
        name: 'テストユーザー',
        email: 'existing@example.com',
        password: 'password123',
        department: '開発部',
        role: 'USER' as const,
      };

      const existingUser = {
        id: 'existing123',
        name: 'Existing User',
        email: input.email,
        passwordHash: 'hash',
        salt: 'salt',
        role: 'USER',
        department: '営業部',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      // テスト実行と検証
      const caller = authRouter.createCaller(mockCtx);
      await expect(caller.register(input)).rejects.toThrow(TRPCError);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('正しい認証情報でログインできること', async () => {
      // モックの設定
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'user123',
        name: 'テストユーザー',
        email: input.email,
        passwordHash: 'hashed_password',
        salt: 'salt',
        role: 'USER',
        department: '開発部',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = 'jwt_token';
      const refreshToken = 'refresh_token';

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({
        ...user,
        refreshToken,
      });

      mockedAuthUtils.verifyPassword.mockResolvedValue(true);
      mockedAuthUtils.generateToken.mockReturnValue(token);
      mockedAuthUtils.generateRefreshToken.mockReturnValue(refreshToken);

      // テスト実行
      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.login(input);

      // 検証
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(mockedAuthUtils.verifyPassword).toHaveBeenCalledWith(input.password, user.passwordHash);
      expect(mockedAuthUtils.generateToken).toHaveBeenCalledWith(user.id, user.role);
      expect(mockedAuthUtils.generateRefreshToken).toHaveBeenCalledWith(user.id);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { refreshToken },
      });

      expect(result).toEqual({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
        token,
        refreshToken,
      });
    });

    it('存在しないユーザーの場合はエラーをスローすること', async () => {
      // モックの設定
      const input = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // テスト実行と検証
      const caller = authRouter.createCaller(mockCtx);
      await expect(caller.login(input)).rejects.toThrow(TRPCError);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(mockedAuthUtils.verifyPassword).not.toHaveBeenCalled();
    });

    it('パスワードが間違っている場合はエラーをスローすること', async () => {
      // モックの設定
      const input = {
        email: 'test@example.com',
        password: 'wrong_password',
      };

      const user = {
        id: 'user123',
        name: 'テストユーザー',
        email: input.email,
        passwordHash: 'hashed_password',
        salt: 'salt',
        role: 'USER',
        department: '開発部',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockedAuthUtils.verifyPassword.mockResolvedValue(false);

      // テスト実行と検証
      const caller = authRouter.createCaller(mockCtx);
      await expect(caller.login(input)).rejects.toThrow(TRPCError);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(mockedAuthUtils.verifyPassword).toHaveBeenCalledWith(input.password, user.passwordHash);
      expect(mockedAuthUtils.generateToken).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('有効なリフレッシュトークンで新しいトークンを取得できること', async () => {
      // モックの設定
      const input = {
        refreshToken: 'valid_refresh_token',
      };

      const userId = 'user123';
      const user = {
        id: userId,
        name: 'テストユーザー',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        salt: 'salt',
        role: 'USER',
        department: '開発部',
        refreshToken: input.refreshToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newToken = 'new_jwt_token';
      const newRefreshToken = 'new_refresh_token';

      mockedAuthUtils.verifyRefreshToken.mockReturnValue({ userId });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({
        ...user,
        refreshToken: newRefreshToken,
      });

      mockedAuthUtils.generateToken.mockReturnValue(newToken);
      mockedAuthUtils.generateRefreshToken.mockReturnValue(newRefreshToken);

      // テスト実行
      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.refreshToken(input);

      // 検証
      expect(mockedAuthUtils.verifyRefreshToken).toHaveBeenCalledWith(input.refreshToken);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockedAuthUtils.generateToken).toHaveBeenCalledWith(user.id, user.role);
      expect(mockedAuthUtils.generateRefreshToken).toHaveBeenCalledWith(user.id);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      expect(result).toEqual({
        token: newToken,
        refreshToken: newRefreshToken,
      });
    });

    it('無効なリフレッシュトークンの場合はエラーをスローすること', async () => {
      // モックの設定
      const input = {
        refreshToken: 'invalid_refresh_token',
      };

      mockedAuthUtils.verifyRefreshToken.mockImplementation(() => {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '無効なリフレッシュトークンです',
        });
      });

      // テスト実行と検証
      const caller = authRouter.createCaller(mockCtx);
      await expect(caller.refreshToken(input)).rejects.toThrow(TRPCError);
      expect(mockedAuthUtils.verifyRefreshToken).toHaveBeenCalledWith(input.refreshToken);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('データベースに保存されているリフレッシュトークンと一致しない場合はエラーをスローすること', async () => {
      // モックの設定
      const input = {
        refreshToken: 'mismatched_refresh_token',
      };

      const userId = 'user123';
      const user = {
        id: userId,
        name: 'テストユーザー',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        salt: 'salt',
        role: 'USER',
        department: '開発部',
        refreshToken: 'different_refresh_token', // 入力と異なるトークン
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedAuthUtils.verifyRefreshToken.mockReturnValue({ userId });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      // テスト実行と検証
      const caller = authRouter.createCaller(mockCtx);
      await expect(caller.refreshToken(input)).rejects.toThrow(TRPCError);
      expect(mockedAuthUtils.verifyRefreshToken).toHaveBeenCalledWith(input.refreshToken);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockedAuthUtils.generateToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('ログアウトするとリフレッシュトークンがクリアされること', async () => {
      // モックの設定
      const userId = 'user123';
      const userCtx = {
        ...mockCtx,
        user: {
          id: userId,
          role: 'USER',
        },
      };

      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        name: 'テストユーザー',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        salt: 'salt',
        role: 'USER',
        department: '開発部',
        refreshToken: null, // クリアされたトークン
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // テスト実行
      const caller = authRouter.createCaller(userCtx);
      const result = await caller.logout();

      // 検証
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: null },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('me', () => {
    it('認証済みユーザーの情報を取得できること', async () => {
      // モックの設定
      const userId = 'user123';
      const user = {
        id: userId,
        name: 'テストユーザー',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        salt: 'salt',
        role: 'USER',
        department: '開発部',
        refreshToken: 'refresh_token',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userCtx = {
        ...mockCtx,
        user: {
          id: userId,
          role: 'USER',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      // テスト実行
      const caller = authRouter.createCaller(userCtx);
      const result = await caller.me();

      // 検証
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      });
    });

    it('ユーザーが見つからない場合はエラーをスローすること', async () => {
      // モックの設定
      const userId = 'nonexistent_user';
      const userCtx = {
        ...mockCtx,
        user: {
          id: userId,
          role: 'USER',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // テスト実行と検証
      const caller = authRouter.createCaller(userCtx);
      await expect(caller.me()).rejects.toThrow(TRPCError);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
