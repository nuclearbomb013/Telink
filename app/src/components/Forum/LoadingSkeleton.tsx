/**
 * LoadingSkeleton - 加载骨架屏组件
 *
 * 在数据加载时显示占位符动画，提升用户体验
 */

import { cn } from '@/lib/utils';

/**
 * 骨架屏基础组件
 */
interface SkeletonProps {
  className?: string;
  animation?: boolean;
}

/**
 * 骨架屏动画样式
 */
const shimmerAnimation = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
`;

/**
 * Skeleton 基础组件
 */
export function Skeleton({ className, animation = true }: SkeletonProps) {
  return (
    <>
      {animation && (
        <style>{shimmerAnimation}</style>
      )}
      <div
        className={cn(
          'bg-gradient-to-r from-brand-border/20 via-brand-border/30 to-brand-border/20 rounded',
          animation && 'animate-pulse',
          className
        )}
        style={
          animation
            ? {
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite linear',
              }
            : {}
        }
      />
    </>
  );
}

/**
 * 帖子列表骨架屏
 */
interface PostListSkeletonProps {
  count?: number;
}

export function PostListSkeleton({ count = 5 }: PostListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-6 border border-brand-border/30"
        >
          <div className="flex items-start gap-4">
            {/* 封面图占位 */}
            <Skeleton className="w-24 h-24 flex-shrink-0 rounded-lg" />
            {/* 内容占位 */}
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 帖子详情骨架屏
 */
export function PostDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 border border-brand-border/30">
      {/* 标题 */}
      <Skeleton className="h-8 w-3/4 mb-4" />
      {/* 作者信息 */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-brand-border/30">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {/* 内容 */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* 标签 */}
      <div className="flex gap-2 mt-6 pt-6 border-t border-brand-border/30">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

/**
 * 评论区骨架屏
 */
interface CommentsSkeletonProps {
  count?: number;
}

export function CommentsSkeleton({ count = 3 }: CommentsSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white/50 rounded-lg p-4 border border-brand-border/30"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 统计面板骨架屏
 */
export function StatsSidebarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border border-brand-border/30">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 border border-brand-border/30">
        <Skeleton className="h-5 w-20 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 用户列表骨架屏
 */
interface UserListSkeletonProps {
  count?: number;
}

export function UserListSkeleton({ count = 5 }: UserListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3"
        >
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
