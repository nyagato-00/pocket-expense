import React, { ReactNode } from 'react';

export interface CardProps {
  /** カードのタイトル */
  title?: string;
  /** カードの内容 */
  children: ReactNode;
  /** 追加のクラス名 */
  className?: string;
  /** カードのフッター */
  footer?: ReactNode;
  /** カードのヘッダーに表示するアクション */
  actions?: ReactNode;
  /** 影の強さ */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** 角丸の大きさ */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** パディングの大きさ */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** ボーダーの有無 */
  bordered?: boolean;
  /** 幅いっぱいに広げる */
  fullWidth?: boolean;
}

/**
 * カードコンポーネント
 */
export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  footer,
  actions,
  shadow = 'md',
  rounded = 'md',
  padding = 'md',
  bordered = false,
  fullWidth = false
}) => {
  // スタイルの設定
  const getShadowStyle = () => {
    switch (shadow) {
      case 'none':
        return '';
      case 'sm':
        return 'shadow-sm';
      case 'md':
        return 'shadow';
      case 'lg':
        return 'shadow-lg';
      case 'xl':
        return 'shadow-xl';
      default:
        return 'shadow';
    }
  };

  const getRoundedStyle = () => {
    switch (rounded) {
      case 'none':
        return '';
      case 'sm':
        return 'rounded-sm';
      case 'md':
        return 'rounded-md';
      case 'lg':
        return 'rounded-lg';
      case 'xl':
        return 'rounded-xl';
      default:
        return 'rounded-md';
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-2';
      case 'md':
        return 'p-4';
      case 'lg':
        return 'p-6';
      case 'xl':
        return 'p-8';
      default:
        return 'p-4';
    }
  };

  const borderStyle = bordered ? 'border border-gray-200' : '';
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <div className={`bg-white ${getShadowStyle()} ${getRoundedStyle()} ${borderStyle} ${widthStyle} overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className={getPaddingStyle()}>{children}</div>
      {footer && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
