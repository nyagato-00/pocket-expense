import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseCategory } from '../../../shared/types';
import FileUpload from '../components/FileUpload';

const ExpenseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  // フォームの状態
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    description: '',
    category: '',
    receiptUrl: '',
    receiptFilePath: '',
    receiptFileName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // tRPCクエリとミューテーション
  const createExpenseMutation = trpc.expense.create.useMutation();
  const updateExpenseMutation = trpc.expense.update.useMutation();
  const categoriesQuery = trpc.expense.getCategories.useQuery();
  const expenseQuery = trpc.expense.getById.useQuery(id || '', {
    enabled: isEditing,
    retry: false
  });

  // 編集時に経費データを取得
  useEffect(() => {
    if (isEditing && expenseQuery.data) {
      const expense = expenseQuery.data;
      setFormData({
        title: expense.title,
        amount: expense.amount.toString(),
        description: expense.description || '',
        category: expense.category || '',
        receiptUrl: expense.receiptUrl || '',
        receiptFilePath: expense.receiptFilePath || '',
        receiptFileName: expense.receiptFileName || ''
      });
    }
  }, [isEditing, expenseQuery.data]);

  // 入力変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // バリデーション
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '件名は必須です';
    }
    
    if (!formData.amount) {
      newErrors.amount = '金額は必須です';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = '金額は正の数値を入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const expenseData = {
        title: formData.title,
        amount: Number(formData.amount),
        description: formData.description || undefined,
        category: formData.category as ExpenseCategory | undefined,
        receiptUrl: formData.receiptUrl || undefined,
        receiptFilePath: formData.receiptFilePath || undefined,
        receiptFileName: formData.receiptFileName || undefined
      };
      
      if (isEditing) {
        await updateExpenseMutation.mutateAsync({
          id,
          title: expenseData.title,
          amount: expenseData.amount,
          description: expenseData.description,
          category: expenseData.category,
          receiptUrl: expenseData.receiptUrl,
          receiptFilePath: expenseData.receiptFilePath,
          receiptFileName: expenseData.receiptFileName
        });
      } else {
        await createExpenseMutation.mutateAsync(expenseData);
      }
      
      // 成功したらダッシュボードに戻る
      navigate('/expenses');
    } catch (error: any) {
      // エラーメッセージを表示
      setErrors({
        submit: error.message || '経費申請の保存中にエラーが発生しました'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // キャンセルハンドラ
  const handleCancel = () => {
    navigate('/expenses');
  };

  // ローディング中
  if (isEditing && expenseQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // 経費が見つからない場合
  if (isEditing && expenseQuery.isError) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">経費申請が見つかりませんでした</p>
        </div>
        <button
          onClick={() => navigate('/expenses')}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          経費一覧に戻る
        </button>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? '経費申請の編集' : '新規経費申請'}
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                {errors.submit && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <p className="text-red-700">{errors.submit}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* 件名 */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        件名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`mt-1 block w-full border ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>

                    {/* 金額 */}
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        金額 <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">¥</span>
                        </div>
                        <input
                          type="text"
                          name="amount"
                          id="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          className={`block w-full pl-7 pr-12 border ${
                            errors.amount ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                          placeholder="0"
                        />
                      </div>
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                      )}
                    </div>

                    {/* カテゴリ */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        カテゴリ
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">カテゴリを選択</option>
                        {categoriesQuery.data?.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 説明 */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        説明
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* 領収書URL */}
                    <div>
                      <label htmlFor="receiptUrl" className="block text-sm font-medium text-gray-700">
                        領収書URL
                      </label>
                      <input
                        type="text"
                        name="receiptUrl"
                        id="receiptUrl"
                        value={formData.receiptUrl}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://example.com/receipt.pdf"
                      />
                    </div>

                    {/* 領収書ファイルアップロード */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        領収書ファイル
                      </label>
                      <FileUpload
                        onFileUpload={(fileInfo) => {
                          setFormData(prev => ({
                            ...prev,
                            receiptFilePath: fileInfo.filePath,
                            receiptFileName: fileInfo.fileName
                          }));
                        }}
                        currentFileUrl={formData.receiptFilePath ? `http://localhost:4000/uploads/${formData.receiptFilePath.split('/').pop()}` : undefined}
                        currentFileName={formData.receiptFileName}
                      />
                    </div>

                    {/* ボタン */}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isSubmitting ? '送信中...' : isEditing ? '更新する' : '申請する'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExpenseForm;
