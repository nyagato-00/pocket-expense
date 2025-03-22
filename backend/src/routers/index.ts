import { router } from '../trpc';
import { expenseRouter } from './expense';
import { userRouter } from './user';
import { authRouter } from './auth';

export const appRouter = router({
  expense: expenseRouter,
  user: userRouter,
  auth: authRouter,
});
