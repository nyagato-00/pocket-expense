import { PrismaClient, UserRole, RequestStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';
import { ExpenseCategory } from '../src/shared/types';

const prisma = new PrismaClient();

async function main() {
  console.log('シードデータの作成を開始します...');

  // 既存のデータをクリア
  await prisma.comment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.expenseRequest.deleteMany();
  await prisma.user.deleteMany();

  console.log('既存のデータをクリアしました');

  // ユーザーの作成
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      name: '管理者 太郎',
      email: 'admin@example.com',
      passwordHash: adminPassword.hash,
      salt: adminPassword.salt,
      role: UserRole.ADMIN,
      department: '経営企画部'
    }
  });
  console.log(`管理者ユーザーを作成しました: ${admin.email}`);

  const approverPassword = await hashPassword('approver123');
  const approver = await prisma.user.create({
    data: {
      name: '承認者 花子',
      email: 'approver@example.com',
      passwordHash: approverPassword.hash,
      salt: approverPassword.salt,
      role: UserRole.APPROVER,
      department: '経理部'
    }
  });
  console.log(`承認者ユーザーを作成しました: ${approver.email}`);

  const user1Password = await hashPassword('user123');
  const user1 = await prisma.user.create({
    data: {
      name: '一般 次郎',
      email: 'user1@example.com',
      passwordHash: user1Password.hash,
      salt: user1Password.salt,
      role: UserRole.USER,
      department: '営業部'
    }
  });
  console.log(`一般ユーザー1を作成しました: ${user1.email}`);

  const user2Password = await hashPassword('user123');
  const user2 = await prisma.user.create({
    data: {
      name: '一般 三郎',
      email: 'user2@example.com',
      passwordHash: user2Password.hash,
      salt: user2Password.salt,
      role: UserRole.USER,
      department: '開発部'
    }
  });
  console.log(`一般ユーザー2を作成しました: ${user2.email}`);

  // 経費申請の作成
  // ユーザー1の経費申請（承認済み）
  const expense1 = await prisma.expenseRequest.create({
    data: {
      title: '東京出張交通費',
      amount: 12500,
      description: '東京本社への出張のための新幹線代',
      category: ExpenseCategory.TRAVEL,
      status: RequestStatus.APPROVED,
      userId: user1.id
    }
  });
  console.log(`経費申請1を作成しました: ${expense1.title}`);

  // ユーザー1の経費申請（保留中）
  const expense2 = await prisma.expenseRequest.create({
    data: {
      title: 'クライアント接待費',
      amount: 35000,
      description: 'A社との商談後の接待費用',
      category: ExpenseCategory.ENTERTAINMENT,
      status: RequestStatus.PENDING,
      userId: user1.id
    }
  });
  console.log(`経費申請2を作成しました: ${expense2.title}`);

  // ユーザー1の経費申請（却下）
  const expense3 = await prisma.expenseRequest.create({
    data: {
      title: 'オフィス備品購入',
      amount: 8000,
      description: 'デスクライト購入費',
      category: ExpenseCategory.SUPPLIES,
      status: RequestStatus.REJECTED,
      userId: user1.id
    }
  });
  console.log(`経費申請3を作成しました: ${expense3.title}`);

  // ユーザー2の経費申請（保留中）
  const expense4 = await prisma.expenseRequest.create({
    data: {
      title: '大阪出張宿泊費',
      amount: 15000,
      description: '大阪支社訪問のためのホテル代',
      category: ExpenseCategory.ACCOMMODATION,
      status: RequestStatus.PENDING,
      userId: user2.id
    }
  });
  console.log(`経費申請4を作成しました: ${expense4.title}`);

  // ユーザー2の経費申請（承認済み）
  const expense5 = await prisma.expenseRequest.create({
    data: {
      title: 'チーム昼食会',
      amount: 20000,
      description: 'プロジェクト完了祝いのランチ代',
      category: ExpenseCategory.MEALS,
      status: RequestStatus.APPROVED,
      userId: user2.id
    }
  });
  console.log(`経費申請5を作成しました: ${expense5.title}`);

  // 承認記録の作成
  // 経費申請1の承認
  const approval1 = await prisma.approval.create({
    data: {
      status: RequestStatus.APPROVED,
      comment: '適切な経費と認めます',
      expenseId: expense1.id,
      approverId: approver.id
    }
  });
  console.log(`承認記録1を作成しました`);

  // 経費申請3の却下
  const approval2 = await prisma.approval.create({
    data: {
      status: RequestStatus.REJECTED,
      comment: '部門予算の制約により却下します',
      expenseId: expense3.id,
      approverId: approver.id
    }
  });
  console.log(`承認記録2を作成しました`);

  // 経費申請5の承認
  const approval3 = await prisma.approval.create({
    data: {
      status: RequestStatus.APPROVED,
      comment: 'チームの労をねぎらう目的として承認します',
      expenseId: expense5.id,
      approverId: approver.id
    }
  });
  console.log(`承認記録3を作成しました`);

  // コメントの作成
  // 経費申請1へのコメント
  const comment1 = await prisma.comment.create({
    data: {
      content: '領収書を添付しました',
      expenseId: expense1.id,
      userId: user1.id
    }
  });
  console.log(`コメント1を作成しました`);

  const comment2 = await prisma.comment.create({
    data: {
      content: '確認しました。問題ありません',
      expenseId: expense1.id,
      userId: approver.id
    }
  });
  console.log(`コメント2を作成しました`);

  // 経費申請2へのコメント
  const comment3 = await prisma.comment.create({
    data: {
      content: '接待の詳細を追記してください',
      expenseId: expense2.id,
      userId: approver.id
    }
  });
  console.log(`コメント3を作成しました`);

  // 経費申請3へのコメント
  const comment4 = await prisma.comment.create({
    data: {
      content: '部門予算を確認してください',
      expenseId: expense3.id,
      userId: approver.id
    }
  });
  console.log(`コメント4を作成しました`);

  const comment5 = await prisma.comment.create({
    data: {
      content: '予算超過の理由を説明します',
      expenseId: expense3.id,
      userId: user1.id
    }
  });
  console.log(`コメント5を作成しました`);

  console.log('シードデータの作成が完了しました');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
