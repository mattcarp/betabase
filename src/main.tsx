import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/cinematic-ui.css";

// Theme class removed - using light theme by default

// Simple error boundary to catch mounting issues
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React mounting error:", error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return <div data-testid="app-container">Error loading app</div>;
    }
    return (this.props as any).children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
