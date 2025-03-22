import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useContext();
  
  // 管理者権限チェック
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // ユーザー一覧を取得
  const usersQuery = trpc.user.getAll.useQuery();
  
  // ユーザー作成ミューテーション
  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      // 成功したらユーザー一覧を再取得
      utils.user.getAll.invalidate();
      // フォームをリセット
      setNewUser({
        name: '',
        email: '',
        password: '',
        department: '',
        role: 'USER'
      });
      setShowCreateForm(false);
    }
  });
  
  // ユーザー更新ミューテーション
  const updateUserMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      // 成功したらユーザー一覧を再取得
      utils.user.getAll.invalidate();
      // 編集モードを終了
      setEditingUser(null);
    }
  });
  
  // ユーザー削除ミューテーション
  const deleteUserMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      // 成功したらユーザー一覧を再取得
      utils.user.getAll.invalidate();
    }
  });
  
  // 新規ユーザーフォームの状態
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'USER' as 'USER' | 'APPROVER' | 'ADMIN'
  });
  
  // 編集中のユーザー
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
    password: string;
    department: string;
    role: 'USER' | 'APPROVER' | 'ADMIN';
  } | null>(null);
  
  // 新規ユーザーフォームの入力ハンドラ
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 編集フォームの入力ハンドラ
  const handleEditUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingUser) return;
    
    const { name, value } = e.target;
    setEditingUser(prev => ({
      ...prev!,
      [name]: value
    }));
  };
  
  // 新規ユーザー作成
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };
  
  // ユーザー更新
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // パスワードが空の場合は更新しない
    if (!editingUser.password) {
      const { password, ...userData } = editingUser;
      updateUserMutation.mutate(userData);
    } else {
      updateUserMutation.mutate(editingUser);
    }
  };
  
  // ユーザー削除
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('このユーザーを削除してもよろしいですか？')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  // 編集モード開始
  const startEditing = (tableUser: {
    id: string;
    name: string;
    email: string;
    department?: string;
    role: 'USER' | 'APPROVER' | 'ADMIN';
  }) => {
    setEditingUser({
      id: tableUser.id,
      name: tableUser.name,
      email: tableUser.email,
      password: '', // パスワードは空で初期化
      department: tableUser.department || '',
      role: tableUser.role
    });
  };
  
  // ロール表示用の日本語名
  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return '管理者';
      case 'APPROVER': return '承認者';
      case 'USER': return '一般ユーザー';
      default: return role;
    }
  };
  
  return (
    <Layout title="ユーザー管理">
      <div className="space-y-6">
        <Card
          title="ユーザー一覧"
          shadow="lg"
          rounded="lg"
          padding="lg"
          actions={
            <Button
              label={showCreateForm ? 'キャンセル' : '新規ユーザー追加'}
              variant={showCreateForm ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            />
          }
        >
          {/* 新規ユーザー作成フォーム */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">新規ユーザー追加</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名前
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleNewUserChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={newUser.department}
                    onChange={handleNewUserChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ロール
                  </label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleNewUserChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="USER">一般ユーザー</option>
                    <option value="APPROVER">承認者</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    label="キャンセル"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  />
                  <Button
                    type="submit"
                    label="ユーザーを作成"
                    variant="primary"
                    size="sm"
                    disabled={createUserMutation.isLoading}
                  />
                </div>
              </form>
            </div>
          )}
          
          {/* ユーザー一覧テーブル */}
          {usersQuery.isLoading ? (
            <div className="text-center py-4">読み込み中...</div>
          ) : usersQuery.isError ? (
            <div className="text-center py-4 text-danger-600">エラーが発生しました</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名前
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      メールアドレス
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      部署
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ロール
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersQuery.data?.map((tableUser) => (
                    <tr key={tableUser.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tableUser.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{tableUser.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{tableUser.department || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tableUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          tableUser.role === 'APPROVER' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {getRoleName(tableUser.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {user && tableUser.id !== user.id && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => startEditing(tableUser)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteUser(tableUser.id)}
                              className="text-danger-600 hover:text-danger-900"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        
        {/* ユーザー編集モーダル */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium mb-4">ユーザー編集</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名前
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingUser.name}
                    onChange={handleEditUserChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editingUser.email}
                    onChange={handleEditUserChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード（変更する場合のみ入力）
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={editingUser.password}
                    onChange={handleEditUserChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={editingUser.department}
                    onChange={handleEditUserChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ロール
                  </label>
                  <select
                    name="role"
                    value={editingUser.role}
                    onChange={handleEditUserChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="USER">一般ユーザー</option>
                    <option value="APPROVER">承認者</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    label="キャンセル"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingUser(null)}
                  />
                  <Button
                    type="submit"
                    label="更新"
                    variant="primary"
                    size="sm"
                    disabled={updateUserMutation.isLoading}
                  />
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;
