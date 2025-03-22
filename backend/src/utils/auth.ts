import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';

// 環境変数からシークレットキーを取得（本番環境では.envファイルで設定）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1d'; // トークンの有効期限
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // リフレッシュトークンの有効期限

// パスワードのハッシュ化
export const hashPassword = async (password: string): Promise<{ hash: string; salt: string }> => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
};

// パスワードの検証
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// JWTトークンの生成
export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// リフレッシュトークンの生成
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

// トークンの検証
export const verifyToken = (token: string): { userId: string; role: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'トークンが無効です',
    });
  }
};

// リフレッシュトークンの検証
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'リフレッシュトークンが無効です',
    });
  }
};
