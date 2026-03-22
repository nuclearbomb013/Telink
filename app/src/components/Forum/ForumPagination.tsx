/**
 * ForumPagination - 论坛分页组件
 *
 * 基于 shadcn/ui Pagination 组件
 */

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

export interface ForumPaginationProps {
  /** 当前页码 */
  page: number;
  /** 总页数 */
  totalPages: number;
  /** 页码变化回调 */
  onPageChange?: (page: number) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * ForumPagination 组件
 */
const ForumPagination = ({
  page,
  totalPages,
  onPageChange,
  className,
}: ForumPaginationProps) => {
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && onPageChange) {
      onPageChange(newPage);
    }
  };

  // 生成页码列表（最多显示 7 个页码）
  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | 'ellipsis')[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    // 添加省略号和边界
    if (page - delta > 2) {
      range.unshift('ellipsis');
    }
    if (page + delta < totalPages - 1) {
      range.push('ellipsis');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  if (totalPages <= 1) return null;

  const range = getPaginationRange();

  return (
    <Pagination className={cn('justify-center', className)}>
      <PaginationContent>
        {/* 上一页 */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : 0}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(page - 1);
            }}
            className={cn(
              page === 1 && 'pointer-events-none opacity-50'
            )}
          />
        </PaginationItem>

        {/* 页码 */}
        {range.map((item, index) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                aria-current={item === page ? 'page' : undefined}
                isActive={item === page}
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(item);
                }}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        {/* 下一页 */}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page === totalPages}
            tabIndex={page === totalPages ? -1 : 0}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(page + 1);
            }}
            className={cn(
              page === totalPages && 'pointer-events-none opacity-50'
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default ForumPagination;
