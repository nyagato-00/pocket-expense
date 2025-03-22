import React from 'react';

export interface ButtonProps {
  /** ボタンのラベル */
  label: string;
  /** クリック時の処理 */
  onClick?: () => void;
  /** ボタンの種類 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 無効化状態 */
  disabled?: boolean;
}

/**
 * 基本的なボタンコンポーネント
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  // スタイルの設定
  const getStyle = () => {
    const baseStyle = 'px-4 py-2 rounded font-bold';
    
    switch (variant) {
      case 'primary':
        return `${baseStyle} bg-blue-500 text-white hover:bg-blue-700`;
      case 'secondary':
        return `${baseStyle} bg-gray-300 text-gray-800 hover:bg-gray-400`;
      case 'danger':
        return `${baseStyle} bg-red-500 text-white hover:bg-red-700`;
      default:
        return baseStyle;
    }
  };
  
  return (
    <button
      className={getStyle()}
      onClick={onClick}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {label}
    </button>
  );
};

export default Button;
