import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiUser, FiHome, FiFileText } from 'react-icons/fi';
import Button from './Button';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

/**
 * 共通レイアウトコンポーネント
 */
export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // ログアウト後のリダイレクトはルーターで処理される
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <nav className="bg-primary-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 
                className="text-xl font-bold text-secondary-900 cursor-pointer flex items-center" 
                onClick={() => navigate('/dashboard')}
              >
                <FiFileText className="mr-2" />
                ポケット経費申請
              </h1>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-secondary-900 font-medium">
                  {user.name} ({user.role === 'ADMIN' ? '管理者' : user.role === 'APPROVER' ? '承認者' : 'ユーザー'})
                </span>
                <Button
                  label="ダッシュボード"
                  variant="accent"
                  size="sm"
                  leftIcon={FiHome}
                  onClick={() => navigate('/dashboard')}
                />
                <Button
                  label="プロフィール"
                  variant="accent"
                  size="sm"
                  leftIcon={FiUser}
                  onClick={() => navigate('/profile')}
                />
                <Button
                  label="ログアウト"
                  variant="secondary"
                  size="sm"
                  leftIcon={FiLogOut}
                  onClick={handleLogout}
                />
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="py-10">
        {title && (
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-secondary-900">{title}</h1>
            </div>
          </header>
        )}
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
