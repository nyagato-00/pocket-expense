import { router } from '../trpc';
import { expenseRouter } from './expense';
import { userRouter } from './user';

export const appRouter = router({
  expense: expenseRouter,
  user: userRouter,
});