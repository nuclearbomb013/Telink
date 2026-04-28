/**
 * ImageUploader - 图片上传组件
 */

import { useCallback, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadApi } from '@/lib/apiClient';

interface ImageUploaderProps {
  value?: string;
  onChange: (value: string) => void;
  maxSize?: number;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
  previewHeight?: string;
  className?: string;
}

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

  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = accept.split(',').map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      return `不支持该文件格式，请上传 ${allowedTypes
        .map((t) => t.split('/')[1].toUpperCase())
        .join('/')} 格式图片`;
    }

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `文件不能超过 ${maxSize}MB，当前为 ${sizeInMB.toFixed(2)}MB`;
    }

    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Upload file to server
      const response = await uploadApi.uploadImage(file);

      if (response.success && response.data) {
        // Use the returned URL
        onChange(response.data.url);
      } else {
        setError(response.error?.message || '上传失败，请重试');
      }
    } catch (err) {
      // 检测是否是网络连接错误（后端服务未运行）
      if (err instanceof TypeError) {
        setError('无法连接到服务器，请确认后端服务是否运行 (localhost:8000)');
      } else {
        setError('上传失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onChange, validateFile]);

  const handleClick = () => {
    if (disabled || isLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isLoading}
      />

      {value ? (
        <div className="relative group">
          <div
            className={cn(
              'relative rounded-lg overflow-hidden border border-brand-border/30 bg-white/50',
              previewHeight
            )}
          >
            <img
              src={value}
              alt="预览图片"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"%3E%3Crect fill="%23f5f5f5" width="240" height="140"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage load failed%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

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
                <p className="font-roboto text-sm text-brand-dark-gray/60">上传中...</p>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                    isDragging ? 'bg-brand-text/10' : 'bg-brand-linen'
                  )}
                >
                  {isDragging ? (
                    <ImageIcon size={24} className="text-brand-text" />
                  ) : (
                    <Upload size={24} className="text-brand-dark-gray/60" />
                  )}
                </div>
                <p
                  className={cn(
                    'font-roboto text-sm text-center',
                    isDragging ? 'text-brand-text' : 'text-brand-dark-gray/60'
                  )}
                >
                  {isDragging ? '松开以上传图片' : placeholder}
                </p>
                <p className="font-roboto text-xs text-brand-dark-gray/40 mt-1">
                  支持 JPG/PNG/GIF/WebP，最大 {maxSize}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

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

