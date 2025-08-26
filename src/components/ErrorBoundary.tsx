"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button, Result } from "antd";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <Result
            status="error"
            title="Something went wrong"
            subTitle="We're sorry, but something unexpected happened. Please try again."
            extra={[
              <Button type="primary" key="retry" onClick={this.handleRetry}>
                Try Again
              </Button>,
              <Button key="home" onClick={() => (window.location.href = "/")}>
                Go Home
              </Button>,
            ]}
          />

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details
              className="error-details"
              style={{
                marginTop: "2rem",
                padding: "1rem",
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                Error Details (Development Only)
              </summary>
              <div style={{ marginTop: "1rem" }}>
                <strong>Error:</strong> {this.state.error.message}
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <strong>Stack:</strong>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  {this.state.error.stack}
                </pre>
              </div>
              {this.state.errorInfo && (
                <div style={{ marginTop: "0.5rem" }}>
                  <strong>Component Stack:</strong>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      marginTop: "0.5rem",
                      padding: "0.5rem",
                      backgroundColor: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return (error: Error, _errorInfo?: string) => {
    console.error("Error caught by useErrorHandler:", error);

    // In a real app, you might want to throw the error to be caught by ErrorBoundary
    // or send it to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error, { extra: { _errorInfo } });
    }
  };
}

export default ErrorBoundary;
