/**
 * ForumPostPage - 帖子详情页
 *
 * 显示帖子完整内容、评论列表、回复功能
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Eye, Share2, Edit, Trash2, Pin, Lock, Unlock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';
import { forumService } from '@/services/forum.service';
import { commentService } from '@/services/comment.service';
import { userService } from '@/services/user.service';
import type { ForumPost } from '@/services/forum.types';
import type { Comment } from '@/services/comment.types';
import type { User, CurrentUser } from '@/services/user.types';
import { FORUM_CATEGORY_LABELS, FORUM_CATEGORY_ICONS } from '@/services/forum.types';
import UserAvatar from '@/components/Forum/UserAvatar';
import VoteButton from '@/components/Forum/VoteButton';
import ForumComment from '@/components/Forum/ForumComment';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * ForumPostPage 组件
 */
const ForumPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // 状态
  const [post, setPost] = useState<ForumPost | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 用户状态
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [hasLiked, setHasLiked] = useState(false);

  // 回复状态
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 加载数据
   */
  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;

      setLoading(true);

      // 获取当前用户
      const user = userService.getCurrentUser();
      setCurrentUser(user);

      // 加载帖子
      const postResponse = await forumService.getPostBySlug(slug);
      if (postResponse.success && postResponse.data) {
        const postData = postResponse.data;
        setPost(postData);

        // 加载作者信息
        const authorResponse = await userService.getUserById(postData.authorId);
        if (authorResponse.success && authorResponse.data) {
          setAuthor(authorResponse.data);
        }

        // 检查是否已点赞
        if (user) {
          const key = `techink_forum_likes_${user.id}`;
          const likedPosts = JSON.parse(localStorage.getItem(key) || '[]');
          setHasLiked(likedPosts.includes(postData.id));
        }

        // 加载评论
        const commentsResponse = await commentService.getComments({ postId: postData.id });
        if (commentsResponse.success && commentsResponse.data) {
          setComments(commentsResponse.data.comments);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [slug]);

  /**
   * 聚焦回复输入框
   */
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  /**
   * 处理点赞
   */
  const handleLike = async () => {
    if (!post || !currentUser) return;

    const response = await forumService.toggleLike(post.id, currentUser.id);
    if (response.success && response.data) {
      setHasLiked(response.data.liked);
      setPost({ ...post, likes: hasLiked ? post.likes - 1 : post.likes + 1 });
    }
  };

  /**
   * 处理分享
   */
  const handleShare = async () => {
    if (!post) return;

    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('链接已复制到剪贴板！');
    } catch {
      // 降级处理
      prompt('复制链接：', url);
    }
  };

  /**
   * 处理删除帖子
   */
  const handleDeletePost = async () => {
    if (!post || !currentUser) return;

    if (!confirm('确定要删除这个帖子吗？此操作不可恢复。')) return;

    const response = await forumService.deletePost(post.id);
    if (response.success) {
      navigate('/forum');
    } else {
      alert('删除失败：' + response.error?.message);
    }
  };

  /**
   * 处理置顶
   */
  const handleTogglePin = async () => {
    if (!post) return;

    const response = await forumService.togglePin(post.id);
    if (response.success && response.data) {
      setPost(response.data);
    }
  };

  /**
   * 处理锁定
   */
  const handleToggleLock = async () => {
    if (!post) return;

    const response = await forumService.toggleLock(post.id);
    if (response.success && response.data) {
      setPost(response.data);
    }
  };

  /**
   * 提交回复
   */
  const handleSubmitReply = async () => {
    if (!post || !currentUser || !replyContent.trim()) return;

    setSubmitting(true);

    const response = await commentService.createComment({
      postId: post.id,
      content: replyContent.trim(),
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      parentId: replyingTo?.id,
      replyToId: replyingTo?.id,
      replyToName: replyingTo?.name,
    });

    if (response.success && response.data) {
      // 更新评论列表
      setComments([...comments, response.data]);

      // 更新帖子回复数
      await forumService.incrementReplyCount(post.id);
      setPost({ ...post, replyCount: post.replyCount + 1 });

      // 重置状态
      setReplyContent('');
      setReplyingTo(null);
    } else {
      alert('发布失败：' + response.error?.message);
    }

    setSubmitting(false);
  };

  /**
   * 处理评论点赞
   * 使用 API 返回的实际点赞数更新 UI (P8-101)
   */
  const handleCommentLike = async (commentId: number) => {
    if (!currentUser) return;

    const response = await commentService.toggleLike(commentId, currentUser.id);
    if (response.success && response.data) {
      // P8-101: 使用 API 返回的实际点赞数，避免 UI 状态不一致
      const { likes } = response.data;
      setComments(prevComments =>
        prevComments.map((c) =>
          c.id === commentId
            ? { ...c, likes }
            : c
        )
      );
    }
  };

  /**
   * 处理评论删除
   */
  const handleCommentDelete = async (commentId: number) => {
    if (!post) return;

    const response = await commentService.deleteComment(commentId);
    if (response.success) {
      setComments(comments.filter((c) => c.id !== commentId));
      await forumService.decrementReplyCount(post.id);
      setPost({ ...post, replyCount: Math.max(0, post.replyCount - 1) });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-brand-border/20 rounded w-1/3" />
            <div className="h-64 bg-brand-border/20 rounded" />
            <div className="h-20 bg-brand-border/20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <h1 className="font-oswald text-2xl text-brand-text mb-4">帖子不存在</h1>
          <Button onClick={() => navigate('/forum')}>
            <ArrowLeft size={16} className="mr-2" />
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const isAuthor = currentUser?.id === post.authorId;
  const canModerate = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const categoryLabel = FORUM_CATEGORY_LABELS[post.category];
  const categoryIcon = FORUM_CATEGORY_ICONS[post.category];

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[1000px] mx-auto px-6">
        {/* 返回按钮 */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-brand-dark-gray/70 hover:text-brand-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span className="font-roboto text-sm">返回论坛</span>
        </Link>

        {/* 帖子内容 */}
        <article className="bg-white/90 backdrop-blur-sm border border-brand-border/30 rounded-lg overflow-hidden">
          {/* 帖子头部 */}
          <div className="p-6 lg:p-8 border-b border-brand-border/30">
            {/* 分类和状态 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-linen/50 text-brand-dark-gray text-sm rounded-full border border-brand-border/30">
                <span aria-hidden="true">{categoryIcon}</span>
                <span>{categoryLabel}</span>
              </span>

              {post.isPinned && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-text text-white text-sm rounded-full">
                  <Pin size={12} className="fill-current" />
                  <span>置顶</span>
                </span>
              )}

              {post.isLocked && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-dark-gray text-white text-sm rounded-full">
                  <Lock size={12} className="fill-current" />
                  <span>已锁定</span>
                </span>
              )}
            </div>

            {/* 标题 */}
            <h1 className="font-oswald font-light text-3xl lg:text-4xl text-brand-text mb-6 leading-tight">
              {post.title}
            </h1>

            {/* 作者信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  username={post.authorName}
                  avatarUrl={post.authorAvatar}
                  size="lg"
                  clickable
                  onClick={() => author && navigate(`/user/${author.id}`)}
                />
                <div>
                  <div className="font-roboto font-medium text-brand-text">
                    {post.authorName}
                  </div>
                  <div className="font-roboto text-xs text-brand-dark-gray/60">
                    {formatDate(post.createdAt, 'full')}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                {isAuthor && (
                  <>
                    <Link to={`/forum/edit/${post.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit size={14} className="mr-1" />
                        编辑
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeletePost}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}

                {canModerate && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleTogglePin}>
                      <Pin size={14} className={cn('mr-1', post.isPinned && 'fill-current')} />
                      {post.isPinned ? '取消置顶' : '置顶'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToggleLock}>
                      {post.isLocked ? (
                        <Unlock size={14} className="mr-1" />
                      ) : (
                        <Lock size={14} className="mr-1" />
                      )}
                      {post.isLocked ? '解锁' : '锁定'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 帖子正文 */}
          <div className="p-6 lg:p-8">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="px-6 lg:px-8 pb-6">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-brand-linen/50 text-brand-dark-gray text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 帖子统计 */}
          <div className="px-6 lg:px-8 py-4 bg-brand-linen/30 border-t border-brand-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* 点赞 */}
                <VoteButton
                  votes={post.likes}
                  hasVoted={hasLiked}
                  onVoteChange={handleLike}
                  size="md"
                  disabled={!currentUser || post.isLocked}
                />

                {/* 浏览数 */}
                <div className="flex items-center gap-2 text-brand-dark-gray/60">
                  <Eye size={18} />
                  <span className="font-roboto text-sm">{post.views} 次浏览</span>
                </div>

                {/* 回复数 */}
                <div className="flex items-center gap-2 text-brand-dark-gray/60">
                  <MessageSquare size={18} />
                  <span className="font-roboto text-sm">{post.replyCount} 条回复</span>
                </div>
              </div>

              {/* 分享 */}
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 size={16} className="mr-2" />
                分享
              </Button>
            </div>
          </div>
        </article>

        {/* 评论区域 */}
        <section className="mt-8 bg-white/90 backdrop-blur-sm border border-brand-border/30 rounded-lg p-6 lg:p-8">
          <h2 className="font-oswald text-xl text-brand-text mb-6 flex items-center gap-2">
            <MessageSquare size={20} />
            评论 ({post.replyCount})
          </h2>

          {/* 评论列表 */}
          {comments.length === 0 ? (
            <div className="text-center py-12 text-brand-dark-gray/60">
              暂无评论，来抢沙发吧！
            </div>
          ) : (
            <div className="divide-y divide-brand-border/30">
              {comments.map((comment) => (
                <ForumComment
                  key={comment.id}
                  comment={comment}
                  replies={comment.parentId ? [] : comments.filter(c => c.parentId === comment.id)}
                  onLike={handleCommentLike}
                  onReply={(c) => setReplyingTo({ id: c.id, name: c.authorName })}
                  onDelete={handleCommentDelete}
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}

          {/* 回复表单 */}
          <div className="mt-8 pt-6 border-t border-brand-border/30">
            <h3 className="font-oswald text-lg text-brand-text mb-4">
              {replyingTo ? `回复 @${replyingTo.name}` : '发表评论'}
            </h3>

            {currentUser ? (
              <>
                <Textarea
                  ref={replyInputRef}
                  placeholder={post.isLocked ? '帖子已锁定，无法回复' : '写下你的评论...'}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  disabled={post.isLocked || submitting}
                  className="min-h-[120px] mb-4"
                />

                <div className="flex items-center justify-between">
                  <div className="font-roboto text-xs text-brand-dark-gray/60">
                    支持 Markdown 语法
                  </div>
                  <div className="flex gap-2">
                    {replyingTo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        取消
                      </Button>
                    )}
                    <Button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || submitting || post.isLocked}
                      className="bg-brand-text text-white hover:bg-brand-dark-gray"
                    >
                      {submitting ? '发布中...' : '发布评论'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-brand-dark-gray/60">
                请登录后发表评论
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForumPostPage;
