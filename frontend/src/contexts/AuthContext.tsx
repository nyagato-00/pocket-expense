import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';

// 認証ユーザーの型定義
interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'APPROVER' | 'ADMIN';
  department?: string;
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: UpdateProfileData) => Promise<void>;
}

// 登録データの型定義
interface RegisterData {
  name: string;
  email: string;
  password: string;
  department?: string;
}

// プロフィール更新データの型定義
interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
  department?: string;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーコンポーネント
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // tRPCクライアントの初期化
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const refreshTokenMutation = trpc.auth.refreshToken.useMutation();
  const updateProfileMutation = trpc.user.updateProfile.useMutation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  // 初期化時にローカルストレージからトークンを取得
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedToken) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // トークンが変更されたときにユーザー情報を取得
  useEffect(() => {
    if (token) {
      // refetchを使わず、enabledフラグで制御する
      setIsLoading(false);
    }
  }, [token]);

  // meQueryの結果が変更されたときにユーザー情報を更新
  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data as User);
    } else if (meQuery.isError && refreshToken) {
      // エラーが発生した場合はリフレッシュトークンを試す
      handleRefreshToken();
    }
  }, [meQuery.data, meQuery.isError, refreshToken]);

  // リフレッシュトークンを使用して新しいトークンを取得
  const handleRefreshToken = async () => {
    if (refreshToken) {
      try {
        const result = await refreshTokenMutation.mutateAsync({ refreshToken });
        setToken(result.token);
        setRefreshToken(result.refreshToken);
        localStorage.setItem('token', result.token);
        localStorage.setItem('refreshToken', result.refreshToken);
      } catch (error) {
        // リフレッシュトークンが無効な場合はログアウト
        handleLogout();
      }
    } else {
      handleLogout();
    }
  };

  // ログイン処理
  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      setUser(result.user as User);
      setToken(result.token);
      setRefreshToken(result.refreshToken);
      localStorage.setItem('token', result.token);
      localStorage.setItem('refreshToken', result.refreshToken);
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    }
  };

  // 登録処理
  const handleRegister = async (userData: RegisterData) => {
    try {
      const result = await registerMutation.mutateAsync(userData);
      setUser(result.user as User);
      setToken(result.token);
      setRefreshToken(result.refreshToken);
      localStorage.setItem('token', result.token);
      localStorage.setItem('refreshToken', result.refreshToken);
    } catch (error) {
      console.error('登録エラー:', error);
      throw error;
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      if (token) {
        await logoutMutation.mutateAsync();
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  // プロフィール更新処理
  const handleUpdateProfile = async (userData: UpdateProfileData) => {
    try {
      const updatedUser = await updateProfileMutation.mutateAsync(userData);
      setUser(prevUser => prevUser ? { ...prevUser, ...(updatedUser as User) } : null);
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  };

  // コンテキスト値の作成
  const value = {
    user,
    token,
    refreshToken,
    isLoading,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 認証コンテキストを使用するためのフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
