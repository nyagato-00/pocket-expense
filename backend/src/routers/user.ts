import { z } from 'zod';
import { publicProcedure, protectedProcedure, adminProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';
import { hashPassword } from '../utils/auth';

export const userRouter = router({
  // すべてのユーザーを取得（管理者のみ）
  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }),
  
  // ユーザーの詳細を取得（管理者のみ）
  getById: adminProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません'
        });
      }
      
      return user;
    }),
  
  // ユーザーを作成（管理者のみ）
  create: adminProcedure
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

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      };
    }),
    
  // ユーザーを更新（管理者のみ）
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().min(8).optional(),
        department: z.string().optional(),
        role: z.enum(['USER', 'APPROVER', 'ADMIN']).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id }
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // メールアドレスが変更される場合、既に使用されているか確認
      if (input.email && input.email !== user.email) {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email: input.email }
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'このメールアドレスは既に使用されています'
          });
        }
      }
      
      // 更新データを準備
      const updateData: any = {};
      
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.department !== undefined) updateData.department = input.department;
      if (input.role) updateData.role = input.role;
      
      // パスワードが提供された場合はハッシュ化
      if (input.password) {
        const { hash, salt } = await hashPassword(input.password);
        updateData.passwordHash = hash;
        updateData.salt = salt;
      }
      
      // ユーザーを更新
      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true
        }
      });
      
      return updatedUser;
    }),
    
  // ユーザーを削除（管理者のみ）
  delete: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input }
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // 自分自身は削除できない
      if (input === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '自分自身を削除することはできません'
        });
      }
      
      // ユーザーを削除
      await ctx.prisma.user.delete({
        where: { id: input }
      });
      
      return { success: true };
    }),
    
  // 自分のプロフィールを更新
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().min(8).optional(),
        department: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // メールアドレスが変更される場合、既に使用されているか確認
      if (input.email) {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email: input.email }
        });

        if (existingUser && existingUser.id !== ctx.user.id) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'このメールアドレスは既に使用されています'
          });
        }
      }
      
      // 更新データを準備
      const updateData: any = {};
      
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.department !== undefined) updateData.department = input.department;
      
      // パスワードが提供された場合はハッシュ化
      if (input.password) {
        const { hash, salt } = await hashPassword(input.password);
        updateData.passwordHash = hash;
        updateData.salt = salt;
      }
      
      // ユーザーを更新
      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true
        }
      });
      
      return updatedUser;
    })
});
