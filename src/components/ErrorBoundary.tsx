import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#161618] text-white p-6">
          <div className="bg-red-500/10 p-4 rounded-full mb-6">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center">Something went wrong</h1>
          <p className="text-white/60 mb-8 max-w-md text-center">
            The editor encountered an unexpected error. Don't worry, your changes might be saved.
          </p>
          
          <div className="bg-black/40 p-4 rounded-xl border border-white/10 mb-8 w-full max-w-2xl overflow-auto">
            <p className="font-mono text-sm text-red-400 whitespace-pre-wrap">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Reload Editor
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
