import { cn } from '@/lib/utils';
import { useReadingProgress } from '@/hooks/useScrollSpy';

interface Props {
  className?: string;
  selector?: string;
}

export default function ReadingProgress({ className, selector = '.reader-main' }: Props) {
  const progress = useReadingProgress({ selector });

  return (
    <div
      className={cn('reader-progress', className)}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`阅读进度 ${progress}%`}
    >
      <div className="reader-progress-bar" style={{ width: `${progress}%` }} />
      <span className="reader-progress-text">{progress}%</span>
    </div>
  );
}
