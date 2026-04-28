/**
 * Pixel Art Utilities - 像素画转换工具函数
 *
 * 将图片转换为 4 级灰度的像素风格头像
 */

/** 像素画 4 级灰度颜色定义 (符合墨水屏风格) */
export const PIXEL_COLORS = {
  BLACK:      '#1a1a1a',  // 3 - brand-text
  DARK_GRAY:  '#666666',  // 2
  LIGHT_GRAY: '#bbbbbb',  // 1
  WHITE:      '#f5f5f0',  // 0 - brand-linen
} as const;

/** 像素网格大小 (宽高相等) */
export const DEFAULT_GRID_SIZE = 128;

/** 默认对比度 (0-200, 100 为原始) */
export const DEFAULT_CONTRAST = 100;

/** 灰度等级: 0=白, 1=浅灰, 2=深灰, 3=黑 */
export type GrayLevel = 0 | 1 | 2 | 3;
export type PixelGrid = GrayLevel[][];

/**
 * 加载图片文件为 Image 对象
 */
export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/**
 * 将灰度值映射到 4 级灰度
 * 0=白  1=浅灰  2=深灰  3=黑
 */
function luminanceToGrayLevel(luminance: number, contrast: number): GrayLevel {
  // 对比度调整: 以 128 为中心的拉伸
  const adjusted = 128 + (luminance - 128) * (contrast / 100);
  const clamped = Math.max(0, Math.min(255, adjusted));

  // 分 4 个等级
  if (clamped < 64)       return 3;  // 黑
  if (clamped < 112)      return 2;  // 深灰
  if (clamped < 176)      return 1;  // 浅灰
  return 0;                          // 白
}

/**
 * 将图片转换为 4 级灰度像素矩阵
 * @param file - 图片文件
 * @param gridSize - 像素网格大小 (默认 128×128)
 * @param contrast - 对比度 (0-200, 默认 100)
 */
export async function convertImageToPixelGrid(
  file: File,
  gridSize: number = DEFAULT_GRID_SIZE,
  contrast: number = DEFAULT_CONTRAST
): Promise<PixelGrid> {
  const img = await loadImageFromFile(file);

  const canvas = document.createElement('canvas');
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // 先按目标尺寸绘制
  ctx.drawImage(img, 0, 0, gridSize, gridSize);
  const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
  const pixels: PixelGrid = [];

  for (let y = 0; y < gridSize; y++) {
    const row: GrayLevel[] = [];
    for (let x = 0; x < gridSize; x++) {
      const i = (y * gridSize + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      // 标准 luminance 公式
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      row.push(luminanceToGrayLevel(luminance, contrast));
    }
    pixels.push(row);
  }

  return pixels;
}

/**
 * 灰度等级 → 颜色
 */
function grayLevelToColor(level: GrayLevel): string {
  switch (level) {
    case 0: return PIXEL_COLORS.WHITE;
    case 1: return PIXEL_COLORS.LIGHT_GRAY;
    case 2: return PIXEL_COLORS.DARK_GRAY;
    case 3: return PIXEL_COLORS.BLACK;
  }
}

/**
 * 将像素矩阵绘制到 Canvas
 */
export function drawPixelsToCanvas(
  pixels: PixelGrid,
  canvas: HTMLCanvasElement,
  pixelSize: number = 1
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gridSize = pixels.length;
  canvas.width = gridSize * pixelSize;
  canvas.height = gridSize * pixelSize;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.fillStyle = grayLevelToColor(pixels[y][x]);
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
}

/**
 * 将像素矩阵转换为 Data URL (原始尺寸)
 */
export function pixelGridToDataURL(
  pixels: PixelGrid,
  gridSize: number = DEFAULT_GRID_SIZE
): string {
  const canvas = document.createElement('canvas');
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.fillStyle = grayLevelToColor(pixels[y][x]);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas.toDataURL('image/png');
}

/**
 * 将像素矩阵转换为放大后的 Data URL (用于预览)
 * @param pixels - 像素矩阵
 * @param displaySize - 显示边长 (像素)
 */
export function pixelGridToPreviewDataURL(
  pixels: PixelGrid,
  displaySize: number = 320
): string {
  const gridSize = pixels.length;
  const pixelSize = Math.max(1, Math.floor(displaySize / gridSize));

  const canvas = document.createElement('canvas');
  canvas.width = gridSize * pixelSize;
  canvas.height = gridSize * pixelSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.fillStyle = grayLevelToColor(pixels[y][x]);
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
  return canvas.toDataURL('image/png');
}

/**
 * 将 Data URL 转换为 File 对象
 */
export function dataURLtoFile(dataURL: string, filename: string = 'pixel-avatar.png'): File {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new File([u8arr], filename, { type: mime });
}

/**
 * 将图片转换为像素头像并返回 File 对象
 * @param file - 图片文件
 * @param contrast - 对比度 (0-200, 默认 100)
 * @param gridSize - 像素网格大小 (默认 128)
 */
export async function convertToPixelAvatarFile(
  file: File,
  contrast: number = DEFAULT_CONTRAST,
  gridSize: number = DEFAULT_GRID_SIZE
): Promise<File> {
  const pixels = await convertImageToPixelGrid(file, gridSize, contrast);
  const dataURL = pixelGridToDataURL(pixels, gridSize);
  return dataURLtoFile(dataURL, 'pixel-avatar.png');
}
