import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

/**
 * Cover Image Uploader Component
 *
 * E-ink style cover image upload component with drag & drop support.
 * Features:
 * - Drag and drop upload
 * - Click to select
 * - Image preview
 * - Remove functionality
 * - File validation
 * - Loading state
 *
 * @example
 * ```tsx
 * <CoverImageUploader
 *   value={coverImage}
 *   onChange={setCoverImage}
 *   onError={handleError}
 * />
 * ```
 */
interface CoverImageUploaderProps {
  /** Current image data URL (controlled component) */
  value?: string | null;
  /** Callback when image is selected or removed */
  onChange: (imageData: string | null) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Label text */
  label?: string;
  /** Help text */
  helpText?: string;
}

/**
 * Validates if a file is an image and within size limits
 */
const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '请选择图片文件 (支持 JPG, PNG, GIF, WebP 格式)',
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '图片大小不能超过 5MB',
    };
  }

  return { valid: true };
};

const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  value,
  onChange,
  onError,
  disabled = false,
  label = '封面图片',
  helpText = '建议尺寸 1200x630 或 16:9 比例，最大 5MB',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file processing
   */
  const processFile = useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        const errorMsg = validation.error || '文件验证失败';
        setLocalError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setLocalError(null);
      setIsUploading(true);

      try {
        // Read file as data URL
        const reader = new FileReader();

        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            onChange(result);
            resolve();
          };
          reader.onerror = () => {
            reject(new Error('读取文件失败'));
          };
          reader.readAsDataURL(file);
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '读取文件失败，请稍后重试';
        setLocalError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, onError]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFile]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        await processFile(file);
      }
    },
    [disabled, processFile]
  );

  /**
   * Handle remove image
   */
  const handleRemove = useCallback(() => {
    onChange(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  /**
   * Handle click to upload
   */
  const handleClick = useCallback(() => {
    if (!disabled && !value) {
      fileInputRef.current?.click();
    }
  }, [disabled, value]);

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="font-roboto text-sm font-medium text-brand-text">
        {label}
      </label>

      {/* Upload area */}
      {value ? (
        /* Image preview */
        <div className="relative group">
          <div
            className="relative overflow-hidden rounded-lg border border-brand-border bg-brand-linen/30"
            style={{ aspectRatio: '16/9' }}
          >
            <img
              src={value}
              alt="封面预览"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="eager"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-white/90 backdrop-blur-sm rounded-full text-brand-text hover:bg-brand-text hover:text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                aria-label="移除封面图片"
              >
                <X size={20} />
              </button>
            </div>

            {/* Uploaded indicator */}
            <div className="absolute top-3 right-3 px-3 py-1.5 bg-brand-text/90 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              已上传
            </div>
          </div>

          {/* Image info */}
          <div className="mt-2 flex items-center justify-between">
            <p className="font-roboto text-xs text-brand-dark-gray/70">
              点击封面可移除
            </p>
            <button
              type="button"
              onClick={handleClick}
              disabled={disabled}
              className="font-roboto text-xs text-brand-text hover:text-brand-dark-gray transition-colors underline underline-offset-2"
            >
              更换图片
            </button>
          </div>
        </div>
      ) : (
        /* Upload placeholder */
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="点击或拖拽上传封面图片"
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-300 ease-out min-h-[200px] flex flex-col items-center justify-center
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isDragOver
              ? 'border-brand-text bg-brand-text/5 scale-[1.02]'
              : 'border-brand-border hover:border-brand-dark-gray hover:bg-brand-linen/30'
            }
            ${localError ? 'border-red-400 bg-red-50/30' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto border-2 border-brand-border border-t-brand-text rounded-full animate-spin" />
              <p className="font-roboto text-brand-dark-gray">正在上传图片...</p>
            </div>
          ) : (
            <>
              <div
                className={`
                  w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
                  transition-colors duration-300
                  ${isDragOver
                    ? 'bg-brand-text/20'
                    : 'bg-brand-linen/50'
                  }
                `}
              >
                {isDragOver ? (
                  <Upload className="w-8 h-8 text-brand-text" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-brand-dark-gray/50" />
                )}
              </div>

              <h4 className="font-roboto font-medium text-brand-text mb-1">
                {isDragOver ? '松开以上传' : '点击或拖拽上传'}
              </h4>

              <p className="font-roboto text-sm text-brand-dark-gray/70 mb-3">
                支持 JPG, PNG, GIF, WebP 格式
              </p>

              <p className="font-roboto text-xs text-brand-dark-gray/50">
                {helpText}
              </p>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {localError && (
        <div className="flex items-start gap-2 p-3 bg-red-50/50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="font-roboto text-sm text-red-700">{localError}</p>
        </div>
      )}
    </div>
  );
};

export default CoverImageUploader;
