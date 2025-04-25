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
        <div style={{ color: 'red', padding: 24 }}>
          <h2>Something went wrong.</h2>
          <pre>
            {this.state.error && typeof this.state.error === 'object'
              ? [
                  `Type: ${this.state.error.constructor?.name}`,
                  `Message: ${this.state.error.message}`,
                  `Stack: ${this.state.error.stack}`,
                  `All properties: ${JSON.stringify(this.state.error, Object.getOwnPropertyNames(this.state.error), 2)}`
                ].join('\n\n')
              : String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
