import { Component, ErrorInfo, ReactNode } from "react";
// import { toast } from "sonner";
const toast = { 
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
  info: (msg: string) => console.info('ℹ️', msg)
};
import { errorLogger } from "../services/errorLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SIAM Error Boundary caught an error:", error, errorInfo);

    // Show user-friendly error notification
    toast.error(`An unexpected error occurred: ${error.message}`);

    // Log to centralized logging service (in production, this would go to a service like Sentry)
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    // Use centralized error logger
    errorLogger.logError(error, {
      severity: "critical",
      componentStack: errorInfo.componentStack || "",
      errorBoundary: true,
      context: {
        component: "ErrorBoundary",
        props: Object.keys(this.props),
        state: this.state,
      },
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4"
            data-testid="error-boundary"
          >
            <div className="text-center max-w-md mx-auto border border-green-400 p-8 bg-black/80">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold mb-4 text-green-400">
                SIAM System Error
              </h1>
              <p className="text-green-300 mb-6">
                An unexpected error occurred. The error has been logged and
                reported.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-green-900/50 border border-green-400 text-green-400 hover:bg-green-900/70 transition-colors"
                  data-testid="reload-button"
                >
                  Reload Application
                </button>
                <details className="text-left">
                  <summary className="cursor-pointer text-green-300 hover:text-green-400">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-black/50 border border-green-700 text-xs text-green-500 overflow-auto max-h-32">
                    {this.state.error?.message}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
