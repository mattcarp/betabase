"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TestDashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a Turbopack HMR error
    if (error.message?.includes("module factory is not available")) {
      // Suppress HMR errors - they're usually transient
      console.warn("Suppressing Turbopack HMR error:", error.message);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (!error.message?.includes("module factory is not available")) {
      console.error("TestDashboard error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-4">
            <h2 className="mac-heading">Test Dashboard Error</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Something went wrong"}
            </p>
            <button className="mac-button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


