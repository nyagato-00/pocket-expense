import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../../pages/Dashboard';
import { useAuth } from '../../contexts/AuthContext';

// useAuthのモック
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Dashboard', () => {
  // テスト前の設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ダッシュボードが正しくレンダリングされること', () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    });

    // レンダリング
    render(<Dashboard />);

    // 検証
    expect(screen.getByText('ポケット経費申請')).toBeInTheDocument();
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText(`${mockUser.name} (ユーザー)`)).toBeInTheDocument();
    expect(screen.getByText(`ようこそ、${mockUser.name}さん！`)).toBeInTheDocument();
    expect(screen.getByText('ここにダッシュボードの内容が表示されます。')).toBeInTheDocument();
    expect(screen.getByText('最近の経費申請')).toBeInTheDocument();
    expect(screen.getByText('経費申請はまだありません')).toBeInTheDocument();
  });

  it('管理者ユーザーの場合は正しく表示されること', () => {
    // モックユーザー（管理者）
    const mockUser = {
      id: 'admin123',
      name: '管理者ユーザー',
      email: 'admin@example.com',
      role: 'ADMIN',
      department: '管理部',
    };

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    });

    // レンダリング
    render(<Dashboard />);

    // 検証
    expect(screen.getByText(`${mockUser.name} (管理者)`)).toBeInTheDocument();
  });

  it('承認者ユーザーの場合は正しく表示されること', () => {
    // モックユーザー（承認者）
    const mockUser = {
      id: 'approver123',
      name: '承認者ユーザー',
      email: 'approver@example.com',
      role: 'APPROVER',
      department: '経理部',
    };

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    });

    // レンダリング
    render(<Dashboard />);

    // 検証
    expect(screen.getByText(`${mockUser.name} (承認者)`)).toBeInTheDocument();
  });

  it('プロフィールリンクが正しく機能すること', () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    });

    // レンダリング
    render(<Dashboard />);

    // プロフィールリンクを確認
    const profileLink = screen.getByText('プロフィール');
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.getAttribute('href')).toBe('/profile');
  });

  it('ログアウトボタンをクリックするとログアウト処理が実行されること', async () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // ログアウト関数のモック
    const logoutMock = jest.fn().mockResolvedValue(undefined);

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: logoutMock,
    });

    // レンダリング
    render(<Dashboard />);

    // ログアウトボタンをクリック
    const logoutButton = screen.getByText('ログアウト');
    fireEvent.click(logoutButton);

    // 検証
    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
    });
  });

  it('ログアウトが失敗した場合もエラーがキャッチされること', async () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // コンソールエラーをモック
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // ログアウト関数のモック（エラーをスロー）
    const logoutMock = jest.fn().mockRejectedValue(new Error('ログアウトに失敗しました'));

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: logoutMock,
    });

    // レンダリング
    render(<Dashboard />);

    // ログアウトボタンをクリック
    const logoutButton = screen.getByText('ログアウト');
    fireEvent.click(logoutButton);

    // 検証
    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('ログアウトエラー:', expect.any(Error));
    });

    // コンソールエラーを元に戻す
    console.error = originalConsoleError;
  });
});
