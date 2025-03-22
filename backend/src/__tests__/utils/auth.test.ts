import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
} from '../../utils/auth';

// モックの設定
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('認証ユーティリティのテスト', () => {
  // テスト前の設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('パスワードをハッシュ化してソルトと一緒に返すこと', async () => {
      const password = 'testPassword123';
      const result = await hashPassword(password);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('同じパスワードでも異なるハッシュを生成すること', async () => {
      const password = 'testPassword123';
      const result1 = await hashPassword(password);
      const result2 = await hashPassword(password);

      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).not.toBe(result2.salt);
    });
  });

  describe('verifyPassword', () => {
    it('正しいパスワードの場合はtrueを返すこと', async () => {
      const password = 'testPassword123';
      const { hash } = await hashPassword(password);
      
      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('誤ったパスワードの場合はfalseを返すこと', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const { hash } = await hashPassword(password);
      
      const result = await verifyPassword(wrongPassword, hash);
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('ユーザーIDとロールを含むJWTトークンを生成すること', () => {
      const userId = 'user123';
      const role = 'USER';
      
      mockedJwt.sign.mockReturnValueOnce('mocked-jwt-token' as any);
      
      const token = generateToken(userId, role);
      
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId, role },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(token).toBe('mocked-jwt-token');
    });
  });

  describe('generateRefreshToken', () => {
    it('ユーザーIDを含むリフレッシュトークンを生成すること', () => {
      const userId = 'user123';
      
      mockedJwt.sign.mockReturnValueOnce('mocked-refresh-token' as any);
      
      const token = generateRefreshToken(userId);
      
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(token).toBe('mocked-refresh-token');
    });
  });

  describe('verifyToken', () => {
    it('有効なトークンの場合はデコードされたペイロードを返すこと', () => {
      const token = 'valid-token';
      const payload = { userId: 'user123', role: 'USER' };
      
      mockedJwt.verify.mockReturnValueOnce(payload as any);
      
      const result = verifyToken(token);
      
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(result).toEqual(payload);
    });

    it('無効なトークンの場合はエラーをスローすること', () => {
      const token = 'invalid-token';
      
      mockedJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      expect(() => verifyToken(token)).toThrow(TRPCError);
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });
  });

  describe('verifyRefreshToken', () => {
    it('有効なリフレッシュトークンの場合はデコードされたペイロードを返すこと', () => {
      const token = 'valid-refresh-token';
      const payload = { userId: 'user123' };
      
      mockedJwt.verify.mockReturnValueOnce(payload as any);
      
      const result = verifyRefreshToken(token);
      
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(result).toEqual(payload);
    });

    it('無効なリフレッシュトークンの場合はエラーをスローすること', () => {
      const token = 'invalid-refresh-token';
      
      mockedJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid refresh token');
      });
      
      expect(() => verifyRefreshToken(token)).toThrow(TRPCError);
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });
  });
});
