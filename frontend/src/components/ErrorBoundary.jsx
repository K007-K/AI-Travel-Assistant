import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log to error reporting service in production
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught:', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Something went wrong
                        </h2>

                        <p className="text-muted-foreground mb-6">
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 text-left bg-slate-100 dark:bg-slate-800 rounded-xl p-4 text-sm">
                                <summary className="cursor-pointer font-medium text-red-600 dark:text-red-400">
                                    Error Details (Dev Only)
                                </summary>
                                <pre className="mt-2 overflow-auto text-xs text-slate-600 dark:text-slate-300">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>

                            <Link
                                to="/"
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-foreground rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
