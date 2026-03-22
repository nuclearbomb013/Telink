/**
 * ForumEditPage - 编辑帖子页面
 *
 * 编辑已存在的帖子，仅作者可编辑
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Tags, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { forumService } from '@/services/forum.service';
import { userService } from '@/services/user.service';
import type { ForumCategory, ForumPost, UpdateForumPostData } from '@/services/forum.types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ImageUploader from '@/components/ImageUploader';

/**
 * 分类选项
 */
const categories: Array<{ value: ForumCategory; label: string; icon: string; description: string }> = [
  { value: 'general', label: '综合讨论', icon: '💬', description: '技术讨论、行业话题' },
  { value: 'help', label: '求助', icon: '❓', description: '遇到问题需要帮助' },
  { value: 'showcase', label: '作品展示', icon: '✨', description: '分享你的项目和作品' },
  { value: 'jobs', label: '招聘求职', icon: '💼', description: '工作机会、求职信息' },
];

/**
 * ForumEditPage 组件
 */
const ForumEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 用户状态
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; avatar?: string } | null>(null);

  // 帖子数据
  const [post, setPost] = useState<ForumPost | null>(null);

  // 表单状态
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ForumCategory>('general');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // UI 状态
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 图片上传模式：'upload' 或 'url'
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');

  /**
   * 检查登录状态并加载帖子数据
   */
  useEffect(() => {
    const user = userService.getCurrentUser();
    if (!user) {
      // 未登录，重定向到登录页
      navigate('/login', { state: { from: { pathname: `/forum/edit/${id}` } } });
      return;
    }
    setCurrentUser(user);

    // 加载帖子数据
    loadPost(parseInt(id || '0', 10));
  }, [id, navigate]);

  /**
   * 加载帖子数据
   */
  const loadPost = async (postId: number) => {
    if (!postId) return;

    setLoading(true);

    const response = await forumService.getPostById(postId);
    if (response.success && response.data) {
      const postData = response.data;

      // 检查是否是作者
      const isAuthor = currentUser?.id === postData.authorId;
      if (!isAuthor) {
        alert('您没有权限编辑此帖子');
        navigate(`/forum/${postData.slug}`, { replace: true });
        return;
      }

      setPost(postData);
      setTitle(postData.title);
      setCategory(postData.category);
      setContent(postData.content);
      setTags(postData.tags?.map(tag => `#${tag}`).join(' ') || '');
      setCoverImage(postData.coverImage || '');

      // 根据封面图片类型设置上传模式
      if (postData.coverImage) {
        if (postData.coverImage.startsWith('data:')) {
          setImageMode('upload');
        } else {
          setImageMode('url');
          setImageUrl(postData.coverImage);
        }
      }
    } else {
      alert('帖子不存在或加载失败');
      navigate('/forum', { replace: true });
    }

    setLoading(false);
  };

  /**
   * 验证表单
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (title.length < 5) {
      newErrors.title = '标题至少 5 个字符';
    } else if (title.length > 100) {
      newErrors.title = '标题不能超过 100 个字符';
    }

    if (!content.trim()) {
      newErrors.content = '内容不能为空';
    } else if (content.length < 20) {
      newErrors.content = '内容至少 20 个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理标签变化（自动添加 #）
   */
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const tagsArray = value.split(/\s+/).filter(Boolean);
    const formattedTags = tagsArray
      .map((tag) => tag.startsWith('#') ? tag : `#${tag}`)
      .slice(0, 5)
      .join(' ');
    setTags(formattedTags);
  };

  /**
   * 提交表单
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !post) return;

    setIsSubmitting(true);

    // 解析标签
    const tagArray = tags
      .split(/\s+/)
      .filter(Boolean)
      .map(tag => tag.replace('#', ''))
      .slice(0, 5);

    const updateData: UpdateForumPostData = {
      id: post.id,
      title: title.trim(),
      content: content.trim(),
      category,
      tags: tagArray,
      coverImage: coverImage || undefined,
    };

    const response = await forumService.updatePost(updateData);

    if (response.success && response.data) {
      // 更新成功，跳转到帖子详情页
      navigate(`/forum/${response.data.slug}`, { replace: true });
    } else {
      alert('更新失败：' + response.error?.message);
      setIsSubmitting(false);
    }
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    if (confirm('确定要放弃编辑吗？未保存的内容将会丢失。')) {
      navigate(`/forum/${post?.slug}`, { replace: true });
    }
  };

  // 加载中
  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-brand-border/20 rounded w-1/4" />
            <div className="h-4 bg-brand-border/20 rounded w-1/2" />
            <div className="h-64 bg-brand-border/20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[1000px] mx-auto px-6">
        {/* 返回按钮 */}
        <Link
          to={`/forum/${post.slug}`}
          className="inline-flex items-center gap-2 text-brand-dark-gray/70 hover:text-brand-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span className="font-roboto text-sm">返回帖子</span>
        </Link>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="font-oswald font-light text-3xl text-brand-text mb-2">
            编辑帖子
          </h1>
          <p className="font-roboto text-sm text-brand-dark-gray/70">
            修改您的帖子内容
          </p>
        </div>

        {/* 表单和预览切换 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-brand-dark-gray/60">
            <span>支持 Markdown 语法</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? (
              <>
                <EyeOff size={14} className="mr-2" />
                编辑
              </>
            ) : (
              <>
                <Eye size={14} className="mr-2" />
                预览
              </>
            )}
          </Button>
        </div>

        {/* 最后更新提示 */}
        {post.updatedAt && (
          <div className="mb-4 text-xs text-brand-dark-gray/60">
            最后更新于 {new Date(post.updatedAt).toLocaleString('zh-CN')}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* 标题 */}
            <div>
              <label htmlFor="title" className="block font-roboto font-medium text-sm text-brand-text mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                type="text"
                placeholder="请输入帖子标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* 分类选择 */}
            <div>
              <label className="block font-roboto font-medium text-sm text-brand-text mb-3">
                选择分类 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'p-4 rounded-lg border text-left transition-all',
                      category === cat.value
                        ? 'bg-brand-text text-white border-brand-text shadow-md'
                        : 'bg-white/50 text-brand-dark-gray border-brand-border/30 hover:border-brand-text/50'
                    )}
                  >
                    <div className="text-2xl mb-2" aria-hidden="true">{cat.icon}</div>
                    <div className="font-roboto font-medium text-sm">{cat.label}</div>
                    <div className={cn(
                      'font-roboto text-xs mt-1',
                      category === cat.value ? 'text-white/70' : 'text-brand-dark-gray/60'
                    )}>
                      {cat.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 内容 */}
            <div>
              <label htmlFor="content" className="block font-roboto font-medium text-sm text-brand-text mb-2">
                内容 <span className="text-red-500">*</span>
              </label>
              {isPreview ? (
                <Card className="min-h-[400px]">
                  <CardContent className="p-6">
                    <MarkdownRenderer content={content || '*暂无内容*'} />
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Textarea
                    id="content"
                    placeholder="写下你的想法...（支持 Markdown 语法）"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={cn(
                      'min-h-[300px] font-mono text-sm',
                      errors.content && 'border-red-500'
                    )}
                    disabled={isSubmitting}
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                  )}
                </>
              )}
            </div>

            {/* 标签 */}
            <div>
              <label htmlFor="tags" className="block font-roboto font-medium text-sm text-brand-text mb-2">
                标签（最多 5 个）
              </label>
              <div className="relative">
                <Tags
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                />
                <Input
                  id="tags"
                  type="text"
                  placeholder="#React #TypeScript #前端"
                  value={tags}
                  onChange={handleTagsChange}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-xs text-brand-dark-gray/60">
                按空格分隔，系统会自动添加 # 前缀
              </p>
            </div>

            {/* 封面图片（可选） */}
            <div>
              <label className="block font-roboto font-medium text-sm text-brand-text mb-2">
                封面图片（可选）
              </label>

              {/* 上传模式切换 */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setImageMode('upload');
                    if (coverImage && !coverImage.startsWith('data:')) {
                      setImageUrl(coverImage);
                      setCoverImage('');
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm font-roboto transition-colors',
                    imageMode === 'upload'
                      ? 'bg-brand-text text-white'
                      : 'bg-white/50 text-brand-dark-gray hover:bg-white/80 border border-brand-border/30'
                  )}
                >
                  <ImageIcon size={14} className="inline mr-1.5" />
                  上传图片
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageMode('url');
                    if (coverImage && coverImage.startsWith('data:')) {
                      setCoverImage('');
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm font-roboto transition-colors',
                    imageMode === 'url'
                      ? 'bg-brand-text text-white'
                      : 'bg-white/50 text-brand-dark-gray hover:bg-white/80 border border-brand-border/30'
                  )}
                >
                  <LinkIcon size={14} className="inline mr-1.5" />
                  图片链接
                </button>
              </div>

              {imageMode === 'upload' ? (
                <ImageUploader
                  value={coverImage}
                  onChange={setCoverImage}
                  maxSize={5}
                  placeholder="点击或拖拽上传封面图片"
                  disabled={isSubmitting}
                  previewHeight="h-56"
                />
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <LinkIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                    />
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setCoverImage(e.target.value);
                      }}
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                  {imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-brand-border/30">
                      <img
                        src={imageUrl}
                        alt="封面预览"
                        className="w-full h-56 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display = 'block';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <p className="mt-2 text-xs text-brand-dark-gray/60">
                {imageMode === 'upload'
                  ? '支持 JPG、PNG、GIF、WebP 格式，最大 5MB'
                  : '输入图片的完整 URL 地址'}
              </p>
            </div>

            {/* 提交按钮 */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-brand-border/30">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-text text-white hover:bg-brand-dark-gray px-8"
              >
                {isSubmitting ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForumEditPage;
