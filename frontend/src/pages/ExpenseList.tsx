import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { useAuth } from '../contexts/AuthContext';
import { RequestStatus } from '../../../shared/types';

const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isApprover = user?.role === 'APPROVER' || user?.role === 'ADMIN';

  // フィルター状態
  const [filters, setFilters] = useState({
    status: 'ALL' as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL',
    category: '',
    fromDate: '',
    toDate: '',
    userId: '',
  });

  // ページネーション状態
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
  });

  // 経費データ取得
  const expensesQuery = isApprover
    ? trpc.expense.getAll.useQuery({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      })
    : trpc.expense.getMyExpenses.useQuery({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      });

  // 経費カテゴリ取得
  const categoriesQuery = trpc.expense.getCategories.useQuery();

  // フィルター変更ハンドラ
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // フィルター変更時はページをリセット
  };

  // 新規作成ハンドラ
  const handleCreate = () => {
    navigate('/expenses/new');
  };

  // 詳細表示ハンドラ
  const handleView = (id: string) => {
    navigate(`/expenses/${id}`);
  };

  // 編集ハンドラ
  const handleEdit = (id: string) => {
    navigate(`/expenses/${id}/edit`);
  };

  // ステータスに応じたバッジを表示
  const renderStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            審査中
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            承認済
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            却下
          </span>
        );
      default:
        return null;
    }
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // ページネーションハンドラ
  const handlePrevPage = () => {
    if (pagination.offset - pagination.limit >= 0) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset - prev.limit,
      }));
    }
  };

  const handleNextPage = () => {
    if (expensesQuery.data && pagination.offset + pagination.limit < expensesQuery.data.total) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
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
                href="/dashboard"
                className="inline-flex items-center px-3 py-2 mr-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ダッシュボード
              </a>
              <a
                href="/profile"
                className="inline-flex items-center px-3 py-2 mr-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                プロフィール
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">経費申請一覧</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {/* フィルター */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      ステータス
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="ALL">すべて</option>
                      <option value="PENDING">審査中</option>
                      <option value="APPROVED">承認済</option>
                      <option value="REJECTED">却下</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      カテゴリ
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">すべて</option>
                      {categoriesQuery.data?.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">
                      開始日
                    </label>
                    <input
                      type="date"
                      id="fromDate"
                      name="fromDate"
                      value={filters.fromDate}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">
                      終了日
                    </label>
                    <input
                      type="date"
                      id="toDate"
                      name="toDate"
                      value={filters.toDate}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 新規作成ボタン */}
              <div className="mb-6">
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  新規経費申請
                </button>
              </div>

              {/* 経費一覧 */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {expensesQuery.isLoading ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">読み込み中...</p>
                  </div>
                ) : expensesQuery.isError ? (
                  <div className="p-6 text-center">
                    <p className="text-red-500">エラーが発生しました</p>
                  </div>
                ) : expensesQuery.data?.expenses.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">経費申請はありません</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            件名
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            金額
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            カテゴリ
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            ステータス
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            申請日
                          </th>
                          {isApprover && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              申請者
                            </th>
                          )}
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            アクション
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expensesQuery.data?.expenses.map((expense: any) => (
                          <tr key={expense.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {expense.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatAmount(expense.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {expense.category || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderStatusBadge(expense.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(expense.createdAt)}
                            </td>
                            {isApprover && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {expense.user?.name || '-'}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleView(expense.id)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                詳細
                              </button>
                              {expense.status === 'PENDING' && expense.userId === user?.id && (
                                <button
                                  onClick={() => handleEdit(expense.id)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  編集
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ページネーション */}
                {expensesQuery.data && expensesQuery.data.total > 0 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={handlePrevPage}
                        disabled={pagination.offset === 0}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        前へ
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={pagination.offset + pagination.limit >= expensesQuery.data.total}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        次へ
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{pagination.offset + 1}</span>
                          {' - '}
                          <span className="font-medium">
                            {Math.min(pagination.offset + pagination.limit, expensesQuery.data.total)}
                          </span>{' '}
                          / <span className="font-medium">{expensesQuery.data.total}</span> 件
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={handlePrevPage}
                            disabled={pagination.offset === 0}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <span className="sr-only">前へ</span>
                            &lt;
                          </button>
                          <button
                            onClick={handleNextPage}
                            disabled={pagination.offset + pagination.limit >= expensesQuery.data.total}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <span className="sr-only">次へ</span>
                            &gt;
                          </button>
                        </nav>
                      </div>
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

export default ExpenseList;
