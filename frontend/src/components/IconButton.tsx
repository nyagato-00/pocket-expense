import React from 'react';
import { IconType } from 'react-icons';

export interface IconButtonProps {
  /** アイコン */
  icon: IconType;
  /** クリック時の処理 */
  onClick?: () => void;
  /** ボタンの種類 */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'accent';
  /** ボタンのサイズ */
  size?: 'sm' | 'md' | 'lg';
  /** 無効化状態 */
  disabled?: boolean;
  /** ツールチップテキスト */
  tooltip?: string;
  /** 追加のクラス名 */
  className?: string;
  /** アクセシビリティのためのラベル */
  ariaLabel: string;
}

/**
 * アイコンのみのボタンコンポーネント
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  tooltip,
  className = '',
  ariaLabel
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
        return 'p-1.5 text-sm';
      case 'md':
        return 'p-2 text-base';
      case 'lg':
        return 'p-3 text-lg';
      default:
        return 'p-2 text-base';
    }
  };

  const baseStyle = 'rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ease-in-out shadow-sm flex items-center justify-center';
  
  return (
    <button
      type="button"
      className={`${baseStyle} ${getVariantStyle()} ${getSizeStyle()} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
      title={tooltip}
      aria-label={ariaLabel}
    >
      <Icon />
    </button>
  );
};

export default IconButton;
