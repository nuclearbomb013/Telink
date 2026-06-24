export default function ReaderDetailSkeleton() {
  return (
    <div className="reader-shell">
      <div className="reader-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="reader-grid animate-pulse">
          <aside className="reader-sidebar-left">
            <div className="mb-6 h-4 w-24 rounded bg-[var(--reader-line)]" />
            <div className="space-y-5">
              <div className="h-3 w-16 rounded bg-[var(--reader-line)]" />
              <div className="h-4 w-28 rounded bg-[var(--reader-line)]" />
              <div className="h-3 w-20 rounded bg-[var(--reader-line)]" />
              <div className="h-4 w-24 rounded bg-[var(--reader-line)]" />
            </div>
          </aside>

          <main className="reader-main">
            <div className="mb-4 h-6 w-28 rounded bg-[var(--reader-line)]" />
            <div className="mb-4 h-10 max-w-[620px] rounded bg-[var(--reader-line)]" />
            <div className="mb-8 h-5 max-w-[420px] rounded bg-[var(--reader-line)]" />
            <div className="mb-8 h-40 max-w-[var(--reader-content-width)] rounded bg-[var(--reader-line)]" />
            <div className="space-y-4">
              <div className="h-4 max-w-[var(--reader-content-width)] rounded bg-[var(--reader-line)]" />
              <div className="h-4 max-w-[680px] rounded bg-[var(--reader-line)]" />
              <div className="h-4 max-w-[610px] rounded bg-[var(--reader-line)]" />
              <div className="h-28 max-w-[var(--reader-content-width)] rounded bg-[var(--reader-line)]" />
            </div>
          </main>

          <aside className="reader-sidebar-right">
            <div className="mb-4 h-4 w-20 rounded bg-[var(--reader-line)]" />
            <div className="space-y-3 border-l border-[var(--reader-line)] pl-4">
              <div className="h-3 w-40 rounded bg-[var(--reader-line)]" />
              <div className="h-3 w-32 rounded bg-[var(--reader-line)]" />
              <div className="h-3 w-36 rounded bg-[var(--reader-line)]" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
