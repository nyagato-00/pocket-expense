import { inferProcedureInput } from '@trpc/server';
import { createContext } from '../../context';
import { appRouter } from '../../routers';
import { ExpenseCategory, RequestStatus } from '../../shared/types';

// モックデータ
const mockUser = {
  id: 'user-1',
  name: 'テストユーザー',
  email: 'test@example.com',
  role: 'USER',
  department: '開発部'
};

const mockApprover = {
  id: 'approver-1',
  name: '承認者',
  email: 'approver@example.com',
  role: 'APPROVER',
  department: '管理部'
};

const mockExpense = {
  id: 'expense-1',
  title: 'テスト経費',
  amount: 5000,
  description: 'テスト用の経費申請',
  category: ExpenseCategory.TRAVEL,
  status: RequestStatus.PENDING,
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Prismaのモック
const mockPrisma = {
  expenseRequest: {
    findMany: jest.fn().mockResolvedValue([mockExpense]),
    findUnique: jest.fn().mockResolvedValue(mockExpense),
    create: jest.fn().mockResolvedValue(mockExpense),
    update: jest.fn().mockResolvedValue(mockExpense),
    delete: jest.fn().mockResolvedValue(mockExpense),
    count: jest.fn().mockResolvedValue(1)
  },
  approval: {
    create: jest.fn().mockResolvedValue({
      id: 'approval-1',
      status: RequestStatus.APPROVED,
      comment: 'テスト承認',
      expenseId: 'expense-1',
      approverId: 'approver-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 })
  },
  comment: {
    create: jest.fn().mockResolvedValue({
      id: 'comment-1',
      content: 'テストコメント',
      expenseId: 'expense-1',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    findUnique: jest.fn().mockResolvedValue({
      id: 'comment-1',
      content: 'テストコメント',
      expenseId: 'expense-1',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      expense: mockExpense
    }),
    delete: jest.fn().mockResolvedValue({
      id: 'comment-1',
      content: 'テストコメント',
      expenseId: 'expense-1',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 })
  },
  $transaction: jest.fn().mockImplementation(callback => callback(mockPrisma))
};

// テスト用のコンテキスト作成関数
const createTestContext = (user?: { id: string; role: string }) => {
  return {
    prisma: mockPrisma as any,
    req: {
      headers: {
        authorization: user ? `Bearer token` : undefined
      }
    } as any,
    res: {} as any,
    user
  };
};

describe('経費ルーター', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyExpenses', () => {
    it('自分の経費申請を取得できること', async () => {
      // 準備
      const caller = appRouter.createCaller(createTestContext({ id: 'user-1', role: 'USER' }));
      
      // 実行
      const result = await caller.expense.getMyExpenses();
      
      // 検証
      expect(mockPrisma.expenseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1'
          })
        })
      );
      expect(result.expenses).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getById', () => {
    it('経費申請の詳細を取得できること', async () => {
      // 準備
      const caller = appRouter.createCaller(createTestContext({ id: 'user-1', role: 'USER' }));
      
      // 実行
      const result = await caller.expense.getById('expense-1');
      
      // 検証
      expect(mockPrisma.expenseRequest.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'expense-1' }
        })
      );
      expect(result).toEqual(mockExpense);
    });
  });

  describe('create', () => {
    it('経費申請を作成できること', async () => {
      // 準備
      const caller = appRouter.createCaller(createTestContext({ id: 'user-1', role: 'USER' }));
      type Input = inferProcedureInput<typeof appRouter.expense.create>;
      const input: Input = {
        title: 'テスト経費',
        amount: 5000,
        description: 'テスト用の経費申請',
        category: ExpenseCategory.TRAVEL
      };
      
      // 実行
      const result = await caller.expense.create(input);
      
      // 検証
      expect(mockPrisma.expenseRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'テスト経費',
            amount: 5000,
            description: 'テスト用の経費申請',
            category: ExpenseCategory.TRAVEL,
            userId: 'user-1'
          })
        })
      );
      expect(result).toEqual(mockExpense);
    });
  });

  describe('update', () => {
    it('自分の経費申請を更新できること', async () => {
      // 準備
      const caller = appRouter.createCaller(createTestContext({ id: 'user-1', role: 'USER' }));
      type Input = inferProcedureInput<typeof appRouter.expense.update>;
      const input: Input = {
        id: 'expense-1',
        title: '更新後のテスト経費',
        amount: 10000
      };
      
      // 実行
      const result = await caller.expense.update(input);
      
      // 検証
      expect(mockPrisma.expenseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'expense-1' },
          data: expect.objectContaining({
            title: '更新後のテスト経費',
            amount: 10000
          })
        })
      );
      expect(result).toEqual(mockExpense);
    });
  });

  describe('updateStatus', () => {
    it('承認者が経費申請を承認できること', async () => {
      // 準備
      mockPrisma.expenseRequest.findUnique.mockResolvedValueOnce({
        ...mockExpense,
        approvals: []
      });
      
      const caller = appRouter.createCaller(createTestContext({ id: 'approver-1', role: 'APPROVER' }));
      type Input = inferProcedureInput<typeof appRouter.expense.updateStatus>;
      const input: Input = {
        id: 'expense-1',
        status: RequestStatus.APPROVED,
        comment: 'テスト承認'
      };
      
      // 実行
      const result = await caller.expense.updateStatus(input);
      
      // 検証
      expect(mockPrisma.approval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RequestStatus.APPROVED,
            comment: 'テスト承認',
            expenseId: 'expense-1',
            approverId: 'approver-1'
          })
        })
      );
      expect(mockPrisma.expenseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'expense-1' },
          data: { status: RequestStatus.APPROVED }
        })
      );
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'テスト承認',
            expenseId: 'expense-1',
            userId: 'approver-1'
          })
        })
      );
      expect(result).toHaveProperty('expense');
      expect(result).toHaveProperty('approval');
    });
  });

  describe('delete', () => {
    it('自分の経費申請を削除できること', async () => {
      // 準備
      const caller = appRouter.createCaller(createTestContext({ id: 'user-1', role: 'USER' }));
      
      // 実行
      const result = await caller.expense.delete('expense-1');
      
      // 検証
      expect(mockPrisma.comment.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { expenseId: 'expense-1' }
        })
      );
      expect(mockPrisma.approval.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { expenseId: 'expense-1' }
        })
      );
      expect(mockPrisma.expenseRequest.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'expense-1' }
        })
      );
      expect(result).toEqual(mockExpense);
    });
  });

  describe('addComment', () => {
    it('経費申請にコメントを追加できること', async () => {
      // 準備
      const caller = appRouter.createCaller(createTestContext({ id: 'user-1', role: 'USER' }));
      type Input = inferProcedureInput<typeof appRouter.expense.addComment>;
      const input: Input = {
        expenseId: 'expense-1',
        content: 'テストコメント'
      };
      
      // 実行
      const result = await caller.expense.addComment(input);
      
      // 検証
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'テストコメント',
            expenseId: 'expense-1',
            userId: 'user-1'
          })
        })
      );
      expect(result).toHaveProperty('id', 'comment-1');
      expect(result).toHaveProperty('content', 'テストコメント');
    });
  });

  describe('deleteComment', () => {
    it('自分のコメントを削除できること', async () => {
      // 準備
      const caller = appRouter.createCaller(createTestContext({ id: 'user-1', role: 'USER' }));
      
      // 実行
      const result = await caller.expense.deleteComment('comment-1');
      
      // 検証
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comment-1' }
        })
      );
      expect(result).toHaveProperty('id', 'comment-1');
    });
  });

  describe('getCategories', () => {
    it('経費カテゴリの一覧を取得できること', async () => {
      // 準備
      const caller = appRouter.createCaller(createTestContext());
      
      // 実行
      const result = await caller.expense.getCategories();
      
      // 検証
      expect(result).toEqual(Object.values(ExpenseCategory));
    });
  });
});
