/**
 * PixelAvatarConverter - 像素头像转换器
 *
 * 将上传的图片转换为 128×128 四级灰度的像素风格头像
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, ArrowRight, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  convertImageToPixelGrid,
  pixelGridToPreviewDataURL,
  dataURLtoFile,
  DEFAULT_GRID_SIZE,
  DEFAULT_CONTRAST,
  type PixelGrid,
} from '@/lib/pixelArtUtils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface PixelAvatarConverterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File) => void;
}

const PREVIEW_SIZE = 256; // 像素预览边长

const PixelAvatarConverter: React.FC<PixelAvatarConverterProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [pixelPreview, setPixelPreview] = useState<string | null>(null);
  const [contrast, setContrast] = useState(DEFAULT_CONTRAST);
  const [pixelGrid, setPixelGrid] = useState<PixelGrid | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const currentFileRef = useRef<File | null>(null);

  // 转换图片
  const convertImage = useCallback(async (file: File, ctr: number) => {
    setIsConverting(true);
    try {
      const grid = await convertImageToPixelGrid(file, DEFAULT_GRID_SIZE, ctr);
      setPixelGrid(grid);
      const previewURL = pixelGridToPreviewDataURL(grid, PREVIEW_SIZE);
      setPixelPreview(previewURL);
    } catch (error) {
      console.error('Failed to convert image:', error);
    } finally {
      setIsConverting(false);
    }
  }, []);

  // 关闭并重置
  const handleClose = useCallback(() => {
    setOriginalImage(null);
    setPixelPreview(null);
    setPixelGrid(null);
    currentFileRef.current = null;
    setContrast(DEFAULT_CONTRAST);
    onOpenChange(false);
  }, [onOpenChange]);

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }

      currentFileRef.current = file;

      // 显示原图预览
      const reader = new FileReader();
      reader.onload = (e) => setOriginalImage(e.target?.result as string);
      reader.readAsDataURL(file);

      await convertImage(file, contrast);
    },
    [contrast, convertImage]
  );

  // 处理对比度变化
  const handleContrastChange = useCallback(
    async (value: number[]) => {
      const newContrast = value[0];
      setContrast(newContrast);
      if (currentFileRef.current && !isConverting) {
        await convertImage(currentFileRef.current, newContrast);
      }
    },
    [isConverting, convertImage]
  );

  // 确认使用
  const handleConfirm = useCallback(() => {
    if (!pixelGrid) return;
    const previewURL = pixelGridToPreviewDataURL(pixelGrid, DEFAULT_GRID_SIZE);
    const file = dataURLtoFile(previewURL, 'pixel-avatar.png');
    onConfirm(file);
    handleClose();
  }, [pixelGrid, onConfirm, handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl">像素头像转换器</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 上传区域 */}
          <div className="flex flex-col items-center">
            <label
              htmlFor="pixel-avatar-upload"
              className={cn(
                'flex flex-col items-center justify-center w-full h-32',
                'border-2 border-dashed border-brand-border/50 rounded-lg',
                'cursor-pointer hover:border-brand-text/50 hover:bg-brand-linen/30',
                'transition-colors duration-200'
              )}
            >
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="原图预览"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center text-brand-dark-gray/60">
                  <Upload size={32} className="mb-2" />
                  <span className="font-roboto text-sm">点击上传图片</span>
                  <span className="font-roboto text-xs mt-1">支持 JPG, PNG, GIF, WebP</span>
                </div>
              )}
            </label>
            <input
              id="pixel-avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 预览对比 */}
          {originalImage && pixelPreview && (
            <div className="flex items-center justify-center gap-6">
              {/* 原图 */}
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-lg overflow-hidden border border-brand-border/30 bg-brand-linen/50">
                  <img
                    src={originalImage}
                    alt="原图"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-roboto text-xs text-brand-dark-gray/60 mt-1">原图</span>
              </div>

              {/* 箭头 */}
              <ArrowRight size={24} className="text-brand-dark-gray/40" />

              {/* 像素化后 */}
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-lg overflow-hidden border border-brand-border/30 bg-brand-linen/50 flex items-center justify-center">
                  {isConverting ? (
                    <Loader2 size={24} className="animate-spin text-brand-dark-gray/40" />
                  ) : (
                    <img
                      src={pixelPreview}
                      alt="像素头像"
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                </div>
                <span className="font-roboto text-xs text-brand-dark-gray/60 mt-1">
                  128×128 像素
                </span>
              </div>
            </div>
          )}

          {/* 对比度调节 */}
          {originalImage && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="contrast" className="font-roboto text-sm">
                  对比度
                </Label>
                <span className="font-roboto text-sm text-brand-dark-gray/60">
                  {contrast}%
                </span>
              </div>
              <Slider
                id="contrast"
                min={20}
                max={200}
                step={1}
                value={[contrast]}
                onValueChange={handleContrastChange}
                className="w-full"
              />
              <p className="font-roboto text-xs text-brand-dark-gray/50">
                调节对比度可改变像素化效果，&lt;100 更柔和，&gt;100 更锐利
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!pixelGrid || isConverting}>
            使用此头像
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PixelAvatarConverter;
