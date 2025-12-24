
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">🤕</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-gray-600 text-sm">
              We encountered an unexpected error. Our team has been notified.
            </p>
            {this.state.error && (
                <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono text-left overflow-auto max-h-32 border border-slate-200">
                    {this.state.error.toString()}
                </div>
            )}
            <div className="pt-2 flex gap-3 justify-center">
                <button 
                    onClick={this.handleRetry} 
                    className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition"
                >
                    Try Again
                </button>
                <button 
                    onClick={this.handleReload} 
                    className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-700 transition shadow-lg shadow-brand/20"
                >
                    Reload App
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
