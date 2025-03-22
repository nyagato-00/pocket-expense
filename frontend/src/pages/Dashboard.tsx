import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // ログアウト後のリダイレクトはルーターで処理される
    } catch (error) {
      console.error('ログアウトエラー:', error);
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
                
                {/* 経費申請一覧（仮） */}
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900">最近の経費申請</h2>
                  <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      <li className="px-6 py-4">
                        <p className="text-center text-gray-500 text-sm">
                          経費申請はまだありません
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
