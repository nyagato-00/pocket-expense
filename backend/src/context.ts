import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  return {
    prisma,
    req,
    res,
  };
};

export type Context = inferAsyncReturnType;