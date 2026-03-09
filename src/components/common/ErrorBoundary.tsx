import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.fallback) {
                return this.fallback;
            }

            return (
                <div className="p-8 my-4 bg-red-50 rounded-3xl border-2 border-dashed border-red-200 text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-500 mx-auto shadow-sm">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-black text-gray-900">Đã xảy ra lỗi nội bộ</h3>
                        <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">
                            Không thể hiển thị phần này do một lỗi kỹ thuật. Bạn có thể thử tải lại trang.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                    >
                        <RefreshCw size={18} /> Tải lại trang
                    </button>
                </div>
            );
        }

        return this.children;
    }

    private get children() {
        return this.props.children;
    }

    private get fallback() {
        return this.props.fallback;
    }
}

export default ErrorBoundary;
