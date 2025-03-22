import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const userRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany();
  }),
  
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        department: z.string().optional(),
        role: z.enum(['USER', 'APPROVER', 'ADMIN']).default('USER')
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          department: input.department,
          role: input.role
        }
      });
    })
});
