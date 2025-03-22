import { z } from 'zod';
import { publicProcedure, protectedProcedure, approverProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';
import { PrismaClient } from '@prisma/client';
import { ExpenseCategory } from '../shared/types';

// カテゴリの列挙型をZodスキーマに変換
const categoryEnum = z.enum([
  ExpenseCategory.TRAVEL,
  ExpenseCategory.ACCOMMODATION,
  ExpenseCategory.MEALS,
  ExpenseCategory.SUPPLIES,
  ExpenseCategory.ENTERTAINMENT,
  ExpenseCategory.OTHER
]);

export const expenseRouter = router({
  // すべての経費申請を取得（承認者または管理者のみ）
  getAll: approverProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).default('ALL'),
        category: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        userId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0)
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      
      // フィルタリング条件を設定
      if (input) {
        if (input.status !== 'ALL') {
          where.status = input.status;
        }
        
        if (input.category) {
          where.category = input.category;
        }
        
        if (input.userId) {
          where.userId = input.userId;
        }
        
        if (input.fromDate || input.toDate) {
          where.createdAt = {};
          
          if (input.fromDate) {
            where.createdAt.gte = new Date(input.fromDate);
          }
          
          if (input.toDate) {
            where.createdAt.lte = new Date(input.toDate);
          }
        }
      }
      
      // 経費申請を取得
      const expenses = await ctx.prisma.expenseRequest.findMany({
        where,
        include: { 
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: input?.limit || 50,
        skip: input?.offset || 0
      });
      
      // 総件数を取得
      const total = await ctx.prisma.expenseRequest.count({ where });
      
      return {
        expenses,
        total,
        limit: input?.limit || 50,
        offset: input?.offset || 0
      };
    }),
  
  // 自分の経費申請を取得
  getMyExpenses: protectedProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).default('ALL'),
        category: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0)
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.user.id
      };
      
      // フィルタリング条件を設定
      if (input) {
        if (input.status !== 'ALL') {
          where.status = input.status;
        }
        
        if (input.category) {
          where.category = input.category;
        }
        
        if (input.fromDate || input.toDate) {
          where.createdAt = {};
          
          if (input.fromDate) {
            where.createdAt.gte = new Date(input.fromDate);
          }
          
          if (input.toDate) {
            where.createdAt.lte = new Date(input.toDate);
          }
        }
      }
      
      // 経費申請を取得
      const expenses = await ctx.prisma.expenseRequest.findMany({
        where,
        include: { 
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: input?.limit || 50,
        skip: input?.offset || 0
      });
      
      // 総件数を取得
      const total = await ctx.prisma.expenseRequest.count({ where });
      
      return {
        expenses,
        total,
        limit: input?.limit || 50,
        offset: input?.offset || 0
      };
    }),
  
  // 経費申請の詳細を取得
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expenseRequest.findUnique({
        where: { id: input },
        include: { 
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
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
        title: z.string().min(1, '件名は必須です'),
        amount: z.number().min(1, '金額は1以上である必要があります'),
        description: z.string().optional(),
        category: categoryEnum.optional(),
        receiptUrl: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 経費申請を作成
      const expense = await ctx.prisma.expenseRequest.create({
        data: {
          title: input.title,
          amount: input.amount,
          description: input.description,
          category: input.category,
          receiptUrl: input.receiptUrl,
          userId: ctx.user.id
        }
      });
      
      return expense;
    }),
    
  // 経費申請を更新（自分の申請のみ、かつPENDINGステータスのみ）
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, '件名は必須です').optional(),
        amount: z.number().min(1, '金額は1以上である必要があります').optional(),
        description: z.string().optional(),
        category: categoryEnum.optional(),
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
      
      // 更新データを準備
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.amount !== undefined) updateData.amount = input.amount;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.receiptUrl !== undefined) updateData.receiptUrl = input.receiptUrl;
      
      // 経費申請を更新
      return await ctx.prisma.expenseRequest.update({
        where: { id: input.id },
        data: updateData
      });
    }),
    
  // 経費申請を承認/却下（承認者または管理者のみ）
  updateStatus: approverProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['APPROVED', 'REJECTED']),
        comment: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expenseRequest.findUnique({
        where: { id: input.id },
        include: { approvals: true }
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
      
      // 自分自身の申請は承認できない
      if (expense.userId === ctx.user?.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '自分自身の経費申請は承認/却下できません'
        });
      }
      
      // 既に承認/却下済みかチェック
      const existingApproval = expense.approvals.find((a: { approverId: string }) => a.approverId === ctx.user?.id);
      if (existingApproval) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'この経費申請は既に承認/却下済みです'
        });
      }
      
      // トランザクションを開始
      return await ctx.prisma.$transaction(async (prisma: PrismaClient) => {
        // 承認/却下を記録
        const approval = await prisma.approval.create({
          data: {
            status: input.status,
            comment: input.comment,
            expenseId: input.id,
            approverId: ctx.user?.id as string
          }
        });
        
        // 経費申請のステータスを更新
        const updatedExpense = await prisma.expenseRequest.update({
          where: { id: input.id },
          data: { status: input.status }
        });
        
        // コメントが提供された場合は追加
        if (input.comment) {
          await prisma.comment.create({
            data: {
              content: input.comment,
              expenseId: input.id,
              userId: ctx.user?.id as string
            }
          });
        }
        
        return {
          expense: updatedExpense,
          approval
        };
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
      
      // トランザクションを開始
      return await ctx.prisma.$transaction(async (prisma: PrismaClient) => {
        // 関連するコメントを削除
        await prisma.comment.deleteMany({
          where: { expenseId: input }
        });
        
        // 関連する承認を削除
        await prisma.approval.deleteMany({
          where: { expenseId: input }
        });
        
        // 経費申請を削除
        return await prisma.expenseRequest.delete({
          where: { id: input }
        });
      });
    }),
    
  // コメントを追加
  addComment: protectedProcedure
    .input(
      z.object({
        expenseId: z.string(),
        content: z.string().min(1, 'コメントは必須です')
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expenseRequest.findUnique({
        where: { id: input.expenseId }
      });
      
      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '経費申請が見つかりません'
        });
      }
      
      // 自分の経費申請か、承認者/管理者のみコメント可能
      if (expense.userId !== ctx.user.id && !['APPROVER', 'ADMIN'].includes(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'この経費申請にコメントする権限がありません'
        });
      }
      
      // コメントを作成
      const comment = await ctx.prisma.comment.create({
        data: {
          content: input.content,
          expenseId: input.expenseId,
          userId: ctx.user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });
      
      return comment;
    }),
    
  // コメントを削除
  deleteComment: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input },
        include: { expense: true }
      });
      
      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'コメントが見つかりません'
        });
      }
      
      // 自分のコメントのみ削除可能（管理者は例外）
      if (comment.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'このコメントを削除する権限がありません'
        });
      }
      
      // コメントを削除
      return await ctx.prisma.comment.delete({
        where: { id: input }
      });
    }),
    
  // 経費カテゴリの一覧を取得
  getCategories: publicProcedure.query(() => {
    return Object.values(ExpenseCategory);
  })
});
