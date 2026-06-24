/**
 * ForumPostPage - 帖子详情页
 *
 * 主帖使用阅读布局（ReaderLayout），评论区保持紧凑论坛结构。
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Eye, Share2, Edit, Trash2, Pin, Lock, Unlock, Heart } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';
import { compileMarkdown } from '@/lib/markdownCompiler';
import { PostDetailSkeleton } from '@/components/Forum/LoadingSkeleton';
import { forumService } from '@/services/forum.service';
import { commentService } from '@/services/comment.service';
import { userService } from '@/services/user.service';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useHistory } from '@/hooks/useHistory';
import { useReadingHistoryPosition } from '@/hooks/useReadingHistoryPosition';
import type { ForumPost } from '@/services/forum.types';
import type { Comment } from '@/services/comment.types';
import type { User } from '@/services/user.types';
import { FORUM_CATEGORY_LABELS, FORUM_CATEGORY_ICONS } from '@/services/forum.types';
import UserAvatar from '@/components/Forum/UserAvatar';
import VoteButton from '@/components/Forum/VoteButton';
import ForumComment from '@/components/Forum/ForumComment';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  ReaderLayout,
  TableOfContents,
  ReadingProgress,
  ReaderPreferences,
  ImageViewer,
  MobileReadingBar,
} from '@/components/reader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const ForumPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addFavorite, removeFavoriteByContent, checkFavorite } = useFavorites();
  const { addToHistory } = useHistory();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ src: string; alt: string; caption?: string } | null>(null);

  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [commentTab, setCommentTab] = useState<'write' | 'preview'>('write');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const cancelledRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      setLoading(true);
      cancelledRef.current = false;

      const postResponse = await forumService.getPostBySlug(slug);
      if (cancelledRef.current) return;
      if (postResponse.success && postResponse.data) {
        const postData = postResponse.data;
        setPost(postData);

        // Record to history
        addToHistory('post', postData.id, postData.title, postData.slug);

        // Check if favorited
        const fav = currentUser ? await checkFavorite('post', postData.id) : false;
        if (!cancelledRef.current) setFavorited(fav);

        const authorResponse = await userService.getUserById(postData.authorId);
        if (cancelledRef.current) return;
        if (authorResponse.success && authorResponse.data) {
          setAuthor(authorResponse.data);
        }

        if (currentUser) {
          const key = `techink_forum_likes_${currentUser.id}`;
          try {
            const raw = localStorage.getItem(key);
            const likedPosts = raw ? JSON.parse(raw) : [];
            setHasLiked(Array.isArray(likedPosts) && likedPosts.includes(postData.id));
          } catch {
            setHasLiked(false);
          }
        }

        const commentsResponse = await commentService.getComments({ postId: postData.id });
        if (cancelledRef.current) return;
        if (commentsResponse.success && commentsResponse.data) {
          setComments(commentsResponse.data.comments);
        }
      }
      if (!cancelledRef.current) setLoading(false);
    };
    loadData();
    return () => { cancelledRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when slug or user identity changes
  }, [slug, currentUser?.id]);

  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  const markdownDocument = useMemo(() => {
    if (!post?.content) return null;
    return compileMarkdown(post.content);
  }, [post?.content]);

  const handleImageClick = useCallback((src: string, alt: string, caption?: string) => {
    setViewerImage({ src, alt, caption });
  }, []);

  useReadingHistoryPosition({
    contentType: 'post',
    contentId: post?.id ?? null,
    enabled: Boolean(post),
  });

  const handleLike = async () => {
    if (!post || !currentUser) return;
    const response = await forumService.toggleLike(post.id, currentUser.id);
    if (response.success && response.data) {
      setHasLiked(response.data.liked);
      const newLikes = response.data.likes ?? (response.data.liked ? post.likes + 1 : post.likes - 1);
      setPost({ ...post, likes: newLikes });
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('链接已复制到剪贴板');
    } catch {
      showToast('复制失败，请手动复制');
    }
  };

  const handleFavorite = async () => {
    if (!post || !currentUser) return;
    if (favorited) {
      const ok = await removeFavoriteByContent('post', post.id);
      if (ok) setFavorited(false);
    } else {
      const ok = await addFavorite('post', post.id, post.title);
      if (ok) setFavorited(true);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !currentUser) return;
    setConfirmDeleteId(post.id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const response = await forumService.deletePost(confirmDeleteId);
    setConfirmDeleteId(null);
    if (response.success) navigate('/forum');
    else showToast('删除失败：' + (response.error?.message || '未知错误'));
  };

  const handleTogglePin = async () => {
    if (!post) return;
    const response = await forumService.togglePin(post.id);
    if (response.success && response.data) {
      setPost(prev => prev ? { ...prev, isPinned: response.data!.isPinned } : null);
    }
  };

  const handleToggleLock = async () => {
    if (!post) return;
    const response = await forumService.toggleLock(post.id);
    if (response.success && response.data) {
      setPost(prev => prev ? { ...prev, isLocked: response.data!.isLocked } : null);
    }
  };

  const handleSubmitReply = async () => {
    if (!post || !currentUser || !replyContent.trim()) return;
    setReplyError(null);
    setSubmitting(true);

    try {
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
        const newComment = response.data;
        if (newComment.parentId) {
          setComments(prevComments =>
            prevComments.map((c) =>
              c.id === newComment.parentId
                ? { ...c, replies: [...(c.replies || []), newComment] }
                : c,
            ),
          );
        } else {
          setComments(prev => [...prev, newComment]);
        }
        setPost({ ...post, replyCount: post.replyCount + 1 });
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setReplyError(response.error?.message || '发布失败，请稍后重试');
      }
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : '网络错误，请检查连接后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (!currentUser) return;
    const response = await commentService.toggleLike(commentId, currentUser.id);
    if (response.success && response.data) {
      const { likes } = response.data;
      const updateLikes = (items: Comment[]): Comment[] =>
        items.map((c) => ({
          ...c,
          likes: c.id === commentId ? likes : c.likes,
          replies: c.replies ? updateLikes(c.replies) : c.replies,
        }));
      setComments(prev => updateLikes(prev));
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!post) return;
    const response = await commentService.deleteComment(commentId);
    if (response.success) {
      const removeComment = (items: Comment[]): Comment[] =>
        items
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: c.replies ? removeComment(c.replies) : c.replies,
          }));
      setComments(prev => removeComment(prev));
      setPost(prev => prev ? { ...prev, replyCount: Math.max(0, prev.replyCount - 1) } : null);
    }
  };

  if (loading) {
    return (
      <div className="reader-shell">
        <div className="reader-container mx-auto px-6 py-16">
          <PostDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="reader-shell">
        <div className="reader-container mx-auto px-6 py-16 text-center">
          <h1 className="reader-section-title text-2xl mb-4">帖子不存在</h1>
          <Button onClick={() => navigate('/forum')}>
            <ArrowLeft size={16} className="mr-2" />返回列表
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
    <>
      <ReadingProgress />
      <ReaderLayout
        sidebarLeft={
          <div>
            <Link to="/forum" className="reader-meta-back">
              <ArrowLeft size={14} />返回论坛
            </Link>
            <div>
              <div className="reader-meta-label">作者</div>
              <div className="reader-meta-value">
                <div className="flex items-center gap-1.5">
                  <UserAvatar username={post.authorName} avatarUrl={post.authorAvatar} size="sm" clickable onClick={() => author && navigate(`/user/${author.id}`)} />
                  {post.authorName}
                </div>
              </div>
            </div>
            <div>
              <div className="reader-meta-label">发布于</div>
              <div className="reader-meta-value">{formatDate(post.createdAt, 'long')}</div>
            </div>
            <div>
              <div className="reader-meta-label">浏览</div>
              <div className="reader-meta-value">{post.views} 次</div>
            </div>
          </div>
        }
        sidebarRight={
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[var(--reader-ink-secondary)]">工具</span>
              <ReaderPreferences />
            </div>
            {markdownDocument && markdownDocument.toc.length > 0 && (
              <TableOfContents items={markdownDocument.toc} />
            )}
          </div>
        }
        mobileBar={
          <MobileReadingBar toc={markdownDocument?.toc || []} />
        }
      >
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 text-xs uppercase tracking-wider text-[var(--reader-ink-secondary)] border border-[var(--reader-line)]">
              {categoryIcon} {categoryLabel}
            </span>
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 text-xs bg-black text-white">
                <Pin size={12} fill="currentColor" />置顶
              </span>
            )}
            {post.isLocked && (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 text-xs bg-gray-600 text-white">
                <Lock size={12} fill="currentColor" />已锁定
              </span>
            )}
          </div>
          <h1 className="reader-title">{post.title}</h1>
        </div>

        <div className="mt-8">
          <MarkdownRenderer
            document={markdownDocument ?? undefined}
            mode="reader"
            onImageClick={handleImageClick}
          />
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[var(--reader-line)]">
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="px-3 py-1 text-sm text-[var(--reader-ink-secondary)] border border-[var(--reader-line)]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </ReaderLayout>

      {/* Actions bar OUTSIDE reader layout */}
      <div style={{ backgroundColor: 'var(--reader-bg)' }}>
        <div className="mx-auto px-6 pb-8" style={{ maxWidth: 'calc(var(--reader-content-width, 720px) + 120px)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-[var(--reader-line)]">
            <div className="flex items-center gap-4">
              <VoteButton
                votes={post.likes}
                hasVoted={hasLiked}
                onVoteChange={handleLike}
                size="md"
                disabled={!currentUser || post.isLocked}
              />
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--reader-ink-secondary)' }}>
                <Eye size={16} />{post.views} 次浏览
              </div>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--reader-ink-secondary)' }}>
                <MessageSquare size={16} />{post.replyCount} 条回复
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthor && (
                <>
                  <Link to={`/forum/edit/${post.id}`}>
                    <Button variant="outline" size="sm"><Edit size={14} className="mr-1" />编辑</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleDeletePost} className="text-red-600 hover:text-red-700">
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
                    {post.isLocked ? <Unlock size={14} className="mr-1" /> : <Lock size={14} className="mr-1" />}
                    {post.isLocked ? '解锁' : '锁定'}
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleFavorite} disabled={!currentUser}>
                <Heart size={16} className={cn('mr-2', favorited && 'fill-current text-red-500')} />
                {favorited ? '已收藏' : '收藏'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 size={16} className="mr-2" />分享
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div style={{ backgroundColor: 'var(--reader-bg)' }}>
        <section className="mx-auto px-4 sm:px-6 pb-20" style={{ maxWidth: 'calc(var(--reader-content-width, 720px) + 120px)' }}>
          <h2 className="reader-section-title text-xl mb-6 flex items-center gap-2">
            <MessageSquare size={20} />评论 ({post.replyCount})
          </h2>

          {comments.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed" style={{ color: 'var(--reader-ink-secondary)', borderColor: 'var(--reader-line, #CFCEC4)' }}>
              暂无评论，来抢沙发吧！
            </div>
          ) : (
            <div>
              {comments.filter(c => !c.parentId).map(comment => (
                <ForumComment
                  key={comment.id}
                  comment={comment}
                  replies={comment.replies || comments.filter(c => c.parentId === comment.id)}
                  onLike={handleCommentLike}
                  onReply={(c) => setReplyingTo({ id: c.id, name: c.authorName })}
                  onDelete={handleCommentDelete}
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}

          <div className="mt-8 rounded-xl border p-4 lg:p-6" style={{ background: 'var(--card-bg, #F2F0E8)', borderColor: 'var(--reader-line, #CFCEC4)' }}>
            <h3 className="reader-section-title text-lg mb-4">
              {replyingTo ? `回复 @${replyingTo.name}` : '发表评论'}
            </h3>

            {currentUser ? (
              <>
                <div className="flex items-center gap-1 mb-3 border-b" style={{ borderColor: 'var(--reader-line, #CFCEC4)' }}>
                  <button
                    type="button"
                    onClick={() => setCommentTab('write')}
                    className={cn(
                      'px-3 py-1.5 text-sm transition-colors border-b-2 -mb-px',
                      commentTab === 'write'
                        ? 'font-medium'
                        : 'opacity-60 hover:opacity-100',
                    )}
                    style={{
                      color: commentTab === 'write' ? 'var(--reader-ink, #242722)' : 'var(--reader-ink-secondary, #62675F)',
                      borderColor: commentTab === 'write' ? 'var(--reader-green, #315B48)' : 'transparent',
                    }}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentTab('preview')}
                    className={cn(
                      'px-3 py-1.5 text-sm transition-colors border-b-2 -mb-px',
                      commentTab === 'preview'
                        ? 'font-medium'
                        : 'opacity-60 hover:opacity-100',
                    )}
                    style={{
                      color: commentTab === 'preview' ? 'var(--reader-ink, #242722)' : 'var(--reader-ink-secondary, #62675F)',
                      borderColor: commentTab === 'preview' ? 'var(--reader-green, #315B48)' : 'transparent',
                    }}
                  >
                    预览
                  </button>
                </div>

                {commentTab === 'write' ? (
                  <Textarea
                    ref={replyInputRef}
                    placeholder={post.isLocked ? '帖子已锁定，无法回复' : '写下你的评论...'}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={post.isLocked || submitting}
                    className="min-h-[120px] mb-4 rounded-lg border-[var(--reader-line,#CFCEC4)] focus:border-[var(--reader-green,#315B48)] focus:ring-2 focus:ring-[rgba(49,91,72,0.15)]"
                  />
                ) : (
                  <div
                    className="min-h-[120px] mb-4 rounded-lg border p-3 overflow-y-auto"
                    style={{
                      borderColor: 'var(--reader-line, #CFCEC4)',
                      background: 'rgba(255,255,255,0.4)',
                      fontSize: '15px',
                      lineHeight: '1.75',
                      color: 'var(--reader-ink, #242722)',
                    }}
                  >
                    {replyContent.trim() ? (
                      <MarkdownRenderer content={replyContent} mode="preview" />
                    ) : (
                      <span style={{ color: 'var(--reader-ink-secondary, #62675F)' }}>暂无可预览的内容</span>
                    )}
                  </div>
                )}

                {replyError && (
                  <div className="mb-3 text-sm rounded-lg border px-3 py-2" role="alert"
                    style={{ color: 'rgb(185,28,28)', borderColor: 'rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.04)' }}>
                    {replyError}
                  </div>
                )}
                {post.isLocked && !replyError && (
                  <div className="mb-3 text-sm rounded-lg border px-3 py-2"
                    style={{ color: 'var(--reader-ink-secondary)', borderColor: 'var(--reader-line)', background: 'rgba(242,240,232,0.5)' }}>
                    帖子已锁定，无法回复
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--reader-ink-secondary)' }}>支持 Markdown 语法 · 代码块可高亮</span>
                  <div className="flex gap-2">
                    {replyingTo && (
                      <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyContent(''); }}>取消</Button>
                    )}
                    <Button onClick={handleSubmitReply} disabled={!replyContent.trim() || submitting || post.isLocked}>
                      {submitting ? '发布中...' : '发布评论'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 rounded-lg border border-dashed" style={{ borderColor: 'var(--reader-line)', color: 'var(--reader-ink-secondary)' }}>
                <p className="mb-4">请登录后发表评论</p>
                <Link to="/login"><Button>登录</Button></Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {viewerImage && (
        <ImageViewer
          src={viewerImage.src}
          alt={viewerImage.alt}
          caption={viewerImage.caption}
          onClose={() => setViewerImage(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 text-sm shadow-lg border border-[var(--reader-line)]" style={{ background: 'var(--reader-bg)', color: 'var(--reader-ink)' }} role="status" aria-live="polite">
          {toast}
          <button className="ml-3 opacity-60 hover:opacity-100" onClick={() => setToast(null)} aria-label="关闭">×</button>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="p-6 max-w-md mx-4 shadow-2xl border border-[var(--reader-line)]" style={{ background: 'var(--reader-bg)' }}>
            <h3 className="text-lg mb-2" style={{ color: 'var(--reader-ink)' }}>确认删除？</h3>
            <p className="mb-6 text-sm" style={{ color: 'var(--reader-ink-secondary)' }}>此操作将永久删除该帖子，无法撤销。</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-500 text-white text-sm transition-colors hover:bg-red-600">删除</button>
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2 border border-[var(--reader-line)] text-sm transition-colors" style={{ color: 'var(--reader-ink)' }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ForumPostPage;
