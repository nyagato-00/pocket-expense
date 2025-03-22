import { z } from 'zod';
import { publicProcedure, protectedProcedure, approverProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';

export const expenseRouter = router({
  // すべての経費申請を取得（承認者または管理者のみ）
  getAll: approverProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.expenseRequest.findMany({
      include: { user: true }
    });
  }),
  
  // 自分の経費申請を取得
  getMyExpenses: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.expenseRequest.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' }
    });
  }),
  
  // 経費申請の詳細を取得
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expenseRequest.findUnique({
        where: { id: input },
        include: { user: true }
      });
      
      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '経費申請が見つかりません'
        });
      }
      
      // 自分の経費申請か、承認者/管理者のみアクセス可能
      if (expense.userId !== ctx.user.id && !['APPROVER', 'ADMIN'].includes(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'この経費申請にアクセスする権限がありません'
        });
      }
      
      return expense;
    }),
  
  // 経費申請を作成
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        amount: z.number(),
        description: z.string().optional(),
        receiptUrl: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.expenseRequest.create({
        data: {
          title: input.title,
          amount: input.amount,
          description: input.description,
          receiptUrl: input.receiptUrl,
          userId: ctx.user.id
        }
      });
    }),
    
  // 経費申請を更新（自分の申請のみ、かつPENDINGステータスのみ）
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        amount: z.number().optional(),
        description: z.string().optional(),
        receiptUrl: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expenseRequest.findUnique({
        where: { id: input.id }
      });
      
      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '経費申請が見つかりません'
        });
      }
      
      // 自分の経費申請のみ更新可能
      if (expense.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'この経費申請を更新する権限がありません'
        });
      }
      
      // PENDINGステータスのみ更新可能
      if (expense.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '処理済みの経費申請は更新できません'
        });
      }
      
      return await ctx.prisma.expenseRequest.update({
        where: { id: input.id },
        data: {
          title: input.title,
          amount: input.amount,
          description: input.description,
          receiptUrl: input.receiptUrl
        }
      });
    }),
    
  // 経費申請を承認/却下（承認者または管理者のみ）
  updateStatus: approverProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['APPROVED', 'REJECTED'])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expenseRequest.findUnique({
        where: { id: input.id }
      });
      
      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '経費申請が見つかりません'
        });
      }
      
      // PENDINGステータスのみ更新可能
      if (expense.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '既に処理済みの経費申請です'
        });
      }
      
      return await ctx.prisma.expenseRequest.update({
        where: { id: input.id },
        data: { status: input.status }
      });
    }),
    
  // 経費申請を削除（自分の申請のみ、かつPENDINGステータスのみ）
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expenseRequest.findUnique({
        where: { id: input }
      });
      
      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '経費申請が見つかりません'
        });
      }
      
      // 自分の経費申請のみ削除可能（管理者は例外）
      if (expense.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'この経費申請を削除する権限がありません'
        });
      }
      
      // PENDINGステータスのみ削除可能（管理者は例外）
      if (expense.status !== 'PENDING' && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '処理済みの経費申請は削除できません'
        });
      }
      
      return await ctx.prisma.expenseRequest.delete({
        where: { id: input }
      });
    })
});
