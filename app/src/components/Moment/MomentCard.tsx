/**
 * MomentCard - 动态卡片组件
 *
 * 显示单条动态内容，包括作者信息、内容、图片、代码片段、点赞评论等
 * 遵循水墨/E-ink风格设计
 */

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Code, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/dateUtils';
import type { Moment, MomentImage, CodeSnippet } from '@/services/moment.types';
import UserAvatar from '@/components/Forum/UserAvatar';

export interface MomentCardProps {
  /** 动态数据 */
  moment: Moment;
  /** 当前用户 ID */
  currentUserId?: number;
  /** 点赞回调 */
  onLike?: (momentId: number) => void;
  /** 评论回调 */
  onComment?: (momentId: number) => void;
  /** 分享回调 */
  onShare?: (momentId: number) => void;
  /** 点击作者头像回调 */
  onAuthorClick?: (authorId: number) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 图片网格组件
 */
const ImageGrid = ({ images }: { images: MomentImage[] }) => {
  const count = images.length;

  // 单张图片 - 大图显示
  if (count === 1) {
    return (
      <div className="mt-3">
        <div className="relative overflow-hidden rounded-sm border border-brand-border/30">
          <img
            src={images[0].url}
            alt={images[0].caption || '动态图片'}
            className="w-full max-h-80 object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
            loading="lazy"
          />
          {images[0].caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-white text-sm font-roboto">{images[0].caption}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2-3张图片 - 横向排列
  if (count <= 3) {
    return (
      <div className="mt-3 flex gap-1">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="flex-1 relative overflow-hidden rounded-sm border border-brand-border/30 aspect-square"
          >
            <img
              src={img.url}
              alt={img.caption || `图片 ${index + 1}`}
              className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  // 4张图片 - 2x2 网格
  if (count === 4) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="relative overflow-hidden rounded-sm border border-brand-border/30 aspect-square"
          >
            <img
              src={img.url}
              alt={img.caption || `图片 ${index + 1}`}
              className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  // 5-9张图片 - 九宫格
  return (
    <div className="mt-3 grid grid-cols-3 gap-1">
      {images.slice(0, 9).map((img, index) => (
        <div
          key={img.id}
          className="relative overflow-hidden rounded-sm border border-brand-border/30 aspect-square"
        >
          <img
            src={img.url}
            alt={img.caption || `图片 ${index + 1}`}
            className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
            loading="lazy"
          />
          {index === 8 && count > 9 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-roboto">+{count - 9}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * 代码片段组件
 */
const CodeBlock = ({ snippet }: { snippet: CodeSnippet }) => {
  const [expanded, setExpanded] = useState(false);
  const lines = snippet.code.split('\n');
  const shouldTruncate = lines.length > 6;

  return (
    <div className="mt-3 bg-brand-text/5 border border-brand-border/20 rounded-sm overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-brand-border/20 bg-brand-linen/30">
        <div className="flex items-center gap-2">
          <Code size={14} className="text-brand-dark-gray" />
          <span className="font-roboto text-sm text-brand-dark-gray">
            {snippet.filename || snippet.language}
          </span>
        </div>
        <span className="text-xs text-brand-dark-gray/60 font-roboto">
          {snippet.language}
        </span>
      </div>

      {/* 代码内容 */}
      <pre
        className={cn(
          'p-3 overflow-x-auto font-mono text-sm text-brand-text',
          !expanded && shouldTruncate && 'max-h-40'
        )}
      >
        <code>
          {shouldTruncate && !expanded
            ? lines.slice(0, 6).join('\n') + '\n...'
            : snippet.code}
        </code>
      </pre>

      {/* 展开按钮 */}
      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-xs text-brand-dark-gray/60 hover:text-brand-text hover:bg-brand-linen/30 transition-colors font-roboto"
        >
          {expanded ? '收起' : `展开全部 (${lines.length} 行)`}
        </button>
      )}
    </div>
  );
};

/**
 * MomentCard 组件
 */
const MomentCard = ({
  moment,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onAuthorClick,
  className,
}: MomentCardProps) => {
  const [isLiked, setIsLiked] = useState(moment.isLiked || false);
  const [likeCount, setLikeCount] = useState(moment.likes);

  /**
   * 处理点赞
   */
  const handleLike = () => {
    if (!currentUserId) return;

    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(moment.id);
  };

  /**
   * 处理分享
   */
  const handleShare = async () => {
    onShare?.(moment.id);
  };

  return (
    <article
      className={cn(
        'bg-white/90 backdrop-blur-sm border border-brand-border/30 rounded-sm p-4 lg:p-5',
        'transition-all hover:border-brand-border/50',
        className
      )}
    >
      {/* 头部：作者信息 */}
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar
            username={moment.authorName}
            avatarUrl={moment.authorAvatar}
            size="md"
            clickable
            onClick={() => onAuthorClick?.(moment.authorId)}
          />
          <div>
            <h3 className="font-roboto font-medium text-brand-text">
              {moment.authorName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-brand-dark-gray/60">
              <time className="font-roboto">
                {formatRelativeTime(moment.createdAt)}
              </time>
              {moment.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin size={10} />
                    {moment.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 更多操作 */}
        <button
          className="p-1.5 rounded-sm text-brand-dark-gray/40 hover:text-brand-text hover:bg-brand-linen/50 transition-colors"
          aria-label="更多操作"
        >
          <MoreHorizontal size={18} />
        </button>
      </header>

      {/* 内容 */}
      <div className="mt-3">
        {/* 文字内容 */}
        <p className="font-roboto text-brand-text whitespace-pre-wrap break-words leading-relaxed">
          {moment.content}
        </p>

        {/* 图片 */}
        {moment.images && moment.images.length > 0 && (
          <ImageGrid images={moment.images} />
        )}

        {/* 代码片段 */}
        {moment.codeSnippet && (
          <CodeBlock snippet={moment.codeSnippet} />
        )}

        {/* 混合类型标记 */}
        {moment.contentType === 'mixed' && moment.images && moment.codeSnippet && (
          <div className="mt-2 flex items-center gap-2 text-xs text-brand-dark-gray/60">
            <span className="flex items-center gap-1">
              <ImageIcon size={12} />
              {moment.images.length} 张图片
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Code size={12} />
              代码片段
            </span>
          </div>
        )}
      </div>

      {/* 底部：操作栏 */}
      <footer className="mt-4 pt-3 border-t border-brand-border/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 点赞按钮 */}
          <button
            onClick={handleLike}
            disabled={!currentUserId}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-sm transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isLiked
                ? 'text-brand-text'
                : 'text-brand-dark-gray/60 hover:text-brand-text'
            )}
            aria-label={isLiked ? '取消点赞' : '点赞'}
            aria-pressed={isLiked}
          >
            <Heart
              size={18}
              className={cn(
                'transition-all',
                isLiked && 'fill-current scale-110'
              )}
            />
            <span className="font-roboto text-sm tabular-nums">{likeCount}</span>
          </button>

          {/* 评论按钮 */}
          <button
            onClick={() => onComment?.(moment.id)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-brand-dark-gray/60 hover:text-brand-text transition-colors"
            aria-label="评论"
          >
            <MessageCircle size={18} />
            <span className="font-roboto text-sm tabular-nums">{moment.commentCount}</span>
          </button>

          {/* 分享按钮 */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-brand-dark-gray/60 hover:text-brand-text transition-colors"
            aria-label="分享"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* 可见性标记 */}
        {moment.visibility !== 'public' && (
          <span className="text-xs text-brand-dark-gray/40 font-roboto">
            {moment.visibility === 'followers' ? '仅关注者可见' : '仅自己可见'}
          </span>
        )}
      </footer>
    </article>
  );
};

export default MomentCard;