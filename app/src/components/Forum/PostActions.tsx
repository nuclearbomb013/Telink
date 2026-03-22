/**
 * PostActions - 帖子操作按钮组件
 *
 * 提供分享、收藏、点赞、订阅等社交功能
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Share2,
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageSquare,
  Eye,
  Check,
  Copy,
  Twitter,
  Facebook,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * 帖子操作属性
 */
interface PostActionsProps {
  /** 帖子 ID */
  postId?: number;
  /** 帖子标题 */
  postTitle: string;
  /** 帖子 URL */
  postUrl: string;
  /** 是否已收藏 */
  isFavorite?: boolean;
  /** 是否已点赞 */
  isLiked?: boolean;
  /** 点赞数量 */
  likeCount?: number;
  /** 评论数量 */
  commentCount?: number;
  /** 浏览数量 */
  viewCount?: number;
  /** 收藏回调 */
  onToggleFavorite?: () => void;
  /** 点赞回调 */
  onToggleLike?: () => void;
  /** 分享回调 */
  onShare?: () => void;
}

/**
 * PostActions 组件
 */
export function PostActions({
  postId: _postId,
  postTitle,
  postUrl,
  isFavorite = false,
  isLiked = false,
  likeCount = 0,
  commentCount = 0,
  viewCount = 0,
  onToggleFavorite,
  onToggleLike,
  onShare,
}: PostActionsProps) {
  // 本地状态
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 同步 props 到内部状态
  useEffect(() => {
    setLocalFavorite(isFavorite);
  }, [isFavorite]);

  useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLocalLikeCount(likeCount);
  }, [likeCount]);

  /**
   * 处理收藏切换
   */
  const handleToggleFavorite = useCallback(() => {
    setLocalFavorite(!localFavorite);
    onToggleFavorite?.();
  }, [localFavorite, onToggleFavorite]);

  /**
   * 处理点赞切换
   */
  const handleToggleLike = useCallback(() => {
    const newLiked = !localLiked;
    setLocalLiked(newLiked);
    setLocalLikeCount((prev) => prev + (newLiked ? 1 : -1));
    onToggleLike?.();
  }, [localLiked, onToggleLike]);

  /**
   * 处理分享
   */
  const handleShare = useCallback(() => {
    onShare?.();
    setShowShareMenu(true);
  }, [onShare]);

  /**
   * 复制链接
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  }, [postUrl]);

  /**
   * 分享到社交媒体
   */
  const shareToSocial = useCallback((platform: string) => {
    const encodedTitle = encodeURIComponent(postTitle);
    const encodedUrl = encodeURIComponent(postUrl);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'weibo':
        shareUrl = `https://service.weibo.com/share/share.php?title=${encodedTitle}&url=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }, [postTitle, postUrl]);

  /**
   * 使用 Web Share API 分享
   */
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          url: postUrl,
        });
      } catch (error) {
        console.error('分享失败:', error);
      }
    } else {
      handleCopyLink();
    }
  }, [postTitle, postUrl, handleCopyLink]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* 统计数据 */}
        <div className="flex items-center gap-4 mr-4 text-sm text-brand-dark-gray/60">
          {viewCount > 0 && (
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {viewCount}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={14} />
              {commentCount}
            </span>
          )}
          {localLikeCount > 0 && (
            <span className="flex items-center gap-1 text-brand-dark-gray/60">
              <Heart size={14} />
              {localLikeCount}
            </span>
          )}
        </div>

        {/* 点赞按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleLike}
              className={cn(
                'h-9 px-3 transition-colors',
                localLiked
                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                  : 'text-brand-dark-gray hover:text-red-500'
              )}
            >
              <Heart size={16} className={cn(localLiked && 'fill-current')} />
              <span className="ml-2 hidden sm:inline">
                {localLiked ? '已点赞' : '点赞'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{localLiked ? '取消点赞' : '点赞此帖子'}</p>
          </TooltipContent>
        </Tooltip>

        {/* 收藏按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className={cn(
                'h-9 px-3 transition-colors',
                localFavorite
                  ? 'text-brand-text hover:bg-brand-linen'
                  : 'text-brand-dark-gray hover:text-brand-text'
              )}
            >
              {localFavorite ? (
                <BookmarkCheck size={16} />
              ) : (
                <Bookmark size={16} />
              )}
              <span className="ml-2 hidden sm:inline">
                {localFavorite ? '已收藏' : '收藏'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{localFavorite ? '取消收藏' : '收藏此帖子'}</p>
          </TooltipContent>
        </Tooltip>

        {/* 分享按钮 */}
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-9 px-3 text-brand-dark-gray hover:text-brand-text"
              >
                <Share2 size={16} />
                <span className="ml-2 hidden sm:inline">分享</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>分享此帖子</p>
            </TooltipContent>
          </Tooltip>

          {/* 分享菜单 */}
          {showShareMenu && (
            <>
              {/* 遮罩 */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowShareMenu(false)}
              />

              {/* 菜单面板 */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-brand-border/30 z-50 overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-dark-gray hover:bg-brand-linen rounded transition-colors"
                  >
                    <Share2 size={16} />
                    <span>分享</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-dark-gray hover:bg-brand-linen rounded transition-colors"
                  >
                    {copySuccess ? (
                      <>
                        <Check size={16} className="text-green-500" />
                        <span className="text-green-600">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>复制链接</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="border-t border-brand-border/30 p-2">
                  <p className="px-3 py-1 text-xs text-brand-light-gray">分享到社交平台</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => shareToSocial('twitter')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Twitter size={16} />
                      Twitter
                    </button>
                    <button
                      onClick={() => shareToSocial('facebook')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Facebook size={16} />
                      Facebook
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * 简化版操作按钮（用于列表项）
 */
interface PostActionsLiteProps {
  postId: number;
  commentCount?: number;
  likeCount?: number;
  viewCount?: number;
}

export function PostActionsLite({
  commentCount = 0,
  likeCount = 0,
  viewCount = 0,
}: PostActionsLiteProps) {
  return (
    <div className="flex items-center gap-4 text-xs text-brand-dark-gray/60">
      {viewCount > 0 && (
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {viewCount}
        </span>
      )}
      {commentCount > 0 && (
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {commentCount}
        </span>
      )}
      {likeCount > 0 && (
        <span className="flex items-center gap-1">
          <Heart size={12} />
          {likeCount}
        </span>
      )}
    </div>
  );
}

export default PostActions;
