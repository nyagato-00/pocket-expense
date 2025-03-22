import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isApprover = user?.role === 'APPROVER' || user?.role === 'ADMIN';

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

  const handleLogout = async () => {
    try {
      await logout();
      // ログアウト後のリダイレクトはルーターで処理される
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ポケット経費申請</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                {user?.name} ({user?.role === 'ADMIN' ? '管理者' : user?.role === 'APPROVER' ? '承認者' : 'ユーザー'})
              </span>
              <a
                href="/profile"
                className="inline-flex items-center px-3 py-2 mr-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                プロフィール
              </a>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg p-4 h-96">
                <div className="text-center">
                  <p className="mt-2 text-lg text-gray-600">
                    ようこそ、{user?.name}さん！
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    ここにダッシュボードの内容が表示されます。
                  </p>
                </div>
                
              {/* 新規経費申請ボタン */}
              <div className="mt-8">
                <button
                  onClick={handleCreateExpense}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  新規経費申請
                </button>
              </div>

              {/* 自分の経費申請一覧 */}
              <div className="mt-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">最近の経費申請</h2>
                  <button
                    onClick={handleViewAllExpenses}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    すべて表示
                  </button>
                </div>
                <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                  {myExpensesQuery.isLoading ? (
                    <p className="px-6 py-4 text-center text-gray-500 text-sm">読み込み中...</p>
                  ) : myExpensesQuery.isError ? (
                    <p className="px-6 py-4 text-center text-red-500 text-sm">エラーが発生しました</p>
                  ) : myExpensesQuery.data?.expenses.length === 0 ? (
                    <p className="px-6 py-4 text-center text-gray-500 text-sm">
                      経費申請はまだありません
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {myExpensesQuery.data?.expenses.map((expense: any) => (
                        <li key={expense.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewExpense(expense.id)}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(expense.createdAt)} - {formatAmount(expense.amount)}
                              </p>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                expense.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
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
              </div>

              {/* 承認者向け：承認待ち経費申請一覧 */}
              {isApprover && (
                <div className="mt-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">承認待ちの経費申請</h2>
                    <button
                      onClick={handleViewAllExpenses}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      すべて表示
                    </button>
                  </div>
                  <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                    {pendingExpensesQuery?.isLoading ? (
                      <p className="px-6 py-4 text-center text-gray-500 text-sm">読み込み中...</p>
                    ) : pendingExpensesQuery?.isError ? (
                      <p className="px-6 py-4 text-center text-red-500 text-sm">エラーが発生しました</p>
                    ) : pendingExpensesQuery?.data?.expenses.length === 0 ? (
                      <p className="px-6 py-4 text-center text-gray-500 text-sm">
                        承認待ちの経費申請はありません
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {pendingExpensesQuery?.data?.expenses.map((expense: any) => (
                          <li key={expense.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewExpense(expense.id)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(expense.createdAt)} - {expense.user.name} - {formatAmount(expense.amount)}
                                </p>
                              </div>
                              <div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  審査中
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
