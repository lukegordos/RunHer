import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Enhanced error logging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (error && typeof error === 'object') {
      console.error('Error prototype:', Object.getPrototypeOf(error));
      console.error('Error own property names:', Object.getOwnPropertyNames(error));
      for (const key of Object.getOwnPropertyNames(error)) {
        console.error(`Error property [${key}]:`, (error as any)[key]);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Oops! Something went wrong.
            </h2>
            <p className="text-muted-foreground mb-6">
              We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
            </p>
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer mb-2 hover:text-foreground">
                Technical Details
              </summary>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                {this.state.error && typeof this.state.error === 'object'
                  ? [
                      `Type: ${this.state.error.constructor?.name}`,
                      `Message: ${this.state.error.message}`,
                      `Stack: ${this.state.error.stack}`,
                    ].join('\n\n')
                  : String(this.state.error)}
              </pre>
            </details>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
