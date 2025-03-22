import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ユーザー情報をフォームに設定
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // パスワード変更がある場合は確認
    if (password && password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    // パスワード強度チェック
    if (password && password.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return;
    }

    setIsLoading(true);

    try {
      // 更新データを準備
      const updateData: {
        name?: string;
        email?: string;
        department?: string;
        password?: string;
      } = {};

      if (name !== user?.name) updateData.name = name;
      if (email !== user?.email) updateData.email = email;
      if (department !== user?.department) updateData.department = department;
      if (password) updateData.password = password;

      // データが変更されている場合のみ更新
      if (Object.keys(updateData).length > 0) {
        await updateProfile(updateData);
        setSuccess('プロフィールが更新されました');
        setPassword('');
        setConfirmPassword('');
      } else {
        setSuccess('変更はありません');
      }
    } catch (err: any) {
      if (err.message) {
        setError(err.message);
      } else {
        setError('プロフィールの更新に失敗しました');
      }
      console.error('プロフィール更新エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center py-10">読み込み中...</div>;
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
              <a
                href="/dashboard"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ダッシュボードに戻る
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">プロフィール設定</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="text-sm text-green-700">{success}</div>
                  </div>
                )}
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      名前
                    </label>
                    <div className="mt-1">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      メールアドレス
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      部署
                    </label>
                    <div className="mt-1">
                      <input
                        id="department"
                        name="department"
                        type="text"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900">パスワード変更</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      パスワードを変更する場合のみ入力してください
                    </p>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      新しいパスワード
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="変更する場合のみ入力"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                      新しいパスワード（確認）
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="新しいパスワードを再入力"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {isLoading ? '更新中...' : 'プロフィールを更新'}
                    </button>
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

export default Profile;
