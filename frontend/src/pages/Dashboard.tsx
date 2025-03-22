import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import Button from '../components/Button';
import Card from '../components/Card';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isApprover = user?.role === 'APPROVER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  // 最近の経費申請を取得（最大5件）
  const myExpensesQuery = trpc.expense.getMyExpenses.useQuery({
    limit: 5,
    offset: 0
  });

  // 承認者の場合、承認待ちの経費申請も取得
  const pendingExpensesQuery = isApprover
    ? trpc.expense.getAll.useQuery({
        status: 'PENDING',
        limit: 5,
        offset: 0
      })
    : null;


  // 経費一覧ページへ移動
  const handleViewAllExpenses = () => {
    navigate('/expenses');
  };

  // 新規経費申請ページへ移動
  const handleCreateExpense = () => {
    navigate('/expenses/new');
  };

  // 経費詳細ページへ移動
  const handleViewExpense = (id: string) => {
    navigate(`/expenses/${id}`);
  };

  // 金額のフォーマット
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  return (
    <Layout title="ダッシュボード">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  title="ダッシュボード"
                  shadow="lg"
                  rounded="lg"
                  padding="lg"
                  className="col-span-1 md:col-span-2"
                >
                  <div className="text-center py-4">
                    <p className="text-xl text-secondary-700 font-medium mb-2">
                      ようこそ、{user?.name}さん！
                    </p>
                    <p className="text-secondary-500 mb-6">
                      経費申請の管理を簡単に行うことができます。
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <Button
                        label="新規経費申請"
                        variant="primary"
                        size="lg"
                        onClick={handleCreateExpense}
                      />
                      <Button
                        label="すべての経費を表示"
                        variant="secondary"
                        size="lg"
                        onClick={handleViewAllExpenses}
                      />
                      {isAdmin && (
                        <Button
                          label="ユーザー管理"
                          variant="accent"
                          size="lg"
                          onClick={() => navigate('/admin/users')}
                        />
                      )}
                    </div>
                  </div>
                </Card>

                {/* 自分の経費申請一覧 */}
                <Card
                  title="最近の経費申請"
                  shadow="md"
                  rounded="lg"
                  padding="none"
                  actions={
                    <Button
                      label="すべて表示"
                      variant="accent"
                      size="sm"
                      onClick={handleViewAllExpenses}
                    />
                  }
                >
                  <div className="overflow-hidden">
                    {myExpensesQuery.isLoading ? (
                      <p className="px-6 py-8 text-center text-secondary-500">読み込み中...</p>
                    ) : myExpensesQuery.isError ? (
                      <p className="px-6 py-8 text-center text-danger-600">エラーが発生しました</p>
                    ) : myExpensesQuery.data?.expenses.length === 0 ? (
                      <p className="px-6 py-8 text-center text-secondary-500">
                        経費申請はまだありません
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {myExpensesQuery.data?.expenses.map((expense: any) => (
                          <li key={expense.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150" onClick={() => handleViewExpense(expense.id)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-secondary-900 font-medium">{expense.title}</p>
                                <p className="text-sm text-secondary-500">
                                  {formatDate(expense.createdAt)} - {formatAmount(expense.amount)}
                                </p>
                              </div>
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  expense.status === 'PENDING' ? 'bg-warning-100 text-warning-800' :
                                  expense.status === 'APPROVED' ? 'bg-success-100 text-success-800' :
                                  'bg-danger-100 text-danger-800'
                                }`}>
                                  {expense.status === 'PENDING' ? '審査中' :
                                  expense.status === 'APPROVED' ? '承認済' : '却下'}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>

                {/* 承認者向け：承認待ち経費申請一覧 */}
                {isApprover && (
                  <Card
                    title="承認待ちの経費申請"
                    shadow="md"
                    rounded="lg"
                    padding="none"
                    actions={
                      <Button
                        label="すべて表示"
                        variant="accent"
                        size="sm"
                        onClick={handleViewAllExpenses}
                      />
                    }
                  >
                    <div className="overflow-hidden">
                      {pendingExpensesQuery?.isLoading ? (
                        <p className="px-6 py-8 text-center text-secondary-500">読み込み中...</p>
                      ) : pendingExpensesQuery?.isError ? (
                        <p className="px-6 py-8 text-center text-danger-600">エラーが発生しました</p>
                      ) : pendingExpensesQuery?.data?.expenses.length === 0 ? (
                        <p className="px-6 py-8 text-center text-secondary-500">
                          承認待ちの経費申請はありません
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {pendingExpensesQuery?.data?.expenses.map((expense: any) => (
                            <li key={expense.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150" onClick={() => handleViewExpense(expense.id)}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-secondary-900 font-medium">{expense.title}</p>
                                  <p className="text-sm text-secondary-500">
                                    {formatDate(expense.createdAt)} - {expense.user.name} - {formatAmount(expense.amount)}
                                  </p>
                                </div>
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                                    審査中
                                  </span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Card>
                )}
      </div>
    </Layout>
  );
};

export default Dashboard;
