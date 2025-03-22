import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const expenseRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.expenseRequest.findMany({
      include: { user: true }
    });
  }),
  
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        amount: z.number(),
        description: z.string().optional(),
        userId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.expenseRequest.create({
        data: {
          title: input.title,
          amount: input.amount,
          description: input.description,
          userId: input.userId
        }
      });
    })
});
