import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from '../../pages/Profile';
import { useAuth } from '../../contexts/AuthContext';

// useAuthのモック
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Profile', () => {
  // テスト前の設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザー情報が正しくレンダリングされること', () => {
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
      updateProfile: jest.fn(),
    });

    // レンダリング
    render(<Profile />);

    // 検証
    expect(screen.getByText('プロフィール設定')).toBeInTheDocument();
    
    // フォームフィールドの値を確認
    const nameInput = screen.getByLabelText('名前');
    const emailInput = screen.getByLabelText('メールアドレス');
    const departmentInput = screen.getByLabelText('部署');
    
    expect(nameInput).toHaveValue(mockUser.name);
    expect(emailInput).toHaveValue(mockUser.email);
    expect(departmentInput).toHaveValue(mockUser.department);
  });

  it('ユーザーがロードされていない場合はローディングが表示されること', () => {
    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      updateProfile: jest.fn(),
    });

    // レンダリング
    render(<Profile />);

    // 検証
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('プロフィール情報の更新が成功すること', async () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // 更新関数のモック
    const updateProfileMock = jest.fn().mockResolvedValue(undefined);

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: updateProfileMock,
    });

    // レンダリング
    render(<Profile />);

    // 入力フィールドを取得
    const nameInput = screen.getByLabelText('名前');
    const departmentInput = screen.getByLabelText('部署');
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' });

    // 入力を変更
    fireEvent.change(nameInput, { target: { value: '更新ユーザー' } });
    fireEvent.change(departmentInput, { target: { value: '営業部' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        name: '更新ユーザー',
        department: '営業部',
      });
      expect(screen.getByText('プロフィールが更新されました')).toBeInTheDocument();
    });

    // ボタンのテキストが元に戻ることを確認
    expect(screen.getByRole('button')).toHaveTextContent('プロフィールを更新');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('パスワード変更が成功すること', async () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // 更新関数のモック
    const updateProfileMock = jest.fn().mockResolvedValue(undefined);

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: updateProfileMock,
    });

    // レンダリング
    render(<Profile />);

    // 入力フィールドを取得
    const passwordInput = screen.getByLabelText('新しいパスワード');
    const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）');
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' });

    // 入力を変更
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
      expect(screen.getByText('プロフィールが更新されました')).toBeInTheDocument();
    });

    // パスワードフィールドがクリアされることを確認
    expect(passwordInput).toHaveValue('');
    expect(confirmPasswordInput).toHaveValue('');
  });

  it('パスワードが一致しない場合はエラーが表示されること', async () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // 更新関数のモック
    const updateProfileMock = jest.fn();

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: updateProfileMock,
    });

    // レンダリング
    render(<Profile />);

    // 入力フィールドを取得
    const passwordInput = screen.getByLabelText('新しいパスワード');
    const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）');
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' });

    // 入力を変更（パスワードが一致しない）
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it('パスワードが短すぎる場合はエラーが表示されること', async () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // 更新関数のモック
    const updateProfileMock = jest.fn();

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: updateProfileMock,
    });

    // レンダリング
    render(<Profile />);

    // 入力フィールドを取得
    const passwordInput = screen.getByLabelText('新しいパスワード');
    const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）');
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' });

    // 入力を変更（パスワードが短すぎる）
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    expect(screen.getByText('パスワードは8文字以上である必要があります')).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it('更新が失敗した場合はエラーメッセージが表示されること', async () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // 更新関数のモック（エラーをスロー）
    const updateProfileMock = jest.fn().mockRejectedValue(new Error('メールアドレスは既に使用されています'));

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: updateProfileMock,
    });

    // レンダリング
    render(<Profile />);

    // 入力フィールドを取得
    const emailInput = screen.getByLabelText('メールアドレス');
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' });

    // 入力を変更
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        email: 'existing@example.com',
      });
      expect(screen.getByText('メールアドレスは既に使用されています')).toBeInTheDocument();
    });

    // ボタンのテキストが元に戻ることを確認
    expect(screen.getByRole('button')).toHaveTextContent('プロフィールを更新');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('変更がない場合は更新されないこと', async () => {
    // モックユーザー
    const mockUser = {
      id: 'user123',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'USER',
      department: '開発部',
    };

    // 更新関数のモック
    const updateProfileMock = jest.fn();

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: updateProfileMock,
    });

    // レンダリング
    render(<Profile />);

    // 入力フィールドを取得
    const submitButton = screen.getByRole('button', { name: 'プロフィールを更新' });

    // フォームを送信（変更なし）
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(screen.getByText('変更はありません')).toBeInTheDocument();
      expect(updateProfileMock).not.toHaveBeenCalled();
    });
  });

  it('ダッシュボードへのリンクが正しく機能すること', () => {
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
      updateProfile: jest.fn(),
    });

    // レンダリング
    render(<Profile />);

    // ダッシュボードへのリンクを確認
    const dashboardLink = screen.getByText('ダッシュボードに戻る');
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.getAttribute('href')).toBe('/dashboard');
  });
});
