import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../../pages/Register';
import { useAuth } from '../../contexts/AuthContext';

// useAuthのモック
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Register', () => {
  // テスト前の設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('登録フォームが正しくレンダリングされること', () => {
    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn(),
    });

    // レンダリング
    render(<Register />);

    // 検証
    expect(screen.getByText('Pocket Expense')).toBeInTheDocument();
    expect(screen.getByText('新規アカウント登録')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('名前')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('部署（任意）')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('パスワード（8文字以上）')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('パスワード（確認）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'アカウント登録' })).toBeInTheDocument();
    expect(screen.getByText('既にアカウントをお持ちの方はログイン')).toBeInTheDocument();
  });

  it('フォーム入力が正しく動作すること', () => {
    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn(),
    });

    // レンダリング
    render(<Register />);

    // 入力フィールドを取得
    const nameInput = screen.getByPlaceholderText('名前');
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const departmentInput = screen.getByPlaceholderText('部署（任意）');
    const passwordInput = screen.getByPlaceholderText('パスワード（8文字以上）');
    const confirmPasswordInput = screen.getByPlaceholderText('パスワード（確認）');

    // 入力を行う
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(departmentInput, { target: { value: '開発部' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // 検証
    expect(nameInput).toHaveValue('テストユーザー');
    expect(emailInput).toHaveValue('test@example.com');
    expect(departmentInput).toHaveValue('開発部');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('パスワードが一致しない場合はエラーメッセージが表示されること', async () => {
    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn(),
    });

    // レンダリング
    render(<Register />);

    // 入力フィールドを取得
    const nameInput = screen.getByPlaceholderText('名前');
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード（8文字以上）');
    const confirmPasswordInput = screen.getByPlaceholderText('パスワード（確認）');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    // 入力を行う
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different-password' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
  });

  it('パスワードが短すぎる場合はエラーメッセージが表示されること', async () => {
    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn(),
    });

    // レンダリング
    render(<Register />);

    // 入力フィールドを取得
    const nameInput = screen.getByPlaceholderText('名前');
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード（8文字以上）');
    const confirmPasswordInput = screen.getByPlaceholderText('パスワード（確認）');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    // 入力を行う
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    expect(screen.getByText('パスワードは8文字以上である必要があります')).toBeInTheDocument();
  });

  it('登録が成功すること', async () => {
    // 登録関数のモック
    const registerMock = jest.fn().mockResolvedValue(undefined);

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      register: registerMock,
    });

    // レンダリング
    render(<Register />);

    // 入力フィールドを取得
    const nameInput = screen.getByPlaceholderText('名前');
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const departmentInput = screen.getByPlaceholderText('部署（任意）');
    const passwordInput = screen.getByPlaceholderText('パスワード（8文字以上）');
    const confirmPasswordInput = screen.getByPlaceholderText('パスワード（確認）');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    // 入力を行う
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(departmentInput, { target: { value: '開発部' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'テストユーザー',
        email: 'test@example.com',
        password: 'password123',
        department: '開発部',
      });
    });

    // ボタンのテキストが変わることを確認
    expect(screen.getByRole('button')).toHaveTextContent('登録中...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('登録が失敗するとエラーメッセージが表示されること', async () => {
    // 登録関数のモック（エラーをスロー）
    const registerMock = jest.fn().mockRejectedValue(new Error('このメールアドレスは既に使用されています'));

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      register: registerMock,
    });

    // レンダリング
    render(<Register />);

    // 入力フィールドを取得
    const nameInput = screen.getByPlaceholderText('名前');
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード（8文字以上）');
    const confirmPasswordInput = screen.getByPlaceholderText('パスワード（確認）');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    // 入力を行う
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'テストユーザー',
        email: 'existing@example.com',
        password: 'password123',
        department: undefined,
      });
      expect(screen.getByText('このメールアドレスは既に使用されています')).toBeInTheDocument();
    });

    // ボタンのテキストが元に戻ることを確認
    expect(screen.getByRole('button')).toHaveTextContent('アカウント登録');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('部署が空の場合はundefinedとして送信されること', async () => {
    // 登録関数のモック
    const registerMock = jest.fn().mockResolvedValue(undefined);

    // useAuthのモック設定
    (useAuth as jest.Mock).mockReturnValue({
      register: registerMock,
    });

    // レンダリング
    render(<Register />);

    // 入力フィールドを取得
    const nameInput = screen.getByPlaceholderText('名前');
    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード（8文字以上）');
    const confirmPasswordInput = screen.getByPlaceholderText('パスワード（確認）');
    const submitButton = screen.getByRole('button', { name: 'アカウント登録' });

    // 入力を行う（部署は空のまま）
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // 検証
    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'テストユーザー',
        email: 'test@example.com',
        password: 'password123',
        department: undefined,
      });
    });
  });
});
