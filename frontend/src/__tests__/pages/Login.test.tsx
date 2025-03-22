import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../pages/Login';
import { useAuth } from '../../contexts/AuthContext';

// useAuthのモック
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Login', () => {
  // テスト前の設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログインフォームが正しくレンダリングされること', () => {
    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      login: jest.fn(),
    });

    // レンダリング
    render(<Login />);

    // 検証
    expect(screen.getByText('Pocket Expense')).toBeInTheDocument();
    expect(screen.getByText('アカウントにログイン')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByText('アカウントをお持ちでない方は登録')).toBeInTheDocument();
  });

  it('フォーム入力が正しく動作すること', () => {
    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      login: jest.fn(),
    });

    // レンダリング
    render(<Login />);

    // 入力フィールドを取得
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード');

    // 入力を行う
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // 検証
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('ログインが成功すること', async () => {
    // ログイン関数のモック
    const loginMock = jest.fn().mockResolvedValue(undefined);

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      login: loginMock,
    });

    // レンダリング
    render(<Login />);

    // 入力フィールドを取得
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });

    // 入力を行う
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // ボタンのテキストが変わることを確認
    expect(screen.getByRole('button')).toHaveTextContent('ログイン中...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('ログインが失敗するとエラーメッセージが表示されること', async () => {
    // ログイン関数のモック（エラーをスロー）
    const loginMock = jest.fn().mockRejectedValue(new Error('ログイン失敗'));

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      login: loginMock,
    });

    // レンダリング
    render(<Login />);

    // 入力フィールドを取得
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });

    // 入力を行う
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('test@example.com', 'wrong-password');
      expect(screen.getByText('ログインに失敗しました。メールアドレスとパスワードを確認してください。')).toBeInTheDocument();
    });

    // ボタンのテキストが元に戻ることを確認
    expect(screen.getByRole('button')).toHaveTextContent('ログイン');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
