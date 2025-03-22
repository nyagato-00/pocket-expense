import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { useAuth } from '../contexts/AuthContext';
import { RequestStatus } from '../../../shared/types';

const ExpenseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isApprover = user?.role === 'APPROVER' || user?.role === 'ADMIN';
  
  // コメント入力状態
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 経費詳細取得
  const expenseQuery = trpc.expense.getById.useQuery(id || '', {
    retry: false,
  });

  // ミューテーション
  const updateStatusMutation = trpc.expense.updateStatus.useMutation();
  const addCommentMutation = trpc.expense.addComment.useMutation();
  const deleteExpenseMutation = trpc.expense.delete.useMutation();

  // 承認ハンドラ
  const handleApprove = async () => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: 'APPROVED',
        comment: comment || undefined,
      });
      
      // 再取得
      expenseQuery.refetch();
      setComment('');
    } catch (error) {
      console.error('承認エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 却下ハンドラ
  const handleReject = async () => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: 'REJECTED',
        comment: comment || undefined,
      });
      
      // 再取得
      expenseQuery.refetch();
      setComment('');
    } catch (error) {
      console.error('却下エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // コメント追加ハンドラ
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        expenseId: id,
        content: comment,
      });
      
      // 再取得
      expenseQuery.refetch();
      setComment('');
    } catch (error) {
      console.error('コメント追加エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除ハンドラ
  const handleDelete = async () => {
    if (!id) return;
    
    if (!window.confirm('この経費申請を削除してもよろしいですか？')) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await deleteExpenseMutation.mutateAsync(id);
      
      // 一覧に戻る
      navigate('/expenses');
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 編集ハンドラ
  const handleEdit = () => {
    navigate(`/expenses/${id}/edit`);
  };

  // 戻るハンドラ
  const handleBack = () => {
    navigate('/expenses');
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

  // ローディング中
  if (expenseQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // エラー
  if (expenseQuery.isError || !expenseQuery.data) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">経費申請が見つかりませんでした</p>
        </div>
        <button
          onClick={handleBack}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          経費一覧に戻る
        </button>
      </div>
    );
  }

  const expense = expenseQuery.data;
  const isPending = expense.status === 'PENDING';
  const isOwner = expense.userId === user?.id;
  const canEdit = isPending && isOwner;
  const canDelete = isPending && isOwner;
  const canApprove = isApprover && isPending && !isOwner;

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
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">経費申請詳細</h1>
              <button
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                一覧に戻る
              </button>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {/* 経費詳細 */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {expense.title}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      申請日: {formatDate(expense.createdAt)}
                    </p>
                  </div>
                  <div>
                    {renderStatusBadge(expense.status)}
                  </div>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">申請者</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {expense.user?.name} ({expense.user?.email})
                        {expense.user?.department && ` - ${expense.user.department}`}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">金額</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatAmount(expense.amount)}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">カテゴリ</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {expense.category || '-'}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">説明</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {expense.description || '-'}
                      </dd>
                    </div>
                    {expense.receiptUrl && (
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">領収書</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <a
                            href={expense.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            領収書を表示
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* アクションボタン */}
              {(canEdit || canDelete || canApprove) && (
                <div className="flex justify-end space-x-3 mb-6">
                  {canEdit && (
                    <button
                      onClick={handleEdit}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      編集
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      削除
                    </button>
                  )}
                  {canApprove && (
                    <>
                      <button
                        onClick={handleReject}
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        却下
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        承認
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 承認履歴 */}
              {expense.approvals && expense.approvals.length > 0 && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      承認履歴
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <ul className="divide-y divide-gray-200">
                      {expense.approvals.map((approval: any) => (
                        <li key={approval.id} className="px-4 py-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {approval.approver.name} ({approval.approver.role === 'ADMIN' ? '管理者' : '承認者'})
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(approval.createdAt)}
                              </p>
                            </div>
                            <div>
                              {renderStatusBadge(approval.status)}
                            </div>
                          </div>
                          {approval.comment && (
                            <p className="mt-2 text-sm text-gray-700">
                              {approval.comment}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* コメント一覧 */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    コメント
                  </h3>
                </div>
                <div className="border-t border-gray-200">
                  {expense.comments && expense.comments.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {expense.comments.map((comment: any) => (
                        <li key={comment.id} className="px-4 py-4">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {comment.user.name} ({comment.user.role === 'ADMIN' ? '管理者' : comment.user.role === 'APPROVER' ? '承認者' : 'ユーザー'})
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-gray-700">
                            {comment.content}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-5 text-center text-sm text-gray-500">
                      コメントはありません
                    </div>
                  )}
                </div>
              </div>

              {/* コメント入力フォーム */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    コメントを追加
                  </h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <form onSubmit={handleAddComment}>
                    <div>
                      <textarea
                        id="comment"
                        name="comment"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="コメントを入力してください"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !comment.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        コメントを追加
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExpenseDetail;
