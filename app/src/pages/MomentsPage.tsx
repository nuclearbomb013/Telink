/**
 * MomentsPage - 动态主页
 *
 * 显示动态流，支持发布、点赞、评论等功能
 * 遵循水墨/E-ink风格设计
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Users, ChevronUp, Image, X, Send, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadApi } from '@/lib/apiClient';

import { useMoments } from '@/hooks/useMoments';
import { useAuth } from '@/hooks/useAuth';
import { momentService } from '@/services/moment.service';
import type { CurrentUser } from '@/services/user.types';
import type { MomentImage, MomentComment } from '@/services/moment.types';

import MomentCard from '@/components/Moment/MomentCard';
import UserAvatar from '@/components/Forum/UserAvatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * 排序选项
 */
type SortOption = 'newest' | 'popular';

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: '最新' },
  { value: 'popular', label: '热门' },
];

/**
 * 单个图片上传状态
 */
interface ImageUploadState {
  id: number;
  file: File;
  localPreview: string;  // 本地预览 URL (用于显示)
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  uploadedUrl?: string;  // 上传成功后的服务器 URL
  error?: string;
}

/**
 * 发布动态弹窗组件
 */
const CreateMomentModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, images: MomentImage[]) => void;
  isSubmitting: boolean;
}) => {
  const [content, setContent] = useState('');
  const [imageStates, setImageStates] = useState<ImageUploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /**
   * 上传单个图片到后端
   */
  const uploadSingleImage = async (imageState: ImageUploadState): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const response = await uploadApi.uploadImage(imageState.file);

      if (response.success && response.data) {
        return { success: true, url: response.data.url };
      } else {
        return {
          success: false,
          error: response.error?.message || '上传失败，请重试'
        };
      }
    } catch (err) {
      if (err instanceof TypeError) {
        return { success: false, error: '无法连接到服务器，请确认后端服务是否运行' };
      }
      return { success: false, error: '上传失败，请重试' };
    }
  };

  /**
   * 处理图片选择 - 立即开始上传
   */
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 9;
    const availableSlots = maxImages - imageStates.length;
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    if (filesToProcess.length === 0) return;

    // 验证文件大小 (最大 5MB)
    const maxSizeMB = 5;
    const validFiles = filesToProcess.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      return sizeMB <= maxSizeMB;
    });

    if (validFiles.length < filesToProcess.length) {
      // 有些文件超过大小限制
      const oversizedCount = filesToProcess.length - validFiles.length;
      console.warn(`${oversizedCount} 张图片超过 5MB 限制，已跳过`);
    }

    if (validFiles.length === 0) return;

    // 创建初始状态并显示本地预览
    const newImageStates: ImageUploadState[] = validFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      localPreview: URL.createObjectURL(file),  // 本地预览
      uploadStatus: 'uploading',
    }));

    setImageStates(prev => [...prev, ...newImageStates]);

    // 逐个上传图片
    for (const imageState of newImageStates) {
      const result = await uploadSingleImage(imageState);

      // 更新状态为 success 或 error
      setImageStates(prev =>
        prev.map(img =>
          img.id === imageState.id
            ? {
              ...img,
              uploadStatus: result.success ? 'success' : 'error',
              uploadedUrl: result.url,
              error: result.error,
            }
            : img
        )
      );
    }

    // 清空 input 以便再次选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 移除图片
   */
  const removeImage = (id: number) => {
    setImageStates(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.localPreview) {
        URL.revokeObjectURL(img.localPreview);  // 清理预览 URL
      }
      return prev.filter(i => i.id !== id);
    });
  };

  /**
   * 重试上传失败的图片
   */
  const retryUpload = async (id: number) => {
    const imageState = imageStates.find(img => img.id === id);
    if (!imageState || imageState.uploadStatus !== 'error') return;

    setImageStates(prev =>
      prev.map(img =>
        img.id === id
          ? { ...img, uploadStatus: 'uploading', error: undefined }
          : img
      )
    );

    const result = await uploadSingleImage(imageState);

    setImageStates(prev =>
      prev.map(img =>
        img.id === id
          ? {
            ...img,
            uploadStatus: result.success ? 'success' : 'error',
            uploadedUrl: result.url,
            error: result.error,
          }
          : img
      )
    );
  };

  /**
   * 提交表单 - 等待所有图片上传完成
   */
  const handleSubmit = async () => {
    // 检查是否有图片正在上传
    const hasUploading = imageStates.some(img => img.uploadStatus === 'uploading');
    if (hasUploading) {
      return;
    }

    // 检查是否有上传失败的图片
    const hasErrors = imageStates.some(img => img.uploadStatus === 'error');
    if (hasErrors) {
      alert('有图片上传失败，请先处理');
      return;
    }

    // 转换为 MomentImage 格式
    const momentImages: MomentImage[] = imageStates
      .filter(img => img.uploadStatus === 'success' && img.uploadedUrl)
      .map((img, index) => ({
        id: img.id,
        url: img.uploadedUrl!,
        sortOrder: index,
      }));

    onSubmit(content, momentImages);

    // 清理本地预览 URL
    imageStates.forEach(img => {
      if (img.localPreview) {
        URL.revokeObjectURL(img.localPreview);
      }
    });

    setContent('');
    setImageStates([]);
  };

  // 计算状态
  const hasUploadingImages = imageStates.some(img => img.uploadStatus === 'uploading');
  const hasFailedImages = imageStates.some(img => img.uploadStatus === 'error');
  const hasSuccessfulImages = imageStates.some(img => img.uploadStatus === 'success');
  const canSubmit = (content.trim() || hasSuccessfulImages) && !hasUploadingImages && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-lg mx-4 bg-white border border-brand-border/30 rounded-sm shadow-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-brand-border/30 flex items-center justify-between shrink-0">
          <h2 className="font-oswald text-lg text-brand-text">发布动态</h2>
          <button
            onClick={onClose}
            className="p-1 text-brand-dark-gray/60 hover:text-brand-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 overflow-y-auto flex-1">
          <Textarea
            placeholder="分享你的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none border-brand-border/30 focus:border-brand-text"
            autoFocus
          />

          {/* 图片预览 */}
          {imageStates.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {imageStates.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-sm overflow-hidden border border-brand-border/30"
                >
                  {/* 本地预览图片 */}
                  <img
                    src={img.localPreview}
                    alt="预览"
                    className={cn(
                      "w-full h-full object-cover grayscale contrast-125",
                      img.uploadStatus === 'error' && "opacity-50"
                    )}
                  />

                  {/* 上传状态指示器 */}
                  {img.uploadStatus === 'uploading' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={20} className="text-white animate-spin" />
                    </div>
                  )}

                  {img.uploadStatus === 'success' && (
                    <div className="absolute bottom-1 right-1 p-0.5 bg-green-500 rounded-full">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                  )}

                  {img.uploadStatus === 'error' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                      <AlertCircle size={16} className="text-red-400" />
                      <button
                        onClick={() => retryUpload(img.id)}
                        className="text-xs text-white underline"
                      >
                        重试
                      </button>
                    </div>
                  )}

                  {/* 删除按钮 */}
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-sm hover:bg-black/70 transition-colors"
                    disabled={img.uploadStatus === 'uploading'}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 图片数量和状态提示 */}
          {imageStates.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-brand-dark-gray/60 font-roboto">
                已选择 {imageStates.length}/9 张图片
                {hasUploadingImages && ` · 正在上传...`}
                {hasFailedImages && ` · ${imageStates.filter(i => i.uploadStatus === 'error').length} 张失败`}
              </p>
              {hasFailedImages && (
                <p className="text-xs text-red-500 font-roboto">
                  请点击失败图片重试，或删除后重新选择
                </p>
              )}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-4 py-3 border-t border-brand-border/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* 图片上传按钮 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={imageStates.length >= 9 || hasUploadingImages}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageStates.length >= 9 || hasUploadingImages}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all text-sm font-roboto',
                imageStates.length >= 9 || hasUploadingImages
                  ? 'text-brand-dark-gray/30 cursor-not-allowed'
                  : 'text-brand-dark-gray/60 hover:text-brand-text hover:bg-brand-linen/50'
              )}
            >
              <Image size={16} />
              图片
            </button>
            <span className="text-xs text-brand-dark-gray/40 font-roboto">
              {content.length}/500
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-brand-text text-white hover:bg-brand-dark-gray"
            >
              {isSubmitting
                ? '发布中...'
                : hasUploadingImages
                  ? '等待上传...'
                  : hasFailedImages
                    ? '有上传失败'
                    : '发布'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 评论弹窗组件
 */
const CommentModal = ({
  isOpen,
  onClose,
  momentId,
  currentUserId,
  currentUser,
  onCommentAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  momentId: number;
  currentUserId: number;
  currentUser: CurrentUser;
  onCommentAdded: () => void;
}) => {
  const [comments, setComments] = useState<MomentComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  /**
   * 加载评论列表
   */
  const loadComments = async () => {
    setIsLoading(true);
    const response = await momentService.getComments(momentId);
    if (response.success && response.data) {
      setComments(response.data);
    }
    setIsLoading(false);
  };

  /**
   * 加载评论
   */
  useEffect(() => {
    if (isOpen && momentId) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadComments intentionally excluded; defined inside component, would cause re-renders
  }, [isOpen, momentId]);

  /**
   * 滚动到底部
   */
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  /**
   * 提交评论
   */
  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const response = await momentService.addComment(
      momentId,
      newComment.trim(),
      currentUserId,
      currentUser.username,
      currentUser.avatar
    );

    if (response.success && response.data) {
      setComments(prev => [...prev, response.data!]);
      setNewComment('');
      onCommentAdded();
    }
    setIsSubmitting(false);
  };

  /**
   * 格式化时间
   * 直接使用 Date.now() 获取当前时间，确保时间显示准确
   */
  const formatTime = useCallback((timestamp: number) => {
    const currentTime = Date.now();
    const diff = currentTime - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full sm:max-w-md bg-white border border-brand-border/30 rounded-t-sm sm:rounded-sm shadow-lg max-h-[70vh] flex flex-col">
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-brand-border/30 flex items-center justify-between shrink-0">
          <h3 className="font-oswald text-lg text-brand-text">评论 ({comments.length})</h3>
          <button
            onClick={onClose}
            className="p-1 text-brand-dark-gray/60 hover:text-brand-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 评论列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin text-brand-text">
                <span className="inline-block w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full" />
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-brand-dark-gray/60">
              暂无评论，快来抢沙发吧！
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar
                  username={comment.authorName}
                  avatarUrl={comment.authorAvatar}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-roboto text-sm font-medium text-brand-text">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-brand-dark-gray/40">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-brand-dark-gray font-roboto">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="px-4 py-3 border-t border-brand-border/30 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="写评论..."
              className="flex-1 px-3 py-2 border border-brand-border/30 rounded-sm text-sm font-roboto focus:outline-none focus:border-brand-text"
              disabled={isSubmitting}
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className={cn(
                'px-4 py-2 rounded-sm transition-colors',
                newComment.trim() && !isSubmitting
                  ? 'bg-brand-text text-white hover:bg-brand-dark-gray'
                  : 'bg-brand-border/30 text-brand-dark-gray/40 cursor-not-allowed'
              )}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MomentsPage 组件
 */
const MomentsPage = () => {
  const navigate = useNavigate();

  // 用户状态 - 使用全局认证状态
  const { user: currentUser } = useAuth();

  // 排序和筛选
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [followingOnly, setFollowingOnly] = useState(false);

  // 发布弹窗
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 评论弹窗
  const [commentMomentId, setCommentMomentId] = useState<number | null>(null);

  // 返回顶部按钮
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 动态 Hook
  const {
    moments,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    total,
    loadMore,
    refresh,
    createMoment,
    toggleLike,
  } = useMoments({
    currentUserId: currentUser?.id,
    followingOnly,
    sortBy,
    limit: 10,
  });

  /**
   * 滚动监听
   */
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      // 无限滚动
      if (
        scrollContainerRef.current &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !isLoadingMore &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore, loadMore]);

  /**
   * 处理发布动态
   */
  const handleCreateMoment = async (content: string, images: MomentImage[]) => {
    if (!currentUser || (!content.trim() && images.length === 0)) return;

    setIsSubmitting(true);

    const response = await createMoment(
      { content: content.trim(), images: images.length > 0 ? images : undefined },
      currentUser.id,
      currentUser.username,
      currentUser.avatar
    );

    if (response.success) {
      setShowCreateModal(false);
    }

    setIsSubmitting(false);
  };

  /**
   * 处理点赞
   */
  const handleLike = useCallback(
    async (momentId: number) => {
      if (!currentUser) return;
      await toggleLike(momentId, currentUser.id);
    },
    [currentUser, toggleLike]
  );

  /**
   * 处理评论
   */
  const handleComment = useCallback((momentId: number) => {
    setCommentMomentId(momentId);
  }, []);

  /**
   * 处理分享
   */
  const handleShare = useCallback(async (momentId: number) => {
    const url = `${window.location.origin}/moments/${momentId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('链接已复制到剪贴板！');
    } catch {
      prompt('复制链接：', url);
    }
  }, []);

  /**
   * 处理作者点击
   */
  const handleAuthorClick = useCallback(
    (authorId: number) => {
      navigate(`/user/${authorId}`);
    },
    [navigate]
  );

  /**
   * 返回顶部
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[680px] mx-auto px-4 lg:px-6">
        {/* 头部：标题和发布按钮 */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-oswald font-light text-3xl text-brand-text">
              动态
            </h1>
            <p className="text-sm text-brand-dark-gray/60 font-roboto mt-1">
              {total} 条动态
            </p>
          </div>

          <Button
            onClick={() => {
              if (currentUser) {
                setShowCreateModal(true);
              } else {
                navigate('/login');
              }
            }}
            className="bg-brand-text text-white hover:bg-brand-dark-gray"
          >
            <Plus size={18} className="mr-1.5" />
            发布动态
          </Button>
        </header>

        {/* 筛选栏 */}
        <div className="mb-6 flex items-center gap-4 p-3 bg-white/90 backdrop-blur-sm border border-brand-border/30 rounded-sm">
          {/* 排序 */}
          <div className="flex items-center gap-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-roboto rounded-sm transition-all',
                  sortBy === option.value
                    ? 'bg-brand-text text-white'
                    : 'text-brand-dark-gray/60 hover:text-brand-text hover:bg-brand-linen/50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-brand-border/30" />

          {/* 仅看关注 */}
          <button
            onClick={() => setFollowingOnly(!followingOnly)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-roboto rounded-sm transition-all',
              followingOnly
                ? 'bg-brand-text text-white'
                : 'text-brand-dark-gray/60 hover:text-brand-text hover:bg-brand-linen/50'
            )}
          >
            <Users size={14} />
            仅看关注
          </button>

          {/* 刷新 */}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="ml-auto p-1.5 text-brand-dark-gray/60 hover:text-brand-text hover:bg-brand-linen/50 rounded-sm transition-all disabled:opacity-50"
            aria-label="刷新"
          >
            <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* 动态列表 */}
        <div ref={scrollContainerRef} className="space-y-4">
          {/* 加载中 */}
          {isLoading && moments.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-brand-text">
                <RefreshCw size={24} />
              </div>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="text-center py-12 text-brand-dark-gray/60">
              <p className="font-roboto">{error}</p>
              <Button variant="outline" onClick={refresh} className="mt-4">
                重试
              </Button>
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && !error && moments.length === 0 && (
            <div className="text-center py-12 bg-white/90 border border-brand-border/30 rounded-sm">
              <p className="font-roboto text-brand-dark-gray/60">
                {followingOnly ? '还没有关注的用户发布动态' : '暂无动态'}
              </p>
              {!followingOnly && currentUser && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-brand-text text-white hover:bg-brand-dark-gray"
                >
                  发布第一条动态
                </Button>
              )}
            </div>
          )}

          {/* 动态卡片列表 */}
          {moments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              currentUserId={currentUser?.id}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onAuthorClick={handleAuthorClick}
            />
          ))}

          {/* 加载更多 */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin text-brand-text">
                <RefreshCw size={20} />
              </div>
            </div>
          )}

          {/* 没有更多 */}
          {!isLoading && !isLoadingMore && !hasMore && moments.length > 0 && (
            <div className="text-center py-6 text-brand-dark-gray/40 text-sm font-roboto">
              没有更多了
            </div>
          )}
        </div>
      </div>

      {/* 发布弹窗 */}
      <CreateMomentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMoment}
        isSubmitting={isSubmitting}
      />

      {/* 评论弹窗 */}
      {commentMomentId && currentUser && (
        <CommentModal
          isOpen={true}
          onClose={() => setCommentMomentId(null)}
          momentId={commentMomentId}
          currentUserId={currentUser.id}
          currentUser={currentUser}
          onCommentAdded={refresh}
        />
      )}

      {/* 返回顶部按钮 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={cn(
            'fixed bottom-8 right-8 p-3',
            'bg-brand-text text-white',
            'rounded-sm shadow-lg',
            'hover:bg-brand-dark-gray transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
          )}
          aria-label="返回顶部"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
};

export default MomentsPage;