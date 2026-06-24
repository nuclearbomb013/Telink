/**
 * ForumComment - 论坛评论组件
 *
 * 顶级评论为独立暖纸卡片，子回复使用引导线布局。
 */

import { useState } from 'react';
import { MessageSquare, Heart, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/dateUtils';

import type { Comment } from '@/services/comment.types';
import UserAvatar from './UserAvatar';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export interface ForumCommentProps {
  comment: Comment;
  isReply?: boolean;
  depth?: number;
  replies?: Comment[];
  onLike?: (commentId: number) => void;
  onReply?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  currentUserId?: number;
  className?: string;
}

const ForumComment = ({
  comment,
  isReply = false,
  depth = 0,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAuthor = currentUserId === comment.authorId;
  const visualDepth = Math.min(depth, 1);

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike?.(comment.id);
  };

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const confirmDelete = () => {
    onDelete?.(comment.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={cn(
        isReply
          ? cn(
              'reply-thread relative',
              visualDepth === 0 && 'ml-0 pl-4 border-l-2 border-[rgba(49,91,72,0.2)]',
              visualDepth >= 1 && 'ml-0 pl-4 border-l-2 border-[rgba(49,91,72,0.12)]',
            )
          : 'comment-card mb-3',
        className,
      )}
    >
      <div
        className={cn(
          isReply
            ? 'bg-[rgba(242,240,232,0.5)] rounded-md p-3'
            : cn(
                'bg-[var(--card-bg)] border border-[var(--reader-line,#CFCEC4)] rounded-xl p-4 lg:p-5',
                'shadow-[0_4px_18px_rgb(36_39_34_/_0.06)]',
                'transition-all duration-200 hover:border-[rgba(49,91,72,0.2)]',
              ),
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar
              username={comment.authorName}
              avatarUrl={comment.authorAvatar}
              size="sm"
            />
            <span className="font-medium text-sm truncate" style={{ color: 'var(--reader-ink, #242722)' }}>
              {comment.authorName}
            </span>
            {isAuthor && (
              <span className="shrink-0 px-1.5 py-0.5 text-[11px] rounded-sm font-medium border"
                style={{
                  background: 'rgba(49,91,72,0.08)',
                  color: 'var(--reader-green, #315B48)',
                  borderColor: 'rgba(49,91,72,0.2)',
                }}>
                作者
              </span>
            )}
            {comment.replyToName && (
              <span className="text-xs truncate" style={{ color: 'var(--reader-ink-secondary, #62675F)' }}>
                回复 @{comment.replyToName}
              </span>
            )}
          </div>
          <span className="shrink-0 text-xs ml-2" style={{ color: 'var(--reader-ink-secondary, #62675F)' }}>
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {/* Content */}
        <div
          className="comment-body break-words"
          style={{
            fontSize: '15px',
            lineHeight: '1.75',
            color: 'var(--reader-ink, #242722)',
          }}
        >
          <MarkdownRenderer content={comment.content} mode="preview" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3">
          <button
            type="button"
            onClick={handleLike}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
              isLiked
                ? 'text-[var(--reader-green,#315B48)] bg-[rgba(49,91,72,0.06)]'
                : 'hover:bg-[rgba(49,91,72,0.04)]',
            )}
            style={{ color: isLiked ? 'var(--reader-green, #315B48)' : 'var(--reader-ink-secondary, #62675F)' }}
          >
            <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => onReply?.(comment)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors hover:bg-[rgba(49,91,72,0.04)]"
            style={{ color: 'var(--reader-ink-secondary, #62675F)' }}
          >
            <MessageSquare size={13} />
            <span>回复</span>
          </button>

          {isAuthor && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors hover:bg-[rgba(220,38,38,0.06)]"
              style={{ color: 'var(--reader-ink-secondary, #62675F)' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mt-2 p-2 rounded-md text-xs border flex items-center gap-2" style={{ borderColor: 'rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.04)' }}>
            <span style={{ color: 'rgb(185,28,28)' }}>确认删除？</span>
            <button onClick={confirmDelete} className="px-2 py-0.5 rounded-sm text-white bg-red-600 hover:bg-red-700 transition-colors">删除</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-0.5 rounded-sm border transition-colors" style={{ borderColor: 'var(--reader-line, #CFCEC4)' }}>取消</button>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {replies && replies.length > 0 && (
        <div className="mt-2">
          {!showReplies && replies.length > 1 && (
            <button
              type="button"
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors hover:bg-[rgba(49,91,72,0.04)]"
              style={{ color: 'var(--reader-green, #315B48)' }}
            >
              <MessageSquare size={12} />
              查看全部 {replies.length} 条回复
            </button>
          )}

          {(showReplies || replies.length <= 1) && (
            <div className={cn(replies.length > 1 && 'mt-2')}>
              {replies.map(reply => (
                <ForumComment
                  key={reply.id}
                  comment={reply}
                  isReply
                  depth={depth + 1}
                  replies={reply.replies}
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
  );
};

export default ForumComment;
