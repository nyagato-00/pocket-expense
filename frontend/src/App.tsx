import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ExpenseList from './pages/ExpenseList';
import ExpenseForm from './pages/ExpenseForm';
import ExpenseDetail from './pages/ExpenseDetail';

// 保護されたルートコンポーネント
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 認証状態の読み込み中
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">読み込み中...</div>;
  }

  // 認証されていない場合はログインページにリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // 認証されている場合は子コンポーネントを表示
  return <>{children}</>;
};

// 認証済みユーザー向けルート（既にログインしている場合はダッシュボードへリダイレクト）
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 認証状態の読み込み中
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">読み込み中...</div>;
  }

  // 認証されている場合はダッシュボードにリダイレクト
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // 認証されていない場合は子コンポーネントを表示
  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* 認証ルート */}
        <Route path="/login" element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        } />
        <Route path="/register" element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        } />

        {/* 保護されたルート */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute>
            <ExpenseList />
          </ProtectedRoute>
        } />
        <Route path="/expenses/new" element={
          <ProtectedRoute>
            <ExpenseForm />
          </ProtectedRoute>
        } />
        <Route path="/expenses/:id" element={
          <ProtectedRoute>
            <ExpenseDetail />
          </ProtectedRoute>
        } />
        <Route path="/expenses/:id/edit" element={
          <ProtectedRoute>
            <ExpenseForm />
          </ProtectedRoute>
        } />

        {/* デフォルトルート */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
