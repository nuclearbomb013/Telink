/**
 * ForumComment - 论坛评论组件
 *
 * 显示单条评论及其回复
 */

import { useState } from 'react';
import { MessageSquare, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { Comment } from '@/services/comment.types';
import UserAvatar from './UserAvatar';
import VoteButton from './VoteButton';

export interface ForumCommentProps {
  /** 评论数据 */
  comment: Comment;
  /** 是否是回复 */
  isReply?: boolean;
  /** 回复列表 */
  replies?: Comment[];
  /** 点赞回调 */
  onLike?: (commentId: number) => void;
  /** 回复回调 */
  onReply?: (comment: Comment) => void;
  /** 删除回调 */
  onDelete?: (commentId: number) => void;
  /** 当前用户 ID */
  currentUserId?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;

  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * ForumComment 组件
 */
const ForumComment = ({
  comment,
  isReply = false,
  replies = [],
  onLike,
  onReply,
  onDelete,
  currentUserId,
  className,
}: ForumCommentProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [showReplies, setShowReplies] = useState(false);

  const isAuthor = currentUserId === comment.authorId;

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    if (onLike) {
      onLike(comment.id);
    }
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply(comment);
    }
  };

  const handleDeleteClick = () => {
    if (confirm('确定要删除这条评论吗？')) {
      if (onDelete) {
        onDelete(comment.id);
      }
    }
  };

  return (
    <div
      className={cn(
        'flex gap-3 py-4',
        isReply ? 'border-l-2 border-brand-border/30 pl-4 ml-4' : 'border-b border-brand-border/30',
        className
      )}
    >
      {/* 头像 */}
      <div className="shrink-0">
        <UserAvatar
          username={comment.authorName}
          avatarUrl={comment.authorAvatar}
          size="sm"
        />
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {/* 评论头部 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-roboto font-medium text-sm text-brand-text">
              {comment.authorName}
            </span>
            {isAuthor && (
              <span className="px-1.5 py-0.5 bg-brand-text/10 text-brand-text text-xs rounded">
                作者
              </span>
            )}
            {comment.replyToName && (
              <>
                <span className="text-brand-light-gray text-xs">·</span>
                <span className="font-roboto text-xs text-brand-dark-gray/60">
                  回复 <span className="text-brand-text">@{comment.replyToName}</span>
                </span>
              </>
            )}
            <span className="font-roboto text-xs text-brand-light-gray">
              · {formatTime(comment.createdAt)}
            </span>
          </div>
        </div>

        {/* 评论内容 */}
        <div className="font-roboto text-sm text-brand-dark-gray leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-4 mt-3">
          {/* 点赞按钮 */}
          <VoteButton
            votes={likeCount}
            hasVoted={isLiked}
            onVoteChange={handleLike}
            size="sm"
            variant="outline"
          />

          {/* 回复按钮 */}
          <button
            type="button"
            className="inline-flex items-center gap-1 text-brand-dark-gray/60 hover:text-brand-text transition-colors"
            onClick={handleReplyClick}
          >
            <Reply size={14} />
            <span className="font-roboto text-xs">回复</span>
          </button>

          {/* 删除按钮（仅作者可见） */}
          {isAuthor && (
            <button
              type="button"
              className="ml-auto text-brand-light-gray hover:text-brand-text transition-colors text-xs"
              onClick={handleDeleteClick}
            >
              删除
            </button>
          )}
        </div>

        {/* 回复列表 */}
        {replies && replies.length > 0 && (
          <div className="mt-4">
            {!showReplies && replies.length > 1 && (
              <button
                type="button"
                className="flex items-center gap-1 text-brand-dark-gray/60 hover:text-brand-text transition-colors text-sm mb-2"
                onClick={() => setShowReplies(true)}
              >
                <MessageSquare size={14} />
                <span>查看全部 {replies.length} 条回复</span>
              </button>
            )}

            {(showReplies || replies.length <= 1) && (
              <div className="space-y-2">
                {replies.map((reply) => (
                  <ForumComment
                    key={reply.id}
                    comment={reply}
                    isReply
                    onLike={onLike}
                    onReply={onReply}
                    onDelete={onDelete}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumComment;
