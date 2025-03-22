import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../trpc';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth';

export const authRouter = router({
  // ユーザー登録
  register: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        department: z.string().optional(),
        role: z.enum(['USER', 'APPROVER', 'ADMIN']).default('USER')
      })
    )
    .mutation(async ({ ctx, input }) => {
      // メールアドレスが既に使用されているか確認
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email }
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'このメールアドレスは既に使用されています'
        });
      }

      // パスワードをハッシュ化
      const { hash, salt } = await hashPassword(input.password);

      // ユーザーを作成
      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: hash,
          salt: salt,
          department: input.department,
          role: input.role
        }
      });

      // JWTトークンとリフレッシュトークンを生成
      const token = generateToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // リフレッシュトークンをデータベースに保存
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        },
        token,
        refreshToken
      };
    }),

  // ログイン
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ユーザーを検索
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません'
        });
      }

      // パスワードを検証
      const isValid = await verifyPassword(input.password, user.passwordHash);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'メールアドレスまたはパスワードが正しくありません'
        });
      }

      // JWTトークンとリフレッシュトークンを生成
      const token = generateToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // リフレッシュトークンをデータベースに保存
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        },
        token,
        refreshToken
      };
    }),

  // トークンのリフレッシュ
  refreshToken: publicProcedure
    .input(
      z.object({
        refreshToken: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // リフレッシュトークンを検証
        const { userId } = verifyRefreshToken(input.refreshToken);

        // ユーザーを検索
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user || user.refreshToken !== input.refreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '無効なリフレッシュトークンです'
          });
        }

        // 新しいトークンを生成
        const newToken = generateToken(user.id, user.role);
        const newRefreshToken = generateRefreshToken(user.id);

        // 新しいリフレッシュトークンをデータベースに保存
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: newRefreshToken }
        });

        return {
          token: newToken,
          refreshToken: newRefreshToken
        };
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '無効なリフレッシュトークンです'
        });
      }
    }),

  // ログアウト
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      // リフレッシュトークンをクリア
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { refreshToken: null }
      });

      return { success: true };
    }),

  // 現在のユーザー情報を取得
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません'
        });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      };
    })
});
