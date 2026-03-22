import React, { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to be wrapped */
  children: ReactNode;
  /** Custom fallback UI to display when an error occurs */
  fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error?: Error;
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the
 * component tree that crashed.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log errors to console and/or error tracking service
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // TODO: Send error to tracking service (e.g., Sentry)
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  /**
   * Reload the page to recover from error
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Reset the error state for testing purposes
   */
  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-linen px-4">
          <div className="text-center max-w-md">
            {/* Error icon */}
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-brand-text"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error message */}
            <h1 className="font-oswald text-2xl text-brand-text mb-3">
              出错了
            </h1>
            <p className="font-roboto text-brand-dark-gray mb-2">
              抱歉，页面遇到了一些问题
            </p>

            {/* Error details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer font-roboto text-sm text-brand-light-gray hover:text-brand-dark-gray">
                  错误详情
                </summary>
                <pre className="mt-2 p-3 bg-brand-black/5 rounded text-xs font-mono text-brand-dark-gray overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-text text-brand-linen font-roboto text-sm uppercase tracking-wider hover:bg-brand-dark-gray transition-colors cursor-hover"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                刷新页面
              </button>

              {import.meta.env.DEV && (
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center justify-center px-6 py-2.5 border border-brand-text text-brand-text font-roboto text-sm uppercase tracking-wider hover:bg-brand-text/5 transition-colors cursor-hover"
                >
                  重试
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for using ErrorBoundary with hooks
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
