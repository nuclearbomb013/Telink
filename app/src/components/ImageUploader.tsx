/**
 * ImageUploader - 图片上传组件
 *
 * 支持点击上传、拖拽上传、图片预览、大小限制
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 图片上传组件属性
 */
interface ImageUploaderProps {
  /** 当前图片 URL 或 base64 */
  value?: string;
  /** 图片变化回调 */
  onChange: (value: string) => void;
  /** 最大文件大小（MB），默认 5MB */
  maxSize?: number;
  /** 允许的文件类型 */
  accept?: string;
  /** 占位文字 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 预览图高度 */
  previewHeight?: string;
  /** 额外的类名 */
  className?: string;
}

/**
 * ImageUploader 组件
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  maxSize = 5,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  placeholder = '点击或拖拽上传图片',
  disabled = false,
  previewHeight = 'h-48',
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 验证文件
   */
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    const allowedTypes = accept.split(',').map(t => t.trim());
    if (!allowedTypes.includes(file.type)) {
      return `不支持的文件格式，请上传 ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join('/')} 格式的图片`;
    }

    // 检查文件大小
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `文件大小不能超过 ${maxSize}MB，当前文件大小为 ${sizeInMB.toFixed(2)}MB`;
    }

    return null;
  }, [accept, maxSize]);

  /**
   * 处理文件
   */
  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // 验证文件
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // 将图片转换为 base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError('读取文件失败，请重试');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError('处理文件失败，请重试');
      setIsLoading(false);
    }
  }, [validateFile, onChange]);

  /**
   * 处理点击上传
   */
  const handleClick = () => {
    if (disabled || isLoading) return;
    fileInputRef.current?.click();
  };

  /**
   * 处理文件选择
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // 重置 input 以便可以重复选择同一文件
    e.target.value = '';
  };

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragging(true);
    }
  };

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * 处理拖拽放置
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * 清除图片
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
  };

  /**
   * 处理粘贴（预留功能）
   * Note: 此功能为未来扩展预留，暂未启用
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
        }
        break;
      }
    }
  }, [handleFile]);

  // 监听粘贴事件
  // Note: 需要在组件挂载时添加监听器

  return (
    <div className={cn('relative', className)}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isLoading}
      />

      {/* 上传区域 */}
      {value ? (
        // 预览模式
        <div className="relative group">
          <div className={cn(
            'relative rounded-lg overflow-hidden border border-brand-border/30 bg-white/50',
            previewHeight
          )}>
            <img
              src={value}
              alt="预览图片"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f5f5f5" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="12" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3E图片加载失败%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* 操作按钮 */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleClick}
                className="p-2 bg-white rounded-full text-brand-text hover:bg-brand-linen transition-colors"
                title="重新上传"
              >
                <Upload size={18} />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
                title="删除图片"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      ) : (
        // 上传模式
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-all cursor-pointer',
            previewHeight,
            isDragging
              ? 'border-brand-text bg-brand-text/5'
              : 'border-brand-border/50 bg-white/30 hover:border-brand-text/50 hover:bg-white/50',
            (disabled || isLoading) && 'cursor-not-allowed opacity-60'
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            {isLoading ? (
              <>
                <div className="w-8 h-8 border-2 border-brand-text/30 border-t-brand-text rounded-full animate-spin mb-3" />
                <p className="font-roboto text-sm text-brand-dark-gray/60">
                  上传中...
                </p>
              </>
            ) : (
              <>
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                  isDragging ? 'bg-brand-text/10' : 'bg-brand-linen'
                )}>
                  {isDragging ? (
                    <ImageIcon size={24} className="text-brand-text" />
                  ) : (
                    <Upload size={24} className="text-brand-dark-gray/60" />
                  )}
                </div>
                <p className={cn(
                  'font-roboto text-sm text-center',
                  isDragging ? 'text-brand-text' : 'text-brand-dark-gray/60'
                )}>
                  {isDragging ? '松开以上传图片' : placeholder}
                </p>
                <p className="font-roboto text-xs text-brand-dark-gray/40 mt-1">
                  支持 JPG、PNG、GIF、WebP，最大 {maxSize}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="absolute -bottom-8 left-0 right-0 flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;