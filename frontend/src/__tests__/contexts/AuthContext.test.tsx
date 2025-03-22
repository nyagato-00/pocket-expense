import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { trpc } from '../../utils/trpc';

// tRPCクライアントのモック
jest.mock('../../utils/trpc', () => ({
  trpc: {
    auth: {
      login: {
        useMutation: jest.fn(),
      },
      register: {
        useMutation: jest.fn(),
      },
      logout: {
        useMutation: jest.fn(),
      },
      refreshToken: {
        useMutation: jest.fn(),
      },
      me: {
        useQuery: jest.fn(),
      },
    },
    user: {
      updateProfile: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// ローカルストレージのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// テスト用のコンポーネント
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{auth.isLoading.toString()}</div>
      <button data-testid="login" onClick={() => auth.login('test@example.com', 'password')}>
        ログイン
      </button>
      <button
        data-testid="register"
        onClick={() =>
          auth.register({
            name: 'テストユーザー',
            email: 'test@example.com',
            password: 'password',
          })
        }
      >
        登録
      </button>
      <button data-testid="logout" onClick={() => auth.logout()}>
        ログアウト
      </button>
      <button
        data-testid="updateProfile"
        onClick={() =>
          auth.updateProfile({
            name: '更新ユーザー',
          })
        }
      >
        プロフィール更新
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  // テスト前の設定
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('初期状態では認証されていないこと', () => {
    // モックの設定
    (trpc.auth.me.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue({ data: null }),
    });

    // レンダリング
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 検証
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('isLoading').textContent).toBe('true');
  });

  it('ローカルストレージにトークンがある場合はユーザー情報を取得すること', async () => {
    // モックの設定
    const user = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    localStorageMock.setItem('token', 'test-token');
    localStorageMock.setItem('refreshToken', 'test-refresh-token');

    const refetchMock = jest.fn().mockResolvedValue({ data: user });
    (trpc.auth.me.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: refetchMock,
    });

    // レンダリング
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 検証
    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalled();
    });
  });

  it('ログインが成功すること', async () => {
    // モックの設定
    const user = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };
    const token = 'test-token';
    const refreshToken = 'test-refresh-token';

    const loginMutateAsyncMock = jest.fn().mockResolvedValue({
      user,
      token,
      refreshToken,
    });
    (trpc.auth.login.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: loginMutateAsyncMock,
    });

    (trpc.auth.me.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue({ data: user }),
    });

    // レンダリング
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // ログインボタンをクリック
    await act(async () => {
      screen.getByTestId('login').click();
    });

    // 検証
    await waitFor(() => {
      expect(loginMutateAsyncMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);
    });
  });

  it('登録が成功すること', async () => {
    // モックの設定
    const user = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };
    const token = 'test-token';
    const refreshToken = 'test-refresh-token';

    const registerMutateAsyncMock = jest.fn().mockResolvedValue({
      user,
      token,
      refreshToken,
    });
    (trpc.auth.register.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: registerMutateAsyncMock,
    });

    (trpc.auth.me.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue({ data: user }),
    });

    // レンダリング
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 登録ボタンをクリック
    await act(async () => {
      screen.getByTestId('register').click();
    });

    // 検証
    await waitFor(() => {
      expect(registerMutateAsyncMock).toHaveBeenCalledWith({
        name: 'テストユーザー',
        email: 'test@example.com',
        password: 'password',
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);
    });
  });

  it('ログアウトが成功すること', async () => {
    // モックの設定
    const user = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    const logoutMutateAsyncMock = jest.fn().mockResolvedValue({ success: true });
    (trpc.auth.logout.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: logoutMutateAsyncMock,
    });

    (trpc.auth.me.useQuery as jest.Mock).mockReturnValue({
      data: user,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue({ data: user }),
    });

    // レンダリング
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // ログアウトボタンをクリック
    await act(async () => {
      screen.getByTestId('logout').click();
    });

    // 検証
    await waitFor(() => {
      expect(logoutMutateAsyncMock).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  it('プロフィール更新が成功すること', async () => {
    // モックの設定
    const user = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    const updatedUser = {
      ...user,
      name: '更新ユーザー',
    };

    const updateProfileMutateAsyncMock = jest.fn().mockResolvedValue(updatedUser);
    (trpc.user.updateProfile.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: updateProfileMutateAsyncMock,
    });

    (trpc.auth.me.useQuery as jest.Mock).mockReturnValue({
      data: user,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue({ data: user }),
    });

    // レンダリング
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // プロフィール更新ボタンをクリック
    await act(async () => {
      screen.getByTestId('updateProfile').click();
    });

    // 検証
    await waitFor(() => {
      expect(updateProfileMutateAsyncMock).toHaveBeenCalledWith({
        name: '更新ユーザー',
      });
    });
  });

  it('トークンリフレッシュが成功すること', async () => {
    // モックの設定
    const refreshToken = 'old-refresh-token';
    const newToken = 'new-token';
    const newRefreshToken = 'new-refresh-token';

    localStorageMock.setItem('token', 'expired-token');
    localStorageMock.setItem('refreshToken', refreshToken);

    const refreshTokenMutateAsyncMock = jest.fn().mockResolvedValue({
      token: newToken,
      refreshToken: newRefreshToken,
    });
    (trpc.auth.refreshToken.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: refreshTokenMutateAsyncMock,
    });

    const refetchMock = jest.fn().mockRejectedValue(new Error('Token expired'));
    (trpc.auth.me.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: refetchMock,
    });

    // レンダリング
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 検証
    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalled();
      expect(refreshTokenMutateAsyncMock).toHaveBeenCalledWith({ refreshToken });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', newToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', newRefreshToken);
    });
  });
});
