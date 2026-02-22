import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-stone-50 p-8 text-center">
          <div className="max-w-md">
            <div className="text-4xl mb-4">📖</div>
            <h1 className="text-xl font-semibold text-stone-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-stone-500 mb-1">
              The editor encountered an unexpected error. Your work is likely safe — it was autosaved to your browser.
            </p>
            {this.state.error && (
              <p className="text-xs text-stone-400 font-mono mt-2 mb-4 bg-stone-100 rounded px-3 py-2 text-left break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-dj-prussian text-white text-sm rounded-lg hover:bg-dj-teal transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
