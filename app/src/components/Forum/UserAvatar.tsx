/**
 * UserAvatar - 用户头像组件
 *
 * 显示用户头像，支持默认占位符
 */

import { cn } from '@/lib/utils';

export interface UserAvatarProps {
  /** 用户头像 URL */
  avatarUrl?: string | null;
  /** 用户名（用于生成默认头像和 aria-label） */
  username: string;
  /** 头像尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 是否显示在线状态 */
  isOnline?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 根据用户名生成默认头像颜色
 */
function getDefaultAvatarColor(username: string): string {
  const colors = [
    'bg-brand-text text-white',
    'bg-[#3a3a3a] text-white',
    'bg-[#4a4a4a] text-white',
    'bg-[#2a2a2a] text-white',
    'bg-[#5a5a5a] text-white',
  ];

  const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

/**
 * 获取用户名首字母
 */
function getInitials(username: string): string {
  // 如果是中文，取第一个字
  if (/[\u4e00-\u9fa5]/.test(username)) {
    const chineseChar = username.match(/[\u4e00-\u9fa5]/);
    if (chineseChar) return chineseChar[0];
  }
  // 否则取英文首字母
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.charAt(0).toUpperCase();
}

/**
 * 尺寸映射
 */
const sizeMap = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-14 h-14 text-lg',
};

/**
 * UserAvatar 组件
 */
const UserAvatar = ({
  avatarUrl,
  username,
  size = 'md',
  isOnline = false,
  clickable = false,
  onClick,
  className,
}: UserAvatarProps) => {
  const sizeClass = sizeMap[size];

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `查看 ${username} 的个人主页` : undefined}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden',
        sizeClass,
        clickable && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center font-oswald font-medium',
            getDefaultAvatarColor(username)
          )}
          aria-hidden="true"
        >
          {getInitials(username)}
        </div>
      )}

      {/* 在线状态指示器 */}
      {isOnline && (
        <span
          className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-green-500 rounded-full border-2 border-white"
          aria-label="在线"
        />
      )}
    </div>
  );
};

export default UserAvatar;
