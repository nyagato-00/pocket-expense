import React, { ReactNode } from 'react';
import { IconType } from 'react-icons';

export interface ButtonProps {
  /** ボタンのラベル */
  label: string;
  /** クリック時の処理 */
  onClick?: () => void;
  /** ボタンの種類 */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'accent';
  /** ボタンのサイズ */
  size?: 'sm' | 'md' | 'lg';
  /** 無効化状態 */
  disabled?: boolean;
  /** 左側のアイコン */
  leftIcon?: IconType;
  /** 右側のアイコン */
  rightIcon?: IconType;
  /** 幅いっぱいに広げる */
  fullWidth?: boolean;
  /** 追加のクラス名 */
  className?: string;
  /** ボタンのタイプ */
  type?: 'button' | 'submit' | 'reset';
  /** 子要素 */
  children?: ReactNode;
}

/**
 * 基本的なボタンコンポーネント
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  className = '',
  type = 'button',
  children
}) => {
  // スタイルの設定
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 text-secondary-900 hover:bg-primary-700 focus:ring-primary-500';
      case 'secondary':
        return 'bg-secondary-200 text-secondary-800 hover:bg-secondary-300 focus:ring-secondary-500';
      case 'danger':
        return 'bg-danger-600 text-secondary-900 hover:bg-danger-700 focus:ring-danger-500';
      case 'success':
        return 'bg-success-600 text-secondary-900 hover:bg-success-700 focus:ring-success-500';
      case 'warning':
        return 'bg-warning-500 text-secondary-900 hover:bg-warning-600 focus:ring-warning-500';
      case 'accent':
        return 'bg-accent-600 text-secondary-900 hover:bg-accent-700 focus:ring-accent-500';
      default:
        return 'bg-primary-600 text-secondary-900 hover:bg-primary-700 focus:ring-primary-500';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const baseStyle = 'rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ease-in-out shadow-sm';
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      className={`${baseStyle} ${getVariantStyle()} ${getSizeStyle()} ${widthStyle} ${className} flex items-center justify-center`}
      onClick={onClick}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {LeftIcon && <LeftIcon className={`mr-2 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`} />}
      {children || label}
      {RightIcon && <RightIcon className={`ml-2 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`} />}
    </button>
  );
};

export default Button;
