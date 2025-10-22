interface ErrorLogData {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  buildVersion: string;
  errorBoundary?: boolean;
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, any>;
}

interface ErrorLoggerConfig {
  apiEndpoint?: string;
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  maxRetries: number;
  retryDelay: number;
}

class ErrorLogger {
  private config: ErrorLoggerConfig;
  private sessionId: string = "";
  private errorQueue: ErrorLogData[] = [];
  private isOnline: boolean = false;

  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false, // Will be enabled in production
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      this.sessionId = this.generateSessionId();
      this.setupEventListeners();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Global error handler for unhandled errors
    window.addEventListener("error", (event) => {
      this.logError(event.error || new Error(event.message), {
        severity: "high",
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: "global_error",
        },
      });
    });

    // Global handler for unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.logError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        severity: "high",
        context: {
          reason: event.reason,
          type: "unhandled_promise_rejection",
        },
      });
    });

    // Network status monitoring
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  public logError(
    error: Error,
    options: {
      severity?: "low" | "medium" | "high" | "critical";
      context?: Record<string, any>;
      componentStack?: string;
      errorBoundary?: boolean;
    } = {}
  ): void {
    if (typeof window === "undefined") {
      if (this.config.enableConsoleLogging) {
        console.error("Build-time error caught:", error.message);
      }
      return;
    }
    const errorData: ErrorLogData = {
      message: error.message,
      stack: error.stack || undefined,
      componentStack: options.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      buildVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      errorBoundary: options.errorBoundary || false,
      severity: options.severity || "medium",
      context: options.context,
    };

    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorData);
    }

    if (this.config.enableRemoteLogging) {
      if (this.isOnline) {
        this.sendToRemote(errorData);
      } else {
        this.errorQueue.push(errorData);
      }
    }

    // Store in local storage for offline analysis
    this.storeLocally(errorData);
  }

  private logToConsole(errorData: ErrorLogData): void {
    const style = this.getConsoleStyle(errorData.severity);

    console.group(`%c🚨 SIAM Error [${errorData.severity.toUpperCase()}]`, style);
    console.error("Message:", errorData.message);
    console.error("Timestamp:", errorData.timestamp);
    console.error("Session ID:", errorData.sessionId);

    if (errorData.stack) {
      console.error("Stack Trace:", errorData.stack);
    }

    if (errorData.componentStack) {
      console.error("Component Stack:", errorData.componentStack);
    }

    if (errorData.context) {
      console.error("Context:", errorData.context);
    }

    console.groupEnd();
  }

  private getConsoleStyle(severity: string): string {
    const styles = {
      low: "color: #fbbf24; font-weight: bold;",
      medium: "color: #f97316; font-weight: bold;",
      high: "color: #ef4444; font-weight: bold;",
      critical: "color: #dc2626; font-weight: bold; background: #fef2f2; padding: 2px 4px;",
    };
    return styles[severity as keyof typeof styles] || styles.medium;
  }

  private async sendToRemote(errorData: ErrorLogData, retryCount = 0): Promise<void> {
    if (!this.config.apiEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log("Error logged to remote service successfully");
    } catch (error) {
      console.warn("Failed to send error to remote service:", error);

      if (retryCount < this.config.maxRetries) {
        setTimeout(
          () => {
            this.sendToRemote(errorData, retryCount + 1);
          },
          this.config.retryDelay * Math.pow(2, retryCount)
        ); // Exponential backoff
      } else {
        // Store in queue for later retry
        this.errorQueue.push(errorData);
      }
    }
  }

  private storeLocally(errorData: ErrorLogData): void {
    try {
      const key = `siam_error_${Date.now()}`;
      const stored = localStorage.getItem("siam_error_logs");
      const errorLogs = stored ? JSON.parse(stored) : [];

      errorLogs.push({ key, ...errorData });

      // Keep only last 50 errors to prevent storage bloat
      if (errorLogs.length > 50) {
        errorLogs.splice(0, errorLogs.length - 50);
      }

      localStorage.setItem("siam_error_logs", JSON.stringify(errorLogs));
    } catch (error) {
      console.warn("Failed to store error locally:", error);
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const errorData of errors) {
      await this.sendToRemote(errorData);
    }
  }

  public getStoredErrors(): ErrorLogData[] {
    try {
      if (typeof window === "undefined") return []; // Skip on server-side
      const stored = localStorage.getItem("siam_error_logs");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to retrieve stored errors:", error);
      return [];
    }
  }

  public clearStoredErrors(): void {
    try {
      if (typeof window === "undefined") return; // Skip on server-side
      localStorage.removeItem("siam_error_logs");
    } catch (error) {
      console.warn("Failed to clear stored errors:", error);
    }
  }

  public updateConfig(newConfig: Partial<ErrorLoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger({
  enableConsoleLogging: process.env.NODE_ENV === "development",
  enableRemoteLogging: process.env.NODE_ENV === "production",
  apiEndpoint: process.env.NEXT_PUBLIC_ERROR_LOGGING_ENDPOINT,
});

export default errorLogger;
